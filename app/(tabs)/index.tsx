import { Ionicons } from '@expo/vector-icons';
import { isBefore, startOfDay } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SectionList, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentCard } from '../../src/components/DocumentCard';
import { addDocument, deleteDocument, Document, getDocuments, initDatabase, updateDocument } from '../../src/services/database';
import { deleteFile, initFileStorage, saveFile } from '../../src/services/fileStorage';
import { ApiKeyMissingError, parseDocumentWithGemini } from '../../src/services/geminiParser';
import { theme } from '../../src/theme';

const showToast = (msg: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('', msg);
  }
};

interface Section {
  title: string;
  data: Document[];
}

export default function TimelineScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]); // Keep track for selection logic
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false); // for add/reprocess button state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Initialise DB and storage once
  useEffect(() => {
    try {
      initDatabase();
      initFileStorage();
      loadDocuments();
    } catch (e) {
      console.error('Initialization failed', e);
    }
  }, []);

  const loadDocuments = useCallback(() => {
    setLoading(true);
    try {
      const docs = getDocuments();
      setAllDocuments(docs);

      const today = startOfDay(new Date());

      const upcoming = docs.filter(d => !isBefore(new Date(d.docDate), today));
      const past = docs.filter(d => isBefore(new Date(d.docDate), today));

      // Sort Upcoming: ASC (Nearest first) - already sorted by DB query
      // Sort Past: DESC (Newest first) - need to reverse
      const pastSorted = [...past].reverse();

      const newSections: Section[] = [];
      if (upcoming.length > 0) {
        newSections.push({ title: 'Upcoming', data: upcoming });
      }
      if (pastSorted.length > 0) {
        newSections.push({ title: 'Past', data: pastSorted });
      }

      setSections(newSections);
    } catch (e) {
      console.error('Failed to load documents', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setProcessing(true);
      const asset = result.assets[0];

      // Save file locally
      const savedUri = await saveFile(asset.uri);

      // Insert placeholder with processing flag
      const placeholderTitle = asset.name || 'Untitled';
      const placeholderDate = new Date().toISOString();
      const placeholderType = asset.mimeType?.includes('pdf') ? 'PDF' : 'Image';
      const docId = addDocument(
        savedUri,
        placeholderTitle,
        placeholderDate,
        placeholderType,
        '', // owner unknown yet
        1 // processing = true
      );
      loadDocuments();
      showToast('Document added');

      // Parse in background
      parseDocumentWithGemini(savedUri)
        .then((parsedDataArray) => {
          // 1. Update the original placeholder with the first result
          const firstItem = parsedDataArray[0];
          updateDocument(
            docId,
            firstItem.title,
            firstItem.date,
            firstItem.type,
            firstItem.owner,
            0
          );

          // 2. If multiple items found, create new entries for the rest
          if (parsedDataArray.length > 1) {
            for (let i = 1; i < parsedDataArray.length; i++) {
              const item = parsedDataArray[i];
              addDocument(
                savedUri, // Share the same file URI
                item.title,
                item.date,
                item.type,
                item.owner,
                0 // Not processing
              );
            }
            showToast(`Found ${parsedDataArray.length} items`);
          }

          loadDocuments();

          // Check for missing fields and auto-navigate
          if (firstItem.missingFields && firstItem.missingFields.length > 0) {
            router.push({
              pathname: '/document-view',
              params: {
                uri: savedUri,
                title: firstItem.title,
                id: docId,
                autoEdit: 'true',
                missingFields: JSON.stringify(firstItem.missingFields)
              }
            });
          }
        })
        .catch((e) => {
          console.error('Parsing failed', e);
          // Mark as not processing even on failure
          updateDocument(docId, placeholderTitle, placeholderDate, placeholderType, '', 0);
          loadDocuments();

          // Check if error is about missing API key
          if (e instanceof ApiKeyMissingError) {
            Alert.alert(
              'API Key Required',
              'Please configure your Gemini API key in Settings to enable document parsing.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Go to Settings',
                  onPress: () => router.push('/settings')
                }
              ]
            );
          }
        });
    } catch (error) {
      console.error(error);
      showToast('Failed to add document');
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      if (newSelected.size === 0) setSelectionMode(false);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleLongPress = (id: number) => {
    setSelectionMode(true);
    toggleSelection(id);
  };

  const handlePress = (doc: Document) => {
    if (selectionMode) {
      toggleSelection(doc.id);
    } else {
      router.push({ pathname: '/document-view', params: { uri: doc.uri, title: doc.title, id: doc.id } });
    }
  };

  const handleDelete = async () => {
    Alert.alert('Delete Documents', `Are you sure you want to delete ${selectedIds.size} document(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const docsToDelete = allDocuments.filter((d) => selectedIds.has(d.id));
            for (const doc of docsToDelete) {
              await deleteFile(doc.uri);
              deleteDocument(doc.id);
            }
            setSelectionMode(false);
            setSelectedIds(new Set());
            loadDocuments();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete documents');
          }
        },
      },
    ]);
  };

  const handleReprocess = async () => {
    setProcessing(true);
    try {
      const docsToReprocess = allDocuments.filter((d) => selectedIds.has(d.id));
      let successCount = 0;

      for (const doc of docsToReprocess) {
        try {
          // Mark as processing
          updateDocument(doc.id, doc.title, doc.docDate, doc.type, doc.owner, 1);
          const parsedDataArray = await parseDocumentWithGemini(doc.uri);

          // 1. Update the original doc with the first result
          const firstItem = parsedDataArray[0];
          updateDocument(
            doc.id,
            firstItem.title,
            firstItem.date,
            firstItem.type,
            firstItem.owner,
            0
          );

          // 2. If multiple items found, create new entries for the rest
          if (parsedDataArray.length > 1) {
            for (let i = 1; i < parsedDataArray.length; i++) {
              const item = parsedDataArray[i];
              addDocument(
                doc.uri, // Share the same file URI
                item.title,
                item.date,
                item.type,
                item.owner,
                0
              );
            }
          }

          successCount++;
        } catch (e) {
          console.error(`Failed to reprocess doc ${doc.id}`, e);
          // Reset processing flag on error
          updateDocument(doc.id, doc.title, doc.docDate, doc.type, doc.owner, 0);

          // Check if error is about missing API key
          if (e instanceof ApiKeyMissingError) {
            Alert.alert(
              'API Key Required',
              'Please configure your Gemini API key in Settings to enable document parsing.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Go to Settings',
                  onPress: () => router.push('/settings')
                }
              ]
            );
            // Break out of the loop since all will fail without API key
            break;
          }
        }
      }

      showToast(`Reprocessed ${successCount} document(s)`);
      setSelectionMode(false);
      setSelectedIds(new Set());
      loadDocuments();
    } catch (e) {
      showToast('Failed to reprocess documents');
    } finally {
      setProcessing(false);
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {selectionMode ? (
          <>
            <TouchableOpacity onPress={cancelSelection} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.selectionActions}>
              <TouchableOpacity onPress={handleReprocess} style={styles.actionButton}>
                <Ionicons name="refresh" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerButton}>
              <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Travel Docs</Text>
            <TouchableOpacity
              onPress={handleAddDocument}
              disabled={processing}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.headerButton}
            >
              {processing ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="add-circle" size={32} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <DocumentCard
              doc={item}
              selected={selectedIds.has(item.id)}
              processing={item.processing === 1}
              onPress={() => handlePress(item)}
              onLongPress={() => handleLongPress(item.id)}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={64} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>No documents yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add your first trip</Text>
            </View>
          }
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    ...theme.typography.h1,
  },
  headerButton: {
    padding: theme.spacing.xs,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: theme.spacing.l,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  list: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },
  loader: {
    marginTop: 50,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    ...theme.typography.h2,
    marginTop: theme.spacing.m,
    color: theme.colors.textSecondary,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    marginTop: theme.spacing.s,
  },
  sectionHeader: {
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.s,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.xs,
  },
  sectionHeaderText: {
    ...theme.typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

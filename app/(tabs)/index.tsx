import { Ionicons } from '@expo/vector-icons';
import { isBefore, startOfDay } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SectionList, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentCard } from '../../src/components/DocumentCard';
import { TripCard } from '../../src/components/TripCard';
import { useDocumentPicker } from '../../src/hooks/useDocumentPicker';
import { addDocument, deleteDocument, deleteTrip, Document, getDocuments, getTripById, getTrips, initDatabase, Trip, updateDocument } from '../../src/services/database';
import { deleteFile, initFileStorage, saveFile } from '../../src/services/fileStorage';
import { ApiKeyMissingError, parseDocumentWithGemini } from '../../src/services/geminiParser';
import { getAutoParseEnabled } from '../../src/services/settingsStorage';
import { theme } from '../../src/theme';

const showToast = (msg: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('', msg);
  }
};

interface TripWithDocs extends Trip {
  documents: Document[];
  type: 'Trip'; // Discriminator
}

type TimelineItem = Document | TripWithDocs;

interface Section {
  title: string;
  data: TimelineItem[];
}

export default function TimelineScreen() {
  const router = useRouter();
  const { pickDocument, PickerModal } = useDocumentPicker();
  const [sections, setSections] = useState<Section[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]); // Keep track for selection logic
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false); // for add/reprocess button state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      const trips = getTrips();
      setAllDocuments(docs);

      // Group docs by trip
      const tripsWithDocs: TripWithDocs[] = trips.map(trip => ({
        ...trip,
        documents: docs.filter(d => d.tripId === trip.id),
        type: 'Trip'
      }));

      const standaloneDocs = docs.filter(d => !d.tripId);

      const combined: TimelineItem[] = [...tripsWithDocs, ...standaloneDocs];
      const today = startOfDay(new Date());

      const getDate = (item: TimelineItem) => {
        if ('startDate' in item) return new Date(item.startDate);
        return new Date(item.docDate);
      };

      const upcoming = combined.filter(item => !isBefore(getDate(item), today));
      const past = combined.filter(item => isBefore(getDate(item), today));

      // Sort Upcoming: ASC (Nearest first)
      upcoming.sort((a, b) => getDate(a).getTime() - getDate(b).getTime());

      // Sort Past: DESC (Newest first)
      past.sort((a, b) => getDate(b).getTime() - getDate(a).getTime());

      const newSections: Section[] = [];
      if (upcoming.length > 0) {
        newSections.push({ title: 'Upcoming', data: upcoming });
      }
      if (past.length > 0) {
        newSections.push({ title: 'Past', data: past });
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

  const handleAddDocument = async (tripId?: number) => {
    try {
      const result = await pickDocument();
      if (!result) return; // User cancelled

      setProcessing(true);
      const autoParseEnabled = await getAutoParseEnabled();

      // Save file locally
      const savedUri = await saveFile(result.uri, result.name);

      // Insert placeholder with processing flag
      const placeholderTitle = result.name || 'Untitled';
      const placeholderDate = new Date().toISOString();
      const placeholderType = result.mimeType?.includes('pdf') ? 'PDF' : 'Image';
      const docId = addDocument(
        savedUri,
        placeholderTitle,
        placeholderDate,
        placeholderType,
        undefined, // subType unknown yet
        '', // owner unknown yet
        autoParseEnabled ? 1 : 0, // processing = true only if auto-parse is on
        tripId // Optional tripId
      );
      loadDocuments();
      showToast('Document added');

      if (!autoParseEnabled) {
        // If auto-parse is disabled, navigate directly to edit
        router.push({
          pathname: '/document-view',
          params: {
            uri: savedUri,
            title: placeholderTitle,
            id: docId,
            autoEdit: 'true',
          }
        });
        return;
      }

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
            firstItem.subType,
            firstItem.owner,
            0,
            tripId
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
                item.subType,
                item.owner,
                0, // Not processing
                tripId
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
          updateDocument(docId, placeholderTitle, placeholderDate, placeholderType, undefined, undefined, 0, tripId);
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

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      if (newSelected.size === 0) setSelectionMode(false);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleLongPress = (type: 'doc' | 'trip', id: number) => {
    setSelectionMode(true);
    toggleSelection(`${type}-${id}`);
  };

  const handlePress = (doc: Document) => {
    if (selectionMode) {
      toggleSelection(`doc-${doc.id}`);
    } else {
      router.push({ pathname: '/document-view', params: { uri: doc.uri, title: doc.title, id: doc.id } });
    }
  };

  const handleDelete = async () => {
    Alert.alert('Delete Items', `Are you sure you want to delete ${selectedIds.size} item(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const ids = Array.from(selectedIds);

            // Delete Documents
            const docIds = ids
              .filter(id => id.startsWith('doc-'))
              .map(id => Number(id.replace('doc-', '')));

            const docsToDelete = allDocuments.filter((d) => docIds.includes(d.id));
            for (const doc of docsToDelete) {
              await deleteFile(doc.uri);
              deleteDocument(doc.id);
            }

            // Delete Trips
            const tripIds = ids
              .filter(id => id.startsWith('trip-'))
              .map(id => Number(id.replace('trip-', '')));

            for (const tripId of tripIds) {
              deleteTrip(tripId);
            }

            setSelectionMode(false);
            setSelectedIds(new Set());
            loadDocuments();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete items');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    // Get selected trip and document IDs
    const tripIds = Array.from(selectedIds)
      .filter(id => id.startsWith('trip-'))
      .map(id => Number(id.replace('trip-', '')));

    const docIds = Array.from(selectedIds)
      .filter(id => id.startsWith('doc-'))
      .map(id => Number(id.replace('doc-', '')));

    // Don't allow mixed selection
    if (tripIds.length > 0 && docIds.length > 0) {
      Alert.alert('Edit', 'Please select only trips or only documents, not both.');
      return;
    }

    // Handle single trip editing
    if (tripIds.length === 1 && docIds.length === 0) {
      const trip = getTripById(tripIds[0]);
      if (trip) {
        router.push({
          pathname: '/edit-trip',
          params: {
            id: trip.id.toString(),
            title: trip.title,
            startDate: trip.startDate,
            endDate: trip.endDate,
          },
        });
        setSelectionMode(false);
        setSelectedIds(new Set());
      }
      return;
    }

    // Handle single document editing
    if (docIds.length === 1 && tripIds.length === 0) {
      const doc = allDocuments.find(d => d.id === docIds[0]);
      if (doc) {
        router.push({
          pathname: '/document-view',
          params: {
            uri: doc.uri,
            title: doc.title,
            id: doc.id.toString(),
            autoEdit: 'true',
          },
        });
        setSelectionMode(false);
        setSelectedIds(new Set());
      }
      return;
    }

    // Handle bulk document editing
    if (docIds.length > 1) {
      router.push({
        pathname: '/bulk-edit',
        params: {
          docIds: docIds.join(','),
        },
      });
      setSelectionMode(false);
      setSelectedIds(new Set());
      return;
    }

    // Handle multiple trips selected
    if (tripIds.length > 1) {
      Alert.alert('Edit', 'Bulk editing trips is not supported. Please select exactly one trip to edit.');
      return;
    }

    // No items selected
    Alert.alert('Edit', 'Please select at least one item to edit.');
  };

  const handleReprocess = async () => {
    const autoParseEnabled = await getAutoParseEnabled();
    if (!autoParseEnabled) {
      Alert.alert(
        'Auto-Parsing Disabled',
        'Please enable auto-parsing in Settings to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Settings',
            onPress: () => router.push('/settings')
          }
        ]
      );
      return;
    }

    setProcessing(true);
    try {
      const docIds = Array.from(selectedIds)
        .filter(id => id.startsWith('doc-'))
        .map(id => Number(id.replace('doc-', '')));

      const docsToReprocess = allDocuments.filter((d) => docIds.includes(d.id));
      let successCount = 0;

      for (const doc of docsToReprocess) {
        try {
          // Mark as processing
          updateDocument(doc.id, doc.title, doc.docDate, doc.type, doc.subType, doc.owner, 1, doc.tripId);
          const parsedDataArray = await parseDocumentWithGemini(doc.uri);

          // 1. Update the original doc with the first result
          const firstItem = parsedDataArray[0];
          updateDocument(
            doc.id,
            firstItem.title,
            firstItem.date,
            firstItem.type,
            firstItem.subType,
            firstItem.owner,
            0,
            doc.tripId
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
                item.subType,
                item.owner,
                0,
                doc.tripId
              );
            }
          }

          successCount++;
        } catch (e) {
          console.error(`Failed to reprocess doc ${doc.id}`, e);
          // Reset processing flag on error
          updateDocument(doc.id, doc.title, doc.docDate, doc.type, doc.subType, doc.owner, 0, doc.tripId);

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
              <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
                <Ionicons name="pencil" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Timeline</Text>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerButton}>
              <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.addTripButton}
        onPress={() => router.push('/add-trip')}
      >
        <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.addTripButtonText}>Add Trip</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            if ('startDate' in item) {
              // It's a Trip
              return (
                <TripCard
                  trip={item}
                  documents={item.documents}
                  selected={selectedIds.has(`trip-${item.id}`)}
                  selectedDocIds={new Set(
                    Array.from(selectedIds)
                      .filter(id => id.startsWith('doc-'))
                      .map(id => Number(id.replace('doc-', '')))
                  )}
                  onPressDocument={handlePress}
                  onLongPressDocument={(id) => handleLongPress('doc', id)}
                  onAddDocument={handleAddDocument}
                  onLongPress={() => handleLongPress('trip', item.id)}
                />
              );
            }
            // It's a Document
            return (
              <DocumentCard
                doc={item}
                selected={selectedIds.has(`doc-${item.id}`)}
                processing={item.processing === 1}
                onPress={() => handlePress(item)}
                onLongPress={() => handleLongPress('doc', item.id)}
              />
            );
          }}
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

      <PickerModal />
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
    marginLeft: theme.spacing.s,
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
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
  },
  sectionHeaderText: {
    ...theme.typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: theme.colors.textSecondary,
  },
  addTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.m,
    marginHorizontal: theme.spacing.m,
    marginTop: theme.spacing.s,
    backgroundColor: theme.colors.primary + '10', // Very light primary bg
    borderRadius: 100, // Pill shape
    gap: theme.spacing.s,
  },
  addTripButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});

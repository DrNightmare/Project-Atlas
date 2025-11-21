import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentCard } from '../../src/components/DocumentCard';
import { addDocument, deleteDocument, Document, getDocuments, initDatabase, updateDocument } from '../../src/services/database';
import { deleteFile, initFileStorage, saveFile } from '../../src/services/fileStorage';
import { parseDocumentWithGemini } from '../../src/services/geminiParser';

const showToast = (msg: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('', msg);
  }
};

export default function TimelineScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
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
      setDocuments(docs);
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
      const placeholderTitle = asset.fileName || 'Untitled';
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
        .then((parsedData) => {
          updateDocument(
            docId,
            parsedData.title,
            parsedData.date,
            parsedData.type,
            parsedData.owner,
            0
          );
          loadDocuments();
        })
        .catch((e) => {
          console.error('Parsing failed', e);
          // Mark as not processing even on failure
          updateDocument(docId, placeholderTitle, placeholderDate, placeholderType, '', 0);
          loadDocuments();
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
      router.push({ pathname: '/document-view', params: { uri: doc.uri, title: doc.title } });
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
            const docsToDelete = documents.filter((d) => selectedIds.has(d.id));
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
      const docsToReprocess = documents.filter((d) => selectedIds.has(d.id));
      let successCount = 0;

      for (const doc of docsToReprocess) {
        try {
          // Mark as processing
          updateDocument(doc.id, doc.title, doc.docDate, doc.type, doc.owner, 1);
          const parsedData = await parseDocumentWithGemini(doc.uri);
          updateDocument(
            doc.id,
            parsedData.title,
            parsedData.date,
            parsedData.type,
            parsedData.owner,
            0
          );
          successCount++;
        } catch (e) {
          console.error(`Failed to reprocess doc ${doc.id}`, e);
          // Reset processing flag on error
          updateDocument(doc.id, doc.title, doc.docDate, doc.type, doc.owner, 0);
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
            <TouchableOpacity onPress={cancelSelection}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.selectionActions}>
              <TouchableOpacity onPress={handleReprocess} style={styles.actionButton}>
                <Text style={styles.reprocessButton}>Reprocess</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Text style={styles.deleteButton}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>Travel Docs</Text>
            <TouchableOpacity onPress={handleAddDocument} disabled={processing} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.addButton}>{processing ? '...' : 'Add'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={documents}
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
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No documents yet. Tap 'Add' to start.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    height: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  deleteButton: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  reprocessButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
    fontSize: 16,
  },
});

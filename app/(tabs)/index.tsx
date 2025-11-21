import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentCard } from '../../src/components/DocumentCard';
import { addDocument, deleteDocument, Document, getDocuments, initDatabase, updateDocument } from '../../src/services/database';
import { deleteFile, initFileStorage, saveFile } from '../../src/services/fileStorage';
import { parseDocumentWithGemini } from '../../src/services/geminiParser';

export default function TimelineScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Initialize DB and Storage on mount
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

      // 1. Save file locally
      const savedUri = await saveFile(asset.uri);

      // 2. Mock Parse
      const parsedData = await parseDocumentWithGemini(savedUri);

      // 3. Save to DB
      addDocument(savedUri, parsedData.title, parsedData.date, parsedData.type, parsedData.owner);

      // 4. Refresh
      loadDocuments();
      Alert.alert('Success', 'Document added successfully!');

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add document');
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      if (newSelected.size === 0) {
        setSelectionMode(false);
      }
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
      router.push({
        pathname: '/document-view',
        params: { uri: doc.uri, title: doc.title }
      });
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Documents',
      `Are you sure you want to delete ${selectedIds.size} document(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const docsToDelete = documents.filter(d => selectedIds.has(d.id));
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
          }
        }
      ]
    );
  };

  const handleReprocess = async () => {
    setProcessing(true);
    try {
      const docsToReprocess = documents.filter(d => selectedIds.has(d.id));
      let successCount = 0;

      for (const doc of docsToReprocess) {
        try {
          const parsedData = await parseDocumentWithGemini(doc.uri);
          // Assuming updateDocument is imported and available
          // We need to update the import statement first, but for now I'll assume it's there
          // or I will fix the import in a separate step if needed.
          // Actually, I should have updated the import in the previous step or this one.
          // Let's assume I'll fix the import below or it was already imported (it wasn't).
          // Wait, I can't assume. I need to update the import.
          // I will update the import in this same tool call if possible? No, single contiguous block.
          // I will update the import in a separate tool call.
          // For now, I will use a placeholder and fix it immediately.
          // Actually, I can just use the function if I import it.
          // Let's just add the logic here and I'll fix the import in the next step.
          updateDocument(doc.id, parsedData.title, parsedData.date, parsedData.type, parsedData.owner);
          successCount++;
        } catch (e) {
          console.error(`Failed to reprocess doc ${doc.id}`, e);
        }
      }

      Alert.alert('Success', `Reprocessed ${successCount} document(s)`);
      setSelectionMode(false);
      setSelectedIds(new Set());
      loadDocuments();
    } catch (e) {
      Alert.alert('Error', 'Failed to reprocess documents');
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
            <TouchableOpacity
              onPress={handleAddDocument}
              disabled={processing}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
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
              onPress={() => handlePress(item)}
              onLongPress={() => handleLongPress(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No documents yet. Tap 'Add' to start.</Text>
          }
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

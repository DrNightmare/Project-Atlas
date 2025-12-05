import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingActionButton } from '../../src/components/FloatingActionButton';
import { IdentityDocumentCard } from '../../src/components/IdentityDocumentCard';
import { SelectionHeader } from '../../src/components/SelectionHeader';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useDocumentPicker } from '../../src/hooks/useDocumentPicker';
import { useSelectionMode } from '../../src/hooks/useSelectionMode';
import { addIdentityDocument, deleteIdentityDocument, getIdentityDocuments, IdentityDocument, initDatabase, updateIdentityDocument } from '../../src/services/database';
import { deleteFile, saveFile } from '../../src/services/fileStorage';
import { ApiKeyMissingError } from '../../src/services/geminiParser';
import { parseIdentityDocumentWithGemini } from '../../src/services/identityParser';
import { getAutoParseEnabled } from '../../src/services/settingsStorage';

const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
        Alert.alert('', msg);
    }
};

export default function IdentityScreen() {
    const router = useRouter();
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { pickDocument, PickerModal } = useDocumentPicker();
    const [documents, setDocuments] = useState<IdentityDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Shared Selection Hook
    const {
        selectionMode,
        selectedIds,
        toggleSelection,
        resetSelection,
        confirmDelete,
        setSelectionMode
    } = useSelectionMode();

    // Load documents when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadDocuments();
        }, [])
    );

    const loadDocuments = () => {
        setLoading(true);
        try {
            initDatabase();
            const docs = getIdentityDocuments();
            setDocuments(docs);
        } catch (e) {
            console.error('Failed to load identity documents', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDocument = async () => {
        try {
            setProcessing(true);

            // 1. Pick document
            const result = await pickDocument();
            if (!result) {
                setProcessing(false);
                return;
            }

            const autoParseEnabled = await getAutoParseEnabled();

            // 2. Save file
            const savedUri = await saveFile(result.uri, result.name);

            // 3. Add placeholder with processing = 1
            const docId = addIdentityDocument(
                savedUri,
                result.name,
                'Other', // Default type
                undefined,
                undefined,
                undefined,
                undefined,
                autoParseEnabled ? 1 : 0 // processing = true only if auto-parse is on
            );

            loadDocuments();
            setProcessing(false); // Enable button again immediately

            if (!autoParseEnabled) {
                // If auto-parse is disabled, navigate directly to view
                router.push({
                    pathname: '/identity-view',
                    params: {
                        id: docId.toString(),
                        uri: savedUri,
                        title: result.name,
                        autoEdit: 'true',
                    },
                });
                return;
            }

            // 4. Parse with Gemini in background
            parseIdentityDocumentWithGemini(savedUri)
                .then((parsedData) => {
                    // 5. Update with parsed data and processing = 0
                    updateIdentityDocument(
                        docId,
                        parsedData.title,
                        parsedData.type,
                        parsedData.documentNumber,
                        parsedData.issueDate,
                        parsedData.expiryDate,
                        parsedData.owner,
                        0 // processing = false
                    );

                    loadDocuments();
                })
                .catch((e) => {
                    console.error('Parsing failed', e);

                    // Mark as not processing even on failure
                    updateIdentityDocument(
                        docId,
                        result.name,
                        'Other',
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        0 // processing = false
                    );
                    loadDocuments();

                    const errorMessage = (e as any)?.message || String(e);
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
                    } else {
                        // Silent failure for parsing, just show the file
                        console.warn('Parsing error:', errorMessage);
                    }
                });
        } catch (e) {
            console.error('Failed to add document', e);
            setProcessing(false);
            showToast('Failed to add document');
        }
    };

    const handlePress = (doc: IdentityDocument) => {
        if (selectionMode) {
            toggleSelection(doc.id.toString());
        } else {
            router.push({
                pathname: '/identity-view',
                params: {
                    id: doc.id.toString(),
                    uri: doc.uri,
                    title: doc.title,
                },
            });
        }
    };

    const handleLongPress = (doc: IdentityDocument) => {
        setSelectionMode(true);
        toggleSelection(doc.id.toString());
    };

    const performDelete = async () => {
        try {
            const ids = Array.from(selectedIds).map(Number);
            const docsToDelete = documents.filter(d => ids.includes(d.id));

            for (const doc of docsToDelete) {
                await deleteFile(doc.uri);
                deleteIdentityDocument(doc.id);
            }
            loadDocuments();
        } catch (e) {
            console.error('Failed to delete documents', e);
            Alert.alert('Error', 'Failed to delete selected documents');
        }
    };

    const handleEdit = () => {
        if (selectedIds.size !== 1) {
            Alert.alert('Edit', 'Please select exactly one document to edit.');
            return;
        }

        const id = Number(Array.from(selectedIds)[0]);
        const doc = documents.find(d => d.id === id);

        if (doc) {
            router.push({
                pathname: '/identity-view',
                params: {
                    id: doc.id.toString(),
                    uri: doc.uri,
                    title: doc.title,
                    autoEdit: 'true'
                },
            });
            resetSelection();
        }
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
            const ids = Array.from(selectedIds).map(Number);
            const docsToReprocess = documents.filter(d => ids.includes(d.id));
            let successCount = 0;

            for (const doc of docsToReprocess) {
                try {
                    // Mark processing
                    updateIdentityDocument(doc.id, doc.title, doc.type, doc.documentNumber, doc.issueDate, doc.expiryDate, doc.owner, 1);

                    const parsedData = await parseIdentityDocumentWithGemini(doc.uri);

                    updateIdentityDocument(
                        doc.id,
                        parsedData.title,
                        parsedData.type,
                        parsedData.documentNumber,
                        parsedData.issueDate,
                        parsedData.expiryDate,
                        parsedData.owner,
                        0
                    );
                    successCount++;
                } catch (e) {
                    console.error(`Failed to reprocess doc ${doc.id}`, e);
                    updateIdentityDocument(doc.id, doc.title, doc.type, doc.documentNumber, doc.issueDate, doc.expiryDate, doc.owner, 0);
                }
            }
            showToast(`Reprocessed ${successCount} document(s)`);
            resetSelection();
            loadDocuments();
        } catch (e) {
            showToast('Failed to reprocess documents');
        } finally {
            setProcessing(false);
        }
    };

    const renderItem = ({ item }: { item: IdentityDocument }) => {
        const isSelected = selectedIds.has(item.id.toString());

        return (
            <View style={styles.gridItem}>
                <IdentityDocumentCard
                    doc={item}
                    onPress={() => handlePress(item)}
                    onLongPress={() => handleLongPress(item)}
                    processing={item.processing === 1}
                // Pass a simple style or prop for selection visual if specific prop not exists
                // Assuming IdentityDocumentCard might need update to show "selected" state
                // For now, we rely on opacity or border if we updated the card, checking prev implementation
                />
                {isSelected && (
                    <View style={styles.selectedOverlay} pointerEvents="none">
                        <Ionicons name="checkmark-circle" size={32} color={theme.colors.primary} />
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <SelectionHeader
                title="Identity"
                selectionMode={selectionMode}
                onCancelSelection={resetSelection}
                onEdit={handleEdit}
                onReprocess={handleReprocess}
                onDelete={() => confirmDelete(performDelete, 'document')}
                onSettingsPress={() => router.push('/settings')}
            />

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={documents}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={styles.row}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="id-card-outline" size={64} color={theme.colors.textLight} />
                            <Text style={styles.emptyText}>No identity documents yet</Text>
                            <Text style={styles.emptySubtext}>Tap the + button to add your first document</Text>
                        </View>
                    }
                />
            )}

            <FloatingActionButton
                onPress={handleAddDocument}
                disabled={processing}
                processing={processing}
            />

            <PickerModal />
        </SafeAreaView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    // Header styles moved to SelectionComponent, removed here
    list: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.xl,
    },
    row: {
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    gridItem: {
        width: '48%',
        marginBottom: theme.spacing.m,
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.primary + '20',
        borderRadius: theme.borderRadius.m,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.primary,
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
});

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingActionButton } from '../../src/components/FloatingActionButton';
import { IdentityDocumentCard } from '../../src/components/IdentityDocumentCard';
import { useDocumentPicker } from '../../src/hooks/useDocumentPicker';
import { addIdentityDocument, getIdentityDocuments, IdentityDocument, initDatabase, updateIdentityDocument } from '../../src/services/database';
import { saveFile } from '../../src/services/fileStorage';
import { ApiKeyMissingError } from '../../src/services/geminiParser';
import { parseIdentityDocumentWithGemini } from '../../src/services/identityParser';
import { getAutoParseEnabled } from '../../src/services/settingsStorage';
import { theme } from '../../src/theme';

const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
        Alert.alert('', msg);
    }
};

export default function IdentityScreen() {
    const router = useRouter();
    const { pickDocument, PickerModal } = useDocumentPicker();
    const [documents, setDocuments] = useState<IdentityDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

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
            showToast('Document added, processing...');
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
                    showToast('Document processed successfully');
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
        router.push({
            pathname: '/identity-view',
            params: {
                id: doc.id.toString(),
                uri: doc.uri,
                title: doc.title,
            },
        });
    };

    const renderItem = ({ item }: { item: IdentityDocument }) => (
        <View style={styles.gridItem}>
            <IdentityDocumentCard
                doc={item}
                onPress={() => handlePress(item)}
                processing={item.processing === 1}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Identity</Text>
            </View>

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
    list: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.xl,
    },
    row: {
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '48%',
        marginBottom: theme.spacing.m,
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

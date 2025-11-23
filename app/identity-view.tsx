import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { deleteIdentityDocument, getIdentityDocumentById, IdentityDocument, updateIdentityDocument } from '../src/services/database';
import { theme } from '../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const IDENTITY_TYPES = ['Passport', 'Visa', 'Aadhaar', 'Driver License', 'PAN Card', 'Other'];

export default function IdentityViewScreen() {
    const { uri, title, id } = useLocalSearchParams<{
        uri: string;
        title: string;
        id: string;
    }>();
    const router = useRouter();
    const isPdf = uri?.toLowerCase().endsWith('.pdf');
    const [pdfSource, setPdfSource] = useState<any>(null);

    const [document, setDocument] = useState<IdentityDocument | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Edit state
    const [editTitle, setEditTitle] = useState('');
    const [editType, setEditType] = useState('Passport');
    const [editDocumentNumber, setEditDocumentNumber] = useState('');
    const [editOwner, setEditOwner] = useState('');
    const [editIssueDate, setEditIssueDate] = useState(new Date());
    const [editExpiryDate, setEditExpiryDate] = useState(new Date());
    const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
    const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

    useEffect(() => {
        if (id) {
            const doc = getIdentityDocumentById(parseInt(id));
            if (doc) {
                setDocument(doc);
                setEditTitle(doc.title);
                setEditType(doc.type);
                setEditDocumentNumber(doc.documentNumber || '');
                setEditOwner(doc.owner || '');
                if (doc.issueDate) setEditIssueDate(new Date(doc.issueDate));
                if (doc.expiryDate) setEditExpiryDate(new Date(doc.expiryDate));
            }
        }
    }, [id]);

    useEffect(() => {
        const loadPdf = async () => {
            if (!isPdf || !uri) return;

            if (Platform.OS === 'android') {
                try {
                    const base64 = await FileSystem.readAsStringAsync(uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0">
                            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js"></script>
                            <script>
                                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
                            </script>
                            <style>
                                body { margin: 0; background-color: #f5f5f5; }
                                canvas { width: 100%; height: auto; display: block; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                                #container { padding: 10px; }
                            </style>
                        </head>
                        <body>
                            <div id="container"></div>
                            <script>
                                const pdfData = atob('${base64}');
                                const loadingTask = pdfjsLib.getDocument({data: pdfData});
                                loadingTask.promise.then(function(pdf) {
                                    const container = document.getElementById('container');
                                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                                        pdf.getPage(pageNum).then(function(page) {
                                            const scale = 1.5;
                                            const viewport = page.getViewport({scale: scale});
                                            const canvas = document.createElement('canvas');
                                            const context = canvas.getContext('2d');
                                            canvas.height = viewport.height;
                                            canvas.width = viewport.width;
                                            container.appendChild(canvas);
                                            
                                            const renderContext = {
                                                canvasContext: context,
                                                viewport: viewport
                                            };
                                            page.render(renderContext);
                                        });
                                    }
                                }, function (reason) {
                                    console.error(reason);
                                });
                            </script>
                        </body>
                        </html>
                    `;
                    setPdfSource({ html: htmlContent });
                } catch (e) {
                    console.error('Failed to load PDF', e);
                }
            } else {
                setPdfSource({ uri });
            }
        };

        loadPdf();
    }, [uri, isPdf]);

    const handleSave = () => {
        if (document) {
            updateIdentityDocument(
                document.id,
                editTitle,
                editType,
                editDocumentNumber || undefined,
                editIssueDate.toISOString(),
                editExpiryDate.toISOString(),
                editOwner || undefined
            );
            setDocument({
                ...document,
                title: editTitle,
                type: editType as any,
                documentNumber: editDocumentNumber || undefined,
                issueDate: editIssueDate.toISOString(),
                expiryDate: editExpiryDate.toISOString(),
                owner: editOwner || undefined,
            });
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (document) {
            deleteIdentityDocument(document.id);
            router.back();
        }
    };

    const renderContent = () => {
        if (isPdf) {
            return pdfSource ? (
                <WebView
                    source={pdfSource}
                    style={styles.webview}
                    originWhitelist={['*']}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        </View>
                    )}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowFileAccess={true}
                />
            ) : (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            );
        }

        return (
            <ScrollView style={styles.imageContainer}>
                <Image
                    source={{ uri }}
                    style={styles.image}
                    contentFit="contain"
                />
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: title || 'Identity Document',
                    headerRight: () => (
                        <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.headerButton}>
                            <Text style={styles.headerButtonText}>Edit</Text>
                        </TouchableOpacity>
                    ),
                }}
            />

            {renderContent()}

            <Modal
                visible={isEditing}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsEditing(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Identity Document</Text>
                            <TouchableOpacity onPress={() => setIsEditing(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                value={editTitle}
                                onChangeText={setEditTitle}
                                placeholder="Document Title"
                            />

                            <Text style={styles.label}>Type</Text>
                            <View style={styles.typeContainer}>
                                {IDENTITY_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.typeButton,
                                            editType === type && styles.typeButtonActive
                                        ]}
                                        onPress={() => setEditType(type)}
                                    >
                                        <Text style={[
                                            styles.typeButtonText,
                                            editType === type && styles.typeButtonTextActive
                                        ]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Document Number</Text>
                            <TextInput
                                style={styles.input}
                                value={editDocumentNumber}
                                onChangeText={setEditDocumentNumber}
                                placeholder="Document Number (optional)"
                            />

                            <Text style={styles.label}>Issue Date</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowIssueDatePicker(true)}
                            >
                                <Text style={styles.dateButtonText}>
                                    {format(editIssueDate, 'MMM dd, yyyy')}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>

                            {showIssueDatePicker && (
                                <DateTimePicker
                                    value={editIssueDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowIssueDatePicker(false);
                                        if (selectedDate) setEditIssueDate(selectedDate);
                                    }}
                                />
                            )}

                            <Text style={styles.label}>Expiry Date</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowExpiryDatePicker(true)}
                            >
                                <Text style={styles.dateButtonText}>
                                    {format(editExpiryDate, 'MMM dd, yyyy')}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>

                            {showExpiryDatePicker && (
                                <DateTimePicker
                                    value={editExpiryDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowExpiryDatePicker(false);
                                        if (selectedDate) setEditExpiryDate(selectedDate);
                                    }}
                                />
                            )}

                            <Text style={styles.label}>Owner</Text>
                            <TextInput
                                style={styles.input}
                                value={editOwner}
                                onChangeText={setEditOwner}
                                placeholder="Owner Name (optional)"
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.button, styles.deleteButton]}
                                onPress={handleDelete}
                            >
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerButton: {
        marginRight: theme.spacing.m,
    },
    headerButtonText: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    imageContainer: {
        flex: 1,
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 1.4,
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: theme.colors.overlay,
    },
    modalContent: {
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: theme.borderRadius.l,
        borderTopRightRadius: theme.borderRadius.l,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalTitle: {
        ...theme.typography.h2,
    },
    formContainer: {
        padding: theme.spacing.l,
    },
    label: {
        ...theme.typography.caption,
        fontWeight: '600',
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.m,
    },
    input: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.s,
        padding: theme.spacing.m,
        fontSize: 16,
        color: theme.colors.text,
    },
    dateButton: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.s,
        padding: theme.spacing.m,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateButtonText: {
        fontSize: 16,
        color: theme.colors.text,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.s,
    },
    typeButton: {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
        borderRadius: theme.borderRadius.s,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    typeButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    typeButtonText: {
        fontSize: 14,
        color: theme.colors.text,
    },
    typeButtonTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: theme.spacing.l,
        gap: theme.spacing.m,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    button: {
        flex: 1,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.s,
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: theme.colors.error,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});

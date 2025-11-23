import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';
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
    View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { Document, getDocumentById, updateDocument } from '../src/services/database';
import { theme } from '../src/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DOCUMENT_TYPES = ['Flight', 'Hotel', 'Event', 'Receipt', 'Other'];

export default function DocumentViewScreen() {
    const { uri, title, id, autoEdit, missingFields } = useLocalSearchParams<{
        uri: string;
        title: string;
        id: string;
        autoEdit?: string;
        missingFields?: string;
    }>();

    const router = useRouter();
    const isPdf = uri?.toLowerCase().endsWith('.pdf');
    const [pdfSource, setPdfSource] = useState<any>(null);
    const [document, setDocument] = useState<Document | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]);

    // Edit State
    const [editTitle, setEditTitle] = useState('');
    const [editType, setEditType] = useState('');
    const [editOwner, setEditOwner] = useState('');
    const [editDate, setEditDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    useEffect(() => {
        if (id) {
            const doc = getDocumentById(Number(id));
            if (doc) {
                setDocument(doc);
                setEditTitle(doc.title);
                setEditType(doc.type);
                setEditOwner(doc.owner || '');
                setEditDate(new Date(doc.docDate));

                // Handle Auto-Edit
                if (autoEdit === 'true') {
                    setIsEditing(true);
                    if (missingFields) {
                        try {
                            const parsed = JSON.parse(missingFields);
                            setMissingFieldsList(Array.isArray(parsed) ? parsed : []);
                        } catch (e) {
                            console.error('Failed to parse missing fields', e);
                        }
                    }
                }
            }
        }
    }, [id, autoEdit, missingFields]);

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
            updateDocument(
                document.id,
                editTitle,
                editDate.toISOString(),
                editType,
                editOwner,
                document.processing
            );
            // Update local state to reflect changes immediately
            setDocument({
                ...document,
                title: editTitle,
                docDate: editDate.toISOString(),
                type: editType as any,
                owner: editOwner
            });
            setIsEditing(false);
            // Clear missing fields warnings after save
            setMissingFieldsList([]);
        }
    };

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            if (scale.value < 1) {
                scale.value = withTiming(1);
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
            }
            savedScale.value = scale.value;
        });

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = savedTranslateX.value + e.translationX;
            translateY.value = savedTranslateY.value + e.translationY;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (scale.value > 1) {
                scale.value = withTiming(1);
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedScale.value = 1;
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else {
                scale.value = withTiming(2);
                savedScale.value = 2;
            }
        });

    const composedGesture = Gesture.Simultaneous(
        doubleTapGesture,
        Gesture.Simultaneous(pinchGesture, panGesture)
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

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
                    allowFileAccessFromFileURLs={true}
                    allowUniversalAccessFromFileURLs={true}
                />
            ) : (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            );
        }

        return (
            <GestureDetector gesture={composedGesture}>
                <Animated.Image
                    source={{ uri }}
                    style={[styles.image, animatedStyle]}
                    resizeMode="contain"
                />
            </GestureDetector>
        );
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <Stack.Screen
                options={{
                    title: document?.title || title || 'Document',
                    headerBackTitle: 'Back',
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
                            <Text style={styles.modalTitle}>Edit Details</Text>
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

                            <Text style={styles.label}>Date & Time</Text>
                            <View style={styles.dateTimeRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.dateButton,
                                        missingFieldsList.includes('time') && styles.inputWarning
                                    ]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateButtonText}>
                                        {format(editDate, 'MMM dd, yyyy')}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.dateButton,
                                        missingFieldsList.includes('time') && styles.inputWarning
                                    ]}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Text style={styles.dateButtonText}>
                                        {format(editDate, 'h:mm a')}
                                    </Text>
                                    <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            {missingFieldsList.includes('time') && (
                                <Text style={styles.warningText}>Time not found - defaults to midnight</Text>
                            )}

                            {showDatePicker && (
                                <DateTimePicker
                                    value={editDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            const newDate = new Date(selectedDate);
                                            newDate.setHours(editDate.getHours());
                                            newDate.setMinutes(editDate.getMinutes());
                                            setEditDate(newDate);
                                        }
                                    }}
                                />
                            )}

                            {showTimePicker && (
                                <DateTimePicker
                                    value={editDate}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowTimePicker(false);
                                        if (selectedDate) {
                                            const newDate = new Date(editDate);
                                            newDate.setHours(selectedDate.getHours());
                                            newDate.setMinutes(selectedDate.getMinutes());
                                            setEditDate(newDate);
                                        }
                                    }}
                                />
                            )}
                            <Text style={styles.label}>Type</Text>
                            <View style={styles.typeContainer}>
                                {DOCUMENT_TYPES.map((type) => (
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

                            <Text style={styles.label}>Owner</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    missingFieldsList.includes('owner') && styles.inputWarning
                                ]}
                                value={editOwner}
                                onChangeText={setEditOwner}
                                placeholder="Document Owner"
                            />
                            {missingFieldsList.includes('owner') && (
                                <Text style={styles.warningText}>Owner not found</Text>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setIsEditing(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    webview: {
        flex: 1,
        width: SCREEN_WIDTH,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    headerButton: {
        paddingHorizontal: 16,
    },
    headerButtonText: {
        color: theme.colors.primary,
        fontSize: 17,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    formContainer: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    inputWarning: {
        borderColor: 'orange',
        borderWidth: 1,
    },
    warningText: {
        color: 'orange',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    dateButtonText: {
        fontSize: 16,
        color: theme.colors.text,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    typeButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    typeButtonText: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '500',
    },
    typeButtonTextActive: {
        color: '#fff',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        marginBottom: 20,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: theme.colors.card,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
    },
    cancelButtonText: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

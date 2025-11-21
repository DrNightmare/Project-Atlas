import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteApiKey, getApiKey, saveApiKey } from '../src/services/apiKeyStorage';

export default function SettingsScreen() {
    const router = useRouter();
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        loadApiKey();
    }, []);

    const loadApiKey = async () => {
        const key = await getApiKey();
        if (key) {
            setApiKey(key);
            setHasKey(true);
        } else if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
            // Use .env key as placeholder if no stored key
            setApiKey(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
        }
    };

    const handleSave = async () => {
        if (!apiKey.trim()) {
            Alert.alert('Error', 'Please enter an API key');
            return;
        }

        setLoading(true);
        try {
            await saveApiKey(apiKey.trim());
            setHasKey(true);
            Alert.alert('Success', 'API key saved successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to save API key');
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        if (!apiKey.trim()) {
            Alert.alert('Error', 'Please enter an API key first');
            return;
        }

        setLoading(true);
        try {
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;
            const response = await fetch(testUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hello' }] }]
                }),
            });

            if (response.ok) {
                Alert.alert('Success', 'API key is valid! ✓');
            } else {
                const data = await response.json();
                Alert.alert('Error', data.error?.message || 'Invalid API key');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to test API key. Check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete API Key',
            'Are you sure? You\'ll need to enter it again to use the app.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteApiKey();
                        setApiKey('');
                        setHasKey(false);
                        Alert.alert('Deleted', 'API key removed');
                    }
                }
            ]
        );
    };

    const openGeminiStudio = () => {
        Linking.openURL('https://aistudio.google.com/app/apikey');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Settings</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gemini API Key</Text>
                    <Text style={styles.description}>
                        Your API key is used to analyze documents with Google Gemini AI.
                    </Text>

                    <TouchableOpacity style={styles.linkButton} onPress={openGeminiStudio}>
                        <Text style={styles.linkText}>Get API Key →</Text>
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="AIza..."
                        value={apiKey}
                        onChangeText={setApiKey}
                        autoCapitalize="none"
                        autoCorrect={false}
                        multiline
                        numberOfLines={2}
                        secureTextEntry={hasKey && apiKey.length > 0}
                    />

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.buttonSecondary, loading && styles.buttonDisabled]}
                            onPress={handleTest}
                            disabled={loading}
                        >
                            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Test</Text>
                        </TouchableOpacity>
                    </View>

                    {hasKey && (
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                            <Text style={styles.deleteButtonText}>Delete API Key</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>ℹ️ About API Keys</Text>
                    <Text style={styles.infoText}>
                        • Your API key is stored securely on your device{'\n'}
                        • It's never shared or sent to our servers{'\n'}
                        • Gemini offers 1,500 free requests per day{'\n'}
                        • You can revoke keys anytime in Google AI Studio
                    </Text>
                </View>

                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>← Back to Timeline</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    linkButton: {
        marginBottom: 16,
    },
    linkText: {
        color: '#007AFF',
        fontSize: 15,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        marginBottom: 16,
        minHeight: 60,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: '#007AFF',
    },
    buttonSecondary: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    buttonTextSecondary: {
        color: '#007AFF',
    },
    deleteButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FF3B30',
        fontSize: 15,
        fontWeight: '500',
    },
    infoSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    backButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '500',
    },
});

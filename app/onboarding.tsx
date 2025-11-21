import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveApiKey } from '../src/services/apiKeyStorage';

export default function OnboardingScreen() {
    const router = useRouter();
    const [apiKey, setApiKey] = useState(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');
    const [loading, setLoading] = useState(false);

    const handleGetStarted = async () => {
        if (!apiKey.trim()) {
            Alert.alert('Error', 'Please enter your Gemini API key');
            return;
        }

        setLoading(true);
        try {
            await saveApiKey(apiKey.trim());
            router.replace('/(tabs)');
        } catch (error) {
            Alert.alert('Error', 'Failed to save API key. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const openGeminiStudio = () => {
        Linking.openURL('https://aistudio.google.com/app/apikey');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.emoji}>✈️</Text>
                <Text style={styles.title}>Welcome to Project Atlas</Text>
                <Text style={styles.subtitle}>
                    Your AI-powered travel document manager
                </Text>

                <View style={styles.features}>
                    <Text style={styles.featureItem}>📄 Upload travel documents</Text>
                    <Text style={styles.featureItem}>🤖 AI extracts details automatically</Text>
                    <Text style={styles.featureItem}>💾 Everything stored locally</Text>
                    <Text style={styles.featureItem}>🔒 Your data stays on your device</Text>
                </View>

                <View style={styles.setupSection}>
                    <Text style={styles.sectionTitle}>Setup Required</Text>
                    <Text style={styles.description}>
                        This app uses Google Gemini AI to analyze your documents. You'll need a free API key to get started.
                    </Text>

                    <TouchableOpacity style={styles.linkButton} onPress={openGeminiStudio}>
                        <Text style={styles.linkButtonText}>Get Free API Key →</Text>
                    </TouchableOpacity>

                    <Text style={styles.inputLabel}>Paste your API key below:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="AIza..."
                        value={apiKey}
                        onChangeText={setApiKey}
                        autoCapitalize="none"
                        autoCorrect={false}
                        multiline
                        numberOfLines={2}
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleGetStarted}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Saving...' : 'Get Started'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.privacy}>
                    🔐 Your API key is stored securely on your device and never shared.
                </Text>
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
        padding: 24,
        alignItems: 'center',
    },
    emoji: {
        fontSize: 64,
        marginTop: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
        textAlign: 'center',
    },
    features: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 32,
    },
    featureItem: {
        fontSize: 15,
        color: '#333',
        marginBottom: 12,
        lineHeight: 22,
    },
    setupSection: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    linkButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 24,
        alignItems: 'center',
    },
    linkButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
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
    button: {
        backgroundColor: '#34C759',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#999',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    privacy: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
});

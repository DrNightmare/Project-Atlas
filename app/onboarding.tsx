import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveApiKey } from '../src/services/apiKeyStorage';
import { theme } from '../src/theme';

export default function OnboardingScreen() {
    const router = useRouter();
    const [apiKey, setApiKey] = useState(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

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
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Project Atlas</Text>
                    <Text style={styles.subtitle}>AI-Powered Travel Document Manager</Text>
                </View>

                {/* Features */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>What You Can Do</Text>
                    <View style={styles.featureList}>
                        <View style={styles.featureItem}>
                            <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
                            <Text style={styles.featureText}>Upload travel documents</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="sparkles-outline" size={20} color={theme.colors.primary} />
                            <Text style={styles.featureText}>AI extracts details automatically</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="phone-portrait-outline" size={20} color={theme.colors.primary} />
                            <Text style={styles.featureText}>Everything stored locally</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
                            <Text style={styles.featureText}>Your data stays on your device</Text>
                        </View>
                    </View>
                </View>

                {/* Setup */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Setup Required</Text>
                    <Text style={styles.description}>
                        This app uses Google Gemini AI to analyze your documents. You'll need a free API key to get started.
                    </Text>

                    <TouchableOpacity style={styles.linkButton} onPress={openGeminiStudio}>
                        <Text style={styles.linkButtonText}>Get Free API Key</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.inputLabel}>API Key</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your API key"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={apiKey}
                            onChangeText={setApiKey}
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry={!isVisible}
                        />
                        <TouchableOpacity onPress={() => setIsVisible(!isVisible)} style={styles.eyeIcon}>
                            <Ionicons
                                name={isVisible ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color={theme.colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleGetStarted}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Get Started</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Privacy Notice */}
                <View style={styles.privacyNotice}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.privacyText}>
                        Your API key is stored securely on your device and never shared
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        padding: theme.spacing.l,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    title: {
        ...theme.typography.h1,
        marginTop: theme.spacing.m,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        marginBottom: theme.spacing.m,
        ...theme.shadows.card,
    },
    cardTitle: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.m,
    },
    featureList: {
        gap: theme.spacing.m,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    featureText: {
        ...theme.typography.body,
        flex: 1,
    },
    description: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.l,
        lineHeight: 22,
    },
    linkButton: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
        paddingVertical: theme.spacing.m,
        paddingHorizontal: theme.spacing.l,
        borderRadius: theme.borderRadius.m,
        marginBottom: theme.spacing.l,
        ...theme.shadows.card,
    },
    linkButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    inputLabel: {
        ...theme.typography.body,
        fontWeight: '600',
        marginBottom: theme.spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.m,
        backgroundColor: theme.colors.background,
        marginBottom: theme.spacing.m,
    },
    input: {
        flex: 1,
        padding: theme.spacing.m,
        fontSize: 16,
        color: theme.colors.text,
    },
    eyeIcon: {
        padding: theme.spacing.m,
    },
    button: {
        backgroundColor: theme.colors.success,
        paddingVertical: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        ...theme.shadows.card,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.textSecondary,
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    privacyNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.l,
    },
    privacyText: {
        ...theme.typography.small,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        flex: 1,
    },
});

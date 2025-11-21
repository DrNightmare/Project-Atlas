import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteApiKey, getApiKey, saveApiKey } from '../src/services/apiKeyStorage';
import { testApiKey } from '../src/services/geminiParser';
import { theme } from '../src/theme';

export default function SettingsScreen() {
    const router = useRouter();
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        loadKey();
    }, []);

    const navigation = useNavigation();
    useEffect(() => {
        navigation.setOptions({ title: 'Settings' });
    }, [navigation]);

    const loadKey = async () => {
        try {
            const key = await getApiKey();
            if (key) {
                setApiKey(key);
            } else if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
                // Pre-populate and save from environment variable if no stored key
                const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
                setApiKey(envKey);
                await saveApiKey(envKey);
            }
        } catch (e) {
            console.error('Failed to load key', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!apiKey.trim()) {
            Alert.alert('Error', 'Please enter an API key');
            return;
        }
        try {
            await saveApiKey(apiKey.trim());
            Alert.alert('Success', 'API Key saved successfully');
        } catch (e) {
            Alert.alert('Error', 'Failed to save API key');
        }
    };

    const handleTest = async () => {
        if (!apiKey.trim()) return;
        setTesting(true);
        try {
            const success = await testApiKey(apiKey.trim());
            if (success) {
                Alert.alert('Success', 'API Key is valid and working!');
            } else {
                Alert.alert('Error', 'API Key validation failed. Please check the key.');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to test API key');
        } finally {
            setTesting(false);
        }
    };

    const handleClear = async () => {
        Alert.alert('Clear API Key', 'Are you sure? You will need to enter it again to use the app.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteApiKey();
                        setApiKey('');
                        Alert.alert('Cleared', 'API Key has been removed.', [
                            {
                                text: 'Go to Onboarding',
                                onPress: () => router.replace('/onboarding')
                            },
                            { text: 'OK' }
                        ]);
                    } catch (e) {
                        Alert.alert('Error', 'Failed to clear API key');
                    }
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.content}>
                <Text style={styles.label}>Gemini API Key</Text>
                <Text style={styles.description}>
                    Your API key is stored securely on your device.
                </Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={apiKey}
                        onChangeText={setApiKey}
                        placeholder="Enter API Key"
                        secureTextEntry={!isVisible}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setIsVisible(!isVisible)} style={styles.eyeIcon}>
                        <Ionicons name={isVisible ? "eye-off" : "eye"} size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                        <Text style={styles.buttonText}>Save Key</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.testButton]}
                        onPress={handleTest}
                        disabled={testing || !apiKey}
                    >
                        {testing ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Test Key</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                    <Text style={styles.clearButtonText}>Clear API Key & Reset</Text>
                </TouchableOpacity>

                {process.env.EXPO_PUBLIC_GEMINI_API_KEY && (
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                        <Text style={styles.infoText}>
                            An API key is also detected in your environment variables. This may override your manual settings on app restart.
                        </Text>
                    </View>
                )}
            </View>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.card,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    headerTitle: {
        ...theme.typography.h2,
    },
    content: {
        padding: theme.spacing.l,
    },
    label: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.s,
    },
    description: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.l,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.m,
        backgroundColor: theme.colors.card,
        marginBottom: theme.spacing.l,
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
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.m,
        marginBottom: theme.spacing.xl,
    },
    button: {
        flex: 1,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.card,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
    },
    testButton: {
        backgroundColor: theme.colors.success,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    clearButton: {
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.error,
        alignItems: 'center',
    },
    clearButtonText: {
        color: theme.colors.error,
        fontWeight: '600',
        fontSize: 16,
    },
    infoBox: {
        marginTop: theme.spacing.xl,
        flexDirection: 'row',
        backgroundColor: theme.colors.primaryLight + '40',
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        gap: theme.spacing.s,
    },
    infoText: {
        flex: 1,
        ...theme.typography.small,
        color: theme.colors.primary,
    }
});

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme, useThemeSettings } from '../src/context/ThemeContext';
import { deleteApiKey, getApiKey, saveApiKey } from '../src/services/apiKeyStorage';
import { testApiKey } from '../src/services/geminiParser';
import { GeminiModel, getAutoParseEnabled, getGeminiModel, setAutoParseEnabled, setGeminiModel, ThemeMode } from '../src/services/settingsStorage';

export default function SettingsScreen() {
    const router = useRouter();
    const theme = useAppTheme();
    const { mode, setMode } = useThemeSettings();
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [autoParse, setAutoParse] = useState(true);
    const [geminiModel, setGeminiModelLocal] = useState<GeminiModel>('gemini-2.0-flash');

    const styles = useMemo(() => createStyles(theme), [theme]);

    useEffect(() => {
        loadKey();
    }, []);

    const navigation = useNavigation();
    useEffect(() => {
        navigation.setOptions({
            title: 'Settings',
            headerStyle: { backgroundColor: theme.colors.card },
            headerTintColor: theme.colors.text,
        });
    }, [navigation, theme]);

    const loadKey = async () => {
        try {
            const [key, autoParseSetting, modelSetting] = await Promise.all([
                getApiKey(),
                getAutoParseEnabled(),
                getGeminiModel()
            ]);

            setAutoParse(autoParseSetting);
            setGeminiModelLocal(modelSetting);

            if (key) {
                setApiKey(key);
            } else if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
                // Pre-populate and save from environment variable if no stored key
                const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
                setApiKey(envKey);
                await saveApiKey(envKey);
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAutoParse = async (value: boolean) => {
        setAutoParse(value);
        await setAutoParseEnabled(value);
    };

    const handleModelChange = async (model: GeminiModel) => {
        setGeminiModelLocal(model);
        await setGeminiModel(model);
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

    const renderThemeOption = (optionMode: ThemeMode, label: string, icon: keyof typeof Ionicons.glyphMap) => (
        <TouchableOpacity
            style={[styles.themeOption, mode === optionMode && styles.themeOptionActive]}
            onPress={() => setMode(optionMode)}
        >
            <Ionicons
                name={icon}
                size={18}
                color={mode === optionMode ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[styles.themeOptionText, mode === optionMode && styles.themeOptionTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderModelOption = (model: GeminiModel, label: string) => (
        <TouchableOpacity
            style={[styles.modelOption, geminiModel === model && styles.modelOptionActive]}
            onPress={() => handleModelChange(model)}
            disabled={!autoParse}
        >
            <Text style={[styles.modelOptionText, geminiModel === model && styles.modelOptionTextActive, !autoParse && styles.disabledText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>

                {/* Theme Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>Appearance</Text>
                    <View style={styles.themeSelector}>
                        {renderThemeOption('light', 'Light', 'sunny')}
                        {renderThemeOption('dark', 'Dark', 'moon')}
                        {renderThemeOption('system', 'System', 'cog')}
                    </View>
                </View>

                {/* Auto Parse Section */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Enable Auto-Parsing</Text>
                        <Switch
                            value={autoParse}
                            onValueChange={handleToggleAutoParse}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor={Platform.OS === 'android' ? '#fff' : ''}
                        />
                    </View>
                    <Text style={styles.description}>
                        Automatically extract details from documents using Gemini AI.
                    </Text>
                </View>

                {/* AI Model Section */}
                <View style={[styles.section, !autoParse && styles.disabledSection]}>
                    <Text style={styles.label}>Gemini AI Model</Text>
                    <View style={styles.modelSelector}>
                        {renderModelOption('gemini-2.0-flash', '2.5 Flash')}
                        {renderModelOption('gemini-3-flash-preview', '3 Flash')}
                    </View>
                    <Text style={styles.description}>
                        Select the version of Gemini to use for parsing. Gemini 3 Flash is in preview.
                    </Text>
                </View>

                {/* API Key Section */}
                <View style={[styles.section, !autoParse && styles.disabledSection]}>
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>Gemini API Key</Text>
                        <TouchableOpacity
                            onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}
                            disabled={!autoParse}
                        >
                            <Text style={[styles.linkText, !autoParse && styles.disabledText]}>Get free API key →</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.description}>
                        Your API key is stored securely on your device.
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={apiKey}
                            onChangeText={setApiKey}
                            placeholder="Enter API Key"
                            placeholderTextColor={theme.colors.textLight}
                            secureTextEntry={!isVisible}
                            autoCapitalize="none"
                            editable={autoParse}
                        />
                        <TouchableOpacity
                            onPress={() => setIsVisible(!isVisible)}
                            style={styles.eyeIcon}
                            disabled={!autoParse}
                        >
                            <Ionicons name={isVisible ? "eye-off" : "eye"} size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton, !autoParse && styles.buttonDisabled]}
                            onPress={handleSave}
                            disabled={!autoParse}
                        >
                            <Text style={styles.buttonText}>Save Key</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.testButton, !autoParse && styles.buttonDisabled]}
                            onPress={handleTest}
                            disabled={testing || !apiKey || !autoParse}
                        >
                            {testing ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>Test Key</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.clearButton, !autoParse && styles.clearButtonDisabled]}
                        onPress={handleClear}
                        disabled={!autoParse}
                    >
                        <Text style={[styles.clearButtonText, !autoParse && styles.clearButtonTextDisabled]}>Clear API Key & Reset</Text>
                    </TouchableOpacity>
                </View>

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

const createStyles = (theme: any) => StyleSheet.create({
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
        color: theme.colors.text,
    },
    content: {
        padding: theme.spacing.l,
    },
    label: {
        ...theme.typography.h2,
        color: theme.colors.text,
        marginBottom: theme.spacing.s,
    },
    description: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.l,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    linkText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    disabledText: {
        color: theme.colors.textLight,
        opacity: 0.5,
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
        shadowColor: theme.colors.text, // Adapt shadow color slightly
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
        backgroundColor: theme.colors.primaryLight,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        gap: theme.spacing.s,
    },
    infoText: {
        flex: 1,
        ...theme.typography.small,
        color: theme.colors.primary,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    disabledSection: {
        opacity: 0.5,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.textLight,
    },
    clearButtonDisabled: {
        borderColor: theme.colors.border,
    },
    clearButtonTextDisabled: {
        color: theme.colors.textLight,
    },
    themeSelector: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card, // or a darker/lighter shade for container
        borderRadius: theme.borderRadius.m,
        padding: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: theme.borderRadius.s,
        gap: 6,
    },
    themeOptionActive: {
        backgroundColor: theme.colors.background, // Contrast against card
        ...theme.shadows.card,
    },
    themeOptionText: {
        ...theme.typography.caption,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    themeOptionTextActive: {
        color: theme.colors.primary,
    },
    modelSelector: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.m,
        padding: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.s,
    },
    modelOption: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: theme.borderRadius.s,
    },
    modelOptionActive: {
        backgroundColor: theme.colors.background,
        ...theme.shadows.card,
    },
    modelOptionText: {
        ...theme.typography.caption,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    modelOptionTextActive: {
        color: theme.colors.primary,
    }
});

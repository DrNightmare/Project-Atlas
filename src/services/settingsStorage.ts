import * as SecureStore from 'expo-secure-store';

const AUTO_PARSE_KEY = 'settings_auto_parse';

export const getAutoParseEnabled = async (): Promise<boolean> => {
    try {
        const result = await SecureStore.getItemAsync(AUTO_PARSE_KEY);
        // Default to false if not set
        return result === null ? false : result === 'true';
    } catch (e) {
        console.error('Failed to get auto parse setting', e);
        return false;
    }
};

export const setAutoParseEnabled = async (enabled: boolean): Promise<void> => {
    try {
        await SecureStore.setItemAsync(AUTO_PARSE_KEY, String(enabled));
    } catch (e) {
        console.error('Failed to set auto parse setting', e);
    }
};

const THEME_MODE_KEY = 'settings_theme_mode';
const GEMINI_MODEL_KEY = 'settings_gemini_model';

export type ThemeMode = 'light' | 'dark' | 'system';
export type GeminiModel = 'gemini-2.0-flash' | 'gemini-3-flash-preview';

export const getGeminiModel = async (): Promise<GeminiModel> => {
    try {
        const result = await SecureStore.getItemAsync(GEMINI_MODEL_KEY);
        if (result === 'gemini-2.0-flash' || result === 'gemini-3-flash-preview') {
            return result;
        }
        return 'gemini-3-flash-preview';
    } catch (e) {
        console.error('Failed to get gemini model setting', e);
        return 'gemini-3-flash-preview';
    }
};

export const setGeminiModel = async (model: GeminiModel): Promise<void> => {
    try {
        await SecureStore.setItemAsync(GEMINI_MODEL_KEY, model);
    } catch (e) {
        console.error('Failed to set gemini model setting', e);
    }
};

export const getThemeMode = async (): Promise<ThemeMode> => {
    try {
        const result = await SecureStore.getItemAsync(THEME_MODE_KEY);
        if (result === 'light' || result === 'dark' || result === 'system') {
            return result;
        }
        return 'system';
    } catch (e) {
        console.error('Failed to get theme mode', e);
        return 'system';
    }
};

export const setThemeMode = async (mode: ThemeMode): Promise<void> => {
    try {
        await SecureStore.setItemAsync(THEME_MODE_KEY, mode);
    } catch (e) {
        console.error('Failed to set theme mode', e);
    }
};

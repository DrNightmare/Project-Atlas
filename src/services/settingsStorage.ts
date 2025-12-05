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

export type ThemeMode = 'light' | 'dark' | 'system';

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

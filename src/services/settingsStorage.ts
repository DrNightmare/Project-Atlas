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

import * as SecureStore from 'expo-secure-store';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

export const saveApiKey = async (key: string): Promise<void> => {
    await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, key);
};

export const getApiKey = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
};

export const deleteApiKey = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
};

export const hasApiKey = async (): Promise<boolean> => {
    const key = await getApiKey();
    return key !== null && key.length > 0;
};

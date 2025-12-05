import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { saveApiKey } from '../src/services/apiKeyStorage';

export default function Index() {
    useEffect(() => {
        // Preload API key from env if available
        if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
            saveApiKey(process.env.EXPO_PUBLIC_GEMINI_API_KEY).catch(console.error);
        }
    }, []);

    return <Redirect href="/(tabs)" />;
}

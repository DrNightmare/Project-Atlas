import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { hasApiKey, saveApiKey } from '../src/services/apiKeyStorage';

export default function Index() {
    const [isReady, setIsReady] = useState(false);
    const [needsOnboarding, setNeedsOnboarding] = useState(true);

    useEffect(() => {
        checkKey();
    }, []);

    const checkKey = async () => {
        try {
            // 1. Check env var first (override/preload)
            if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
                await saveApiKey(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
                setNeedsOnboarding(false);
            } else {
                // 2. Check storage
                const hasKey = await hasApiKey();
                setNeedsOnboarding(!hasKey);
            }
        } catch (e) {
            console.error('Failed to check API key', e);
            // Default to onboarding on error
            setNeedsOnboarding(true);
        } finally {
            setIsReady(true);
        }
    };

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <Redirect href={needsOnboarding ? '/onboarding' : '/(tabs)'} />;
}

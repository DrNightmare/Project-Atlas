
import * as LocalAuthentication from 'expo-local-authentication';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface AuthContextType {
    isAuthenticated: boolean;
    authenticate: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    authenticate: async () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const authenticate = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                // Fallback or just allow if no security is set up? 
                // For now, let's assume we want to allow if no security is present
                // or we could force them to set it up. 
                // User request: "use the Android phone lock".
                // Typically if no lock is set, we might just let them in or warn.
                // Let's allow access if not enrolled to avoid locking out.
                setIsAuthenticated(true);
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to access Project Atlas',
                fallbackLabel: 'Use Passcode',
            });

            if (result.success) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            // In case of error, what to do? Keep locked?
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initial authentication
        authenticate();

        // Re-authenticate when coming back from background
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                // Optional: Require auth every time app comes to foreground?
                // Usually good for security apps.
                // Let's check if we are ALREADY authenticated.
                // If we want to lock on every resume:
                // setIsAuthenticated(false);
                // authenticate();

                // For now, let's just authenticate on initial load.
                // If the user wants lock on resume, we can add it.
                // The prompt implies "Lock screen", which usually means start up.
                // Let's stick to start up for now.
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, authenticate, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

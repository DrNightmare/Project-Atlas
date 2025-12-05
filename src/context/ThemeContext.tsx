import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { ThemeMode, getThemeMode, setThemeMode as persistThemeMode } from '../services/settingsStorage';
import { Theme, baseTheme, darkColors, lightColors } from '../theme';

interface ThemeContextType {
    theme: Theme;
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => Promise<void>;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useSystemColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [theme, setTheme] = useState<Theme>({ ...baseTheme, colors: lightColors });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const storedMode = await getThemeMode();
        setModeState(storedMode);
    };

    const setMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        await persistThemeMode(newMode);
    };

    const activeScheme = mode === 'system' ? systemScheme : mode;
    const isDark = activeScheme === 'dark';

    // Recompute theme when mode or system scheme changes
    useEffect(() => {
        const colors = isDark ? darkColors : lightColors;
        setTheme({
            ...baseTheme,
            colors: colors,
            // Pre-bake typography colors for convenience, though components should prefer using colors directly
            typography: {
                h1: { ...baseTheme.typography.h1, color: colors.text },
                h2: { ...baseTheme.typography.h2, color: colors.text },
                body: { ...baseTheme.typography.body, color: activeScheme === 'dark' ? colors.text : '#334155' }, // Matching original
                caption: { ...baseTheme.typography.caption, color: colors.textSecondary },
                small: { ...baseTheme.typography.small, color: colors.textLight },
            } as any // Cast to satisfy strict type if needed, but best to keep loose
        });
    }, [isDark]);

    return (
        <ThemeContext.Provider value={{ theme, mode, setMode, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useAppTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useAppTheme must be used within a ThemeProvider');
    }
    return context.theme;
};

export const useThemeSettings = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeSettings must be used within a ThemeProvider');
    }
    return { mode: context.mode, setMode: context.setMode, isDark: context.isDark };
};

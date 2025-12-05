export const palette = {
    slate50: '#F8FAFC',
    slate100: '#F1F5F9',
    slate200: '#E2E8F0',
    slate300: '#CBD5E1',
    slate400: '#94A3B8',
    slate500: '#64748B',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1E293B',
    slate900: '#0F172A',
    slate950: '#020617',

    white: '#FFFFFF',
    black: '#000000',

    // Refined Brand Colors (Indigo/Violet mix for a premium feel)
    brand50: '#EEF2FF',
    brand100: '#E0E7FF',
    brand200: '#C7D2FE',
    brand300: '#A5B4FC',
    brand400: '#818CF8', // Good primary for dark mode
    brand500: '#6366F1', // Standard primary
    brand600: '#4F46E5', // Good primary for light mode
    brand700: '#4338CA',
    brand800: '#3730A3',
    brand900: '#312E81',
    brand950: '#1E1B4B',

    emerald500: '#10B981',
    red500: '#EF4444',
    red400: '#FCA5A5',
    amber500: '#F59E0B',
    blue500: '#3B82F6',
    violet500: '#8B5CF6',
    pink500: '#EC4899',
    teal500: '#14B8A6',
};

export const lightColors = {
    primary: palette.brand600,
    primaryContainer: palette.brand100, // For button backgrounds, badges
    onPrimaryContainer: palette.brand900, // Text on primary container
    background: palette.slate50,
    card: palette.white,
    text: palette.slate900,
    textSecondary: palette.slate500,
    textLight: palette.slate400,
    success: palette.emerald500,
    error: palette.red500,
    warning: palette.amber500,
    border: palette.slate200,
    divider: palette.slate100,
    overlay: 'rgba(0,0,0,0.4)',

    // Types
    flight: palette.blue500,
    hotel: palette.amber500,
    event: palette.violet500,
    receipt: palette.emerald500,
    other: palette.brand500,

    // ID Types
    passport: palette.brand500,
    visa: palette.violet500,
    aadhaar: palette.pink500,
    license: palette.teal500,
    pan: palette.amber500,
};

export const darkColors = {
    primary: palette.brand400, // Lighter, pastel indigo for contrast
    primaryContainer: palette.brand900, // Deep rich indigo for backgrounds
    onPrimaryContainer: palette.brand100, // Light text using container
    background: '#0B0E14', // Richer, slightly warmer black than slate950
    card: palette.slate900, // Darker card for better seamless look
    text: palette.slate50,
    textSecondary: palette.slate300, // Lighter for readability
    textLight: palette.slate500,
    success: palette.emerald500,
    error: palette.red400, // Lighter red for dark mode
    warning: palette.amber500,
    border: palette.slate800,
    divider: palette.slate800,
    overlay: 'rgba(0,0,0,0.7)',

    // Types (Same or adjusted for vibrancy)
    flight: palette.blue500,
    hotel: palette.amber500,
    event: palette.violet500,
    receipt: palette.emerald500,
    other: palette.brand400,

    // ID Types
    passport: palette.brand400,
    visa: palette.violet500,
    aadhaar: palette.pink500,
    license: palette.teal500,
    pan: palette.amber500,
};

export const baseTheme = {
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
    },
    borderRadius: {
        s: 8,
        m: 12,
        l: 16,
        full: 9999,
    },
    shadows: {
        card: {
            shadowColor: palette.slate500,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
        },
        floating: {
            shadowColor: palette.indigo600,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
        }
    },
    typography: {
        h1: {
            fontSize: 28,
            fontWeight: '700' as '700',
        },
        h2: {
            fontSize: 20,
            fontWeight: '600' as '600',
        },
        body: {
            fontSize: 16,
        },
        caption: {
            fontSize: 14,
        },
        small: {
            fontSize: 12,
        }
    }
};

// Default export for backward compatibility during migration (will map to light)
export const theme = {
    colors: lightColors,
    ...baseTheme,
    typography: {
        h1: { ...baseTheme.typography.h1, color: lightColors.text },
        h2: { ...baseTheme.typography.h2, color: lightColors.text },
        body: { ...baseTheme.typography.body, color: lightColors.textSecondary }, // Note: check original
        caption: { ...baseTheme.typography.caption, color: lightColors.textSecondary },
        small: { ...baseTheme.typography.small, color: lightColors.textLight },
    }
};

export type ThemeColors = typeof lightColors;
export type Theme = typeof baseTheme & { colors: ThemeColors };

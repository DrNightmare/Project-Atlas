export const theme = {
    colors: {
        // Brand
        primary: '#4F46E5', // Indigo 600
        primaryLight: '#E0E7FF', // Indigo 100

        // Backgrounds
        background: '#F8FAFC', // Slate 50
        card: '#FFFFFF',

        // Text
        text: '#0F172A', // Slate 900
        textSecondary: '#64748B', // Slate 500
        textLight: '#94A3B8', // Slate 400

        // Status / Accents
        success: '#10B981', // Emerald 500
        error: '#EF4444', // Red 500
        warning: '#F59E0B', // Amber 500

        // Type Specific
        flight: '#3B82F6', // Blue 500
        hotel: '#F59E0B', // Amber 500
        receipt: '#10B981', // Emerald 500
        other: '#6366F1', // Indigo 500

        // UI
        border: '#E2E8F0', // Slate 200
        divider: '#F1F5F9', // Slate 100
        overlay: 'rgba(0,0,0,0.4)',
    },
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
            shadowColor: '#64748B',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
        },
        floating: {
            shadowColor: '#4F46E5',
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
            color: '#0F172A',
        },
        h2: {
            fontSize: 20,
            fontWeight: '600' as '600',
            color: '#0F172A',
        },
        body: {
            fontSize: 16,
            color: '#334155',
        },
        caption: {
            fontSize: 14,
            color: '#64748B',
        },
        small: {
            fontSize: 12,
            color: '#94A3B8',
        }
    }
};

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface Props {
    onPress: () => void;
    disabled?: boolean;
    processing?: boolean;
}

export const FloatingActionButton: React.FC<Props> = ({ onPress, disabled, processing }) => {
    return (
        <TouchableOpacity
            style={[styles.fab, disabled && styles.fabDisabled]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            {processing ? (
                <ActivityIndicator size="small" color="white" />
            ) : (
                <Ionicons name="add" size={28} color="white" />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.card,
        elevation: 8,
    },
    fabDisabled: {
        opacity: 0.6,
    },
});

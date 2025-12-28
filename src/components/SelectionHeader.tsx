import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

interface Props {
    title: string;
    selectionMode: boolean;
    onCancelSelection: () => void;
    onEdit?: () => void;
    onReprocess?: () => void;
    onDelete?: () => void;
    onSettingsPress: () => void;
    processing?: boolean; // If global processing state exists
}

export const SelectionHeader: React.FC<Props> = ({
    title,
    selectionMode,
    onCancelSelection,
    onEdit,
    onReprocess,
    onDelete,
    onSettingsPress,
}) => {
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // If we want to hide action buttons depending on props provided
    const showActions = selectionMode;

    return (
        <View style={styles.header}>
            {selectionMode ? (
                <>
                    <TouchableOpacity onPress={onCancelSelection} style={styles.headerButton}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <View style={styles.selectionActions}>
                        {onEdit && (
                            <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                                <Ionicons name="pencil" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        )}
                        {onReprocess && (
                            <TouchableOpacity onPress={onReprocess} style={styles.actionButton}>
                                <Ionicons name="refresh" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        )}
                        {onDelete && (
                            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                                <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            ) : (
                <>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <TouchableOpacity onPress={onSettingsPress} style={styles.headerButton}>
                        <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.l,
        paddingVertical: theme.spacing.m,
        backgroundColor: theme.colors.background,
        minHeight: 64, // Min height to prevent layout jumps but allow expansion
    },
    headerTitle: {
        ...theme.typography.h1,
        color: theme.colors.text,
    },
    headerButton: {
        padding: theme.spacing.xs,
    },
    selectionActions: {
        flexDirection: 'row',
        gap: theme.spacing.l,
    },
    actionButton: {
        padding: theme.spacing.xs,
    },
});

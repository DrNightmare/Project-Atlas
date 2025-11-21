import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Document } from '../services/database';
import { theme } from '../theme';

interface Props {
    doc: Document;
    selected?: boolean;
    processing?: boolean; // indicates background processing
    onPress?: () => void;
    onLongPress?: () => void;
}

export const DocumentCard: React.FC<Props> = ({ doc, selected, onPress, onLongPress, processing }) => {
    const formatDateTime = () => {
        const date = new Date(doc.docDate);
        const dateStr = format(date, 'MMM d, yyyy');
        const timeStr = format(date, 'h:mm a');

        // Show time for flights and receipts
        if (doc.type === 'Flight' || doc.type === 'Receipt') {
            return `${dateStr} • ${timeStr}`;
        }
        return dateStr;
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Flight': return { name: 'airplane', color: theme.colors.flight };
            case 'Hotel': return { name: 'bed', color: theme.colors.hotel };
            case 'Receipt': return { name: 'receipt', color: theme.colors.receipt };
            case 'PDF': return { name: 'document', color: theme.colors.textSecondary };
            case 'Image': return { name: 'image', color: theme.colors.other };
            default: return { name: 'document-text', color: theme.colors.textLight };
        }
    };

    const icon = getIcon(doc.type);

    return (
        <TouchableOpacity
            style={[styles.card, selected && styles.selectedCard]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
                <Ionicons name={icon.name as any} size={24} color={icon.color} />
            </View>
            <View style={styles.info}>
                <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={1}>{doc.title}</Text>
                    {doc.owner && (
                        <View style={styles.ownerBadge}>
                            <Text style={styles.ownerText}>{doc.owner.split(' ')[0]}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.metaRow}>
                    <Text style={styles.date}>{formatDateTime()}</Text>
                    <Text style={styles.type}>{doc.type}</Text>
                </View>
            </View>
            {selected && (
                <View style={styles.checkIcon}>
                    <Ionicons name="checkmark" size={16} color="white" />
                </View>
            )}
            {processing && (
                <View style={styles.processingOverlay}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.s,
        ...theme.shadows.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    selectedCard: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight + '20', // 20% opacity
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.s,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.m,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        flex: 1,
        marginRight: 8,
    },
    ownerBadge: {
        backgroundColor: theme.colors.background,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    ownerText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    date: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginRight: 8,
    },
    type: {
        fontSize: 11,
        color: theme.colors.textLight,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    checkIcon: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.card,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.m,
    },
});

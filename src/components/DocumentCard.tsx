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
        return `${dateStr} • ${timeStr}`;
    };

    const getIcon = (type: string, subType?: string) => {
        // Check subType first for specific icons
        if (subType) {
            const lowerSub = subType.toLowerCase();
            if (lowerSub.includes('flight') || lowerSub.includes('plane')) return { name: 'airplane', color: theme.colors.flight };
            if (lowerSub.includes('bus')) return { name: 'bus', color: theme.colors.flight };
            if (lowerSub.includes('train') || lowerSub.includes('rail')) return { name: 'train', color: theme.colors.flight };
            if (lowerSub.includes('boat') || lowerSub.includes('ferry') || lowerSub.includes('ship')) return { name: 'boat', color: theme.colors.flight };
            if (lowerSub.includes('car') || lowerSub.includes('taxi') || lowerSub.includes('uber')) return { name: 'car', color: theme.colors.flight };

            if (lowerSub.includes('hotel')) return { name: 'bed', color: theme.colors.hotel };
            if (lowerSub.includes('home') || lowerSub.includes('airbnb') || lowerSub.includes('apartment')) return { name: 'home', color: theme.colors.hotel };

            if (lowerSub.includes('concert') || lowerSub.includes('music')) return { name: 'musical-notes', color: theme.colors.event };
            if (lowerSub.includes('museum')) return { name: 'easel', color: theme.colors.event };
        }

        // Fallback to main category
        switch (type) {
            case 'Transport': return { name: 'airplane', color: theme.colors.flight }; // Default transport
            case 'Stay': return { name: 'bed', color: theme.colors.hotel };
            case 'Activity': return { name: 'ticket', color: theme.colors.event };
            case 'Receipt': return { name: 'receipt', color: theme.colors.receipt };
            case 'PDF': return { name: 'document', color: theme.colors.textSecondary };
            case 'Image': return { name: 'image', color: theme.colors.other };
            default: return { name: 'document-text', color: theme.colors.textLight };
        }
    };

    const icon = getIcon(doc.type, doc.subType);

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
                </View>

                {doc.owner && (
                    <View style={styles.ownersContainer}>
                        {doc.owner.split(',').map((owner, index) => (
                            <View key={index} style={styles.ownerBadge}>
                                <Text style={styles.ownerText}>{owner.trim().split(' ')[0]}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.metaRow}>
                    <Text style={styles.date}>{formatDateTime()}</Text>
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
    ownersContainer: {
        flexDirection: 'row',
        gap: 4,
        flexWrap: 'wrap',
        marginBottom: 6,
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
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    type: {
        fontSize: 11,
        fontWeight: '600',
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

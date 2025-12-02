import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Document, Trip } from '../services/database';
import { theme } from '../theme';
import { DocumentCard } from './DocumentCard';

interface Props {
    trip: Trip;
    documents: Document[];
    selected: boolean;
    selectedDocIds: Set<number>;
    onPressDocument: (doc: Document) => void;
    onLongPressDocument: (id: number) => void;
    onAddDocument: (tripId: number) => void;
    onLongPress: () => void;
}

export const TripCard: React.FC<Props> = ({
    trip,
    documents,
    selected,
    selectedDocIds,
    onPressDocument,
    onLongPressDocument,
    onAddDocument,
    onLongPress
}) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const dateRange = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.header,
                    expanded && styles.headerExpanded,
                    selected && styles.selectedHeader
                ]}
                onPress={toggleExpand}
                onLongPress={onLongPress}
                activeOpacity={0.7}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name="map" size={24} color={theme.colors.primary} />
                </View>

                <View style={styles.headerInfo}>
                    <Text style={styles.title}>{trip.title}</Text>
                    <Text style={styles.date}>{dateRange}</Text>
                </View>

                <View style={styles.rightContainer}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{documents.length}</Text>
                    </View>
                    <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={theme.colors.textLight}
                    />
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.content}>
                    {documents.map((doc) => (
                        <View key={doc.id} style={styles.documentWrapper}>
                            <DocumentCard
                                doc={doc}
                                onPress={() => onPressDocument(doc)}
                                onLongPress={() => onLongPressDocument(doc.id)}
                                selected={selectedDocIds.has(doc.id)}
                                processing={doc.processing === 1}
                            />
                        </View>
                    ))}

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => onAddDocument(trip.id)}
                    >
                        <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.addButtonText}>Add Document to {trip.title}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.m,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.m,
        ...theme.shadows.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.card,
    },
    headerExpanded: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    selectedHeader: {
        backgroundColor: theme.colors.primary + '15',
        borderColor: theme.colors.primary,
        borderWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.m,
    },
    headerInfo: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
    },
    date: {
        fontSize: 12,
        color: theme.colors.textLight,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    badge: {
        backgroundColor: theme.colors.background,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    content: {
        padding: theme.spacing.m,
        backgroundColor: theme.colors.background, // Slightly different bg?
        gap: theme.spacing.m,
    },
    documentWrapper: {
        paddingLeft: theme.spacing.m,
        borderLeftWidth: 2,
        borderLeftColor: theme.colors.border,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
        borderRadius: theme.borderRadius.m,
        marginTop: theme.spacing.s,
        gap: theme.spacing.s,
    },
    addButtonText: {
        color: theme.colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
});

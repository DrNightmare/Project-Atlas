import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getDocumentById, getTrips, Trip, updateDocument } from '../src/services/database';
import { theme } from '../src/theme';

export default function BulkEditScreen() {
    const router = useRouter();
    const { docIds } = useLocalSearchParams<{ docIds: string }>();

    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<number | undefined>(undefined);
    const [documentCount, setDocumentCount] = useState(0);

    useEffect(() => {
        setTrips(getTrips());

        // Parse document IDs and count them
        if (docIds) {
            const ids = docIds.split(',').filter(id => id.trim());
            setDocumentCount(ids.length);
        }
    }, [docIds]);

    const handleSave = () => {
        if (!docIds) return;

        const ids = docIds.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));

        // Update each document
        let successCount = 0;
        for (const id of ids) {
            const doc = getDocumentById(id);
            if (doc) {
                updateDocument(
                    id,
                    doc.title,
                    doc.docDate,
                    doc.type,
                    doc.subType,
                    doc.owner,
                    doc.processing,
                    selectedTripId
                );
                successCount++;
            }
        }

        Alert.alert(
            'Success',
            `Updated ${successCount} document${successCount !== 1 ? 's' : ''}`,
            [{ text: 'OK', onPress: () => router.back() }]
        );
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Bulk Edit',
                    headerBackTitle: 'Back',
                }}
            />

            <ScrollView style={styles.content}>
                <Text style={styles.infoText}>
                    Editing {documentCount} document{documentCount !== 1 ? 's' : ''}
                </Text>

                <Text style={styles.label}>Trip</Text>
                <Text style={styles.helperText}>
                    Assign all selected documents to a trip
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tripScroll}
                    contentContainerStyle={styles.tripScrollContent}
                >
                    <TouchableOpacity
                        style={[
                            styles.tripChip,
                            selectedTripId === undefined && styles.tripChipActive
                        ]}
                        onPress={() => setSelectedTripId(undefined)}
                    >
                        <Text style={[
                            styles.tripChipText,
                            selectedTripId === undefined && styles.tripChipTextActive
                        ]}>
                            None
                        </Text>
                    </TouchableOpacity>

                    {trips.map((trip) => (
                        <TouchableOpacity
                            key={trip.id}
                            style={[
                                styles.tripChip,
                                selectedTripId === trip.id && styles.tripChipActive
                            ]}
                            onPress={() => setSelectedTripId(trip.id)}
                        >
                            <Text style={[
                                styles.tripChipText,
                                selectedTripId === trip.id && styles.tripChipTextActive
                            ]}>
                                {trip.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.futureSection}>
                    <Text style={styles.futureSectionTitle}>Future Bulk Edit Fields</Text>
                    <Text style={styles.futureSectionText}>
                        Additional fields like Type, Owner, and Date will be available here in future updates.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}
                >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        padding: theme.spacing.l,
    },
    infoText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.l,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.m,
    },
    helperText: {
        fontSize: 14,
        color: theme.colors.textLight,
        marginBottom: theme.spacing.m,
    },
    tripScroll: {
        marginBottom: theme.spacing.l,
    },
    tripScrollContent: {
        gap: theme.spacing.s,
    },
    tripChip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tripChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    tripChipText: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '500',
    },
    tripChipTextActive: {
        color: '#fff',
    },
    futureSection: {
        marginTop: theme.spacing.xl,
        padding: theme.spacing.l,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    futureSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    futureSectionText: {
        fontSize: 12,
        color: theme.colors.textLight,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        gap: theme.spacing.m,
        padding: theme.spacing.l,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    button: {
        flex: 1,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.s,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
    },
    cancelButtonText: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

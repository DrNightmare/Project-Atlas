import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripForm } from '../src/components/TripForm';
import { updateTrip } from '../src/services/database';
import { theme } from '../src/theme';

export default function EditTripScreen() {
    const router = useRouter();
    const { id, title, startDate, endDate } = useLocalSearchParams<{
        id: string;
        title: string;
        startDate: string;
        endDate: string;
    }>();

    // Parse dates with fallback to current date if invalid
    const parsedStartDate = startDate ? new Date(startDate) : new Date();
    const parsedEndDate = endDate ? new Date(endDate) : new Date();

    const handleSave = (newTitle: string, newStartDate: Date, newEndDate: Date) => {
        updateTrip(
            Number(id),
            newTitle,
            newStartDate.toISOString(),
            newEndDate.toISOString()
        );
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Trip</Text>
                <View style={{ width: 24 }} />
            </View>

            <TripForm
                initialTitle={title}
                initialStartDate={parsedStartDate}
                initialEndDate={parsedEndDate}
                onSave={handleSave}
                onCancel={() => router.back()}
                saveButtonText="Save Changes"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        padding: theme.spacing.s,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
});

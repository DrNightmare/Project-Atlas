import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
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
            <Stack.Screen
                options={{
                    title: 'Edit Trip',
                    headerBackTitle: 'Back',
                }}
            />

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
});

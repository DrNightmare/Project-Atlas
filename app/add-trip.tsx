import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TripForm } from '../src/components/TripForm';
import { addTrip } from '../src/services/database';
import { theme } from '../src/theme';

export default function AddTripScreen() {
    const router = useRouter();

    const handleSave = (title: string, startDate: Date, endDate: Date) => {
        addTrip(
            title,
            startDate.toISOString(),
            endDate.toISOString()
        );
        router.back();
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'New Trip',
                    headerBackTitle: 'Back',
                }}
            />

            <TripForm
                onSave={handleSave}
                onCancel={() => router.back()}
                saveButtonText="Create Trip"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
});

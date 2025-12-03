import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { theme } from '../theme';

interface Props {
    initialTitle?: string;
    initialStartDate?: Date;
    initialEndDate?: Date;
    onSave: (title: string, startDate: Date, endDate: Date) => void;
    onCancel: () => void;
    saveButtonText?: string;
}

export const TripForm: React.FC<Props> = ({
    initialTitle = '',
    initialStartDate = new Date(),
    initialEndDate = new Date(),
    onSave,
    onCancel,
    saveButtonText = 'Save',
}) => {
    const [title, setTitle] = useState(initialTitle);
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    // Update state when initial props change (important for edit mode)
    useEffect(() => {
        setTitle(initialTitle);
        setStartDate(initialStartDate);
        setEndDate(initialEndDate);
    }, [initialTitle, initialStartDate, initialEndDate]);

    const handleSave = () => {
        if (!title.trim()) {
            return;
        }
        onSave(title.trim(), startDate, endDate);
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.form}>
                <Text style={styles.label}>Trip Name</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Vietnam 2024"
                    autoFocus
                />

                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartDatePicker(true)}
                >
                    <Text style={styles.dateButtonText}>
                        {format(startDate, 'MMM dd, yyyy')}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                {showStartDatePicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                            setShowStartDatePicker(false);
                            if (selectedDate) setStartDate(selectedDate);
                        }}
                    />
                )}

                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndDatePicker(true)}
                >
                    <Text style={styles.dateButtonText}>
                        {format(endDate, 'MMM dd, yyyy')}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                {showEndDatePicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                            setShowEndDatePicker(false);
                            if (selectedDate) setEndDate(selectedDate);
                        }}
                    />
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={onCancel}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.saveButton, !title.trim() && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={!title.trim()}
                >
                    <Text style={styles.saveButtonText}>{saveButtonText}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    form: {
        padding: theme.spacing.l,
    },
    label: {
        ...theme.typography.caption,
        fontWeight: '600',
        marginBottom: theme.spacing.xs,
        marginTop: theme.spacing.m,
    },
    input: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.s,
        padding: theme.spacing.m,
        fontSize: 16,
        color: theme.colors.text,
    },
    dateButton: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.s,
        padding: theme.spacing.m,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateButtonText: {
        fontSize: 16,
        color: theme.colors.text,
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
    buttonDisabled: {
        backgroundColor: theme.colors.textLight,
        opacity: 0.5,
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

import { Ionicons } from '@expo/vector-icons';
import { format, isSameMonth } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
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
    initialStartDate,
    initialEndDate,
    onSave,
    onCancel,
    saveButtonText = 'Save',
}) => {
    // Use useMemo to create stable default dates
    const defaultStartDate = useMemo(() => new Date(), []);
    const defaultEndDate = useMemo(() => new Date(), []);

    const [title, setTitle] = useState(initialTitle);
    const [startDate, setStartDate] = useState(initialStartDate || defaultStartDate);
    const [endDate, setEndDate] = useState(initialEndDate || defaultEndDate);
    const [showCalendar, setShowCalendar] = useState(false);

    // Update state when initial props change (important for edit mode)
    // Only update if the values are actually different
    useEffect(() => {
        if (initialTitle !== undefined) setTitle(initialTitle);
        if (initialStartDate && initialStartDate.getTime() !== startDate.getTime()) {
            setStartDate(initialStartDate);
        }
        if (initialEndDate && initialEndDate.getTime() !== endDate.getTime()) {
            setEndDate(initialEndDate);
        }
    }, [initialTitle, initialStartDate, initialEndDate]);

    const handleSave = () => {
        if (!title.trim()) {
            return;
        }
        onSave(title.trim(), startDate, endDate);
    };

    const handleDateChange = (date: any, type: string) => {
        if (type === 'END_DATE') {
            setEndDate(date);
        } else {
            setStartDate(date);
            // If selecting start date and it's after end date, reset end date
            if (date > endDate) {
                setEndDate(date);
            }
        }
    };

    const formatDateRange = () => {
        const start = format(startDate, 'MMM d');
        const end = format(endDate, 'd, yyyy');

        // If same month, show "Mar 15 - 22, 2024"
        if (isSameMonth(startDate, endDate)) {
            return `${start} - ${end}`;
        }

        // If different months, show "Mar 15 - Apr 5, 2024"
        return `${start} - ${format(endDate, 'MMM d, yyyy')}`;
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

                <Text style={styles.label}>Date Range</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowCalendar(true)}
                >
                    <Text style={styles.dateButtonText}>
                        {formatDateRange()}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
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

            <Modal
                visible={showCalendar}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCalendar(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Date Range</Text>
                            <TouchableOpacity onPress={() => setShowCalendar(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <CalendarPicker
                            startFromMonday={true}
                            allowRangeSelection={true}
                            selectedStartDate={startDate}
                            selectedEndDate={endDate}
                            onDateChange={handleDateChange}
                            todayBackgroundColor={theme.colors.primary + '20'}
                            selectedDayColor={theme.colors.primary}
                            selectedDayTextColor="#FFFFFF"
                            selectedRangeStartStyle={{ backgroundColor: theme.colors.primary }}
                            selectedRangeEndStyle={{ backgroundColor: theme.colors.primary }}
                            selectedRangeStyle={{ backgroundColor: theme.colors.primary + '30' }}
                            textStyle={{
                                fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                                color: theme.colors.text,
                            }}
                            monthTitleStyle={{ color: theme.colors.text, fontWeight: '600' }}
                            yearTitleStyle={{ color: theme.colors.text, fontWeight: '600' }}
                        />

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={() => setShowCalendar(false)}
                            >
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalConfirmButton]}
                                onPress={() => setShowCalendar(false)}
                            >
                                <Text style={styles.modalConfirmButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: theme.spacing.l,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.l,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: theme.spacing.m,
        marginTop: theme.spacing.l,
    },
    modalButton: {
        flex: 1,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.s,
        alignItems: 'center',
    },
    modalCancelButton: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    modalConfirmButton: {
        backgroundColor: theme.colors.primary,
    },
    modalCancelButtonText: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    modalConfirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

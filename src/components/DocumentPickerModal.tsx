import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';

interface DocumentPickerModalProps {
    visible: boolean;
    onTakePhoto: () => void;
    onChooseFile: () => void;
    onCancel: () => void;
}

export const DocumentPickerModal: React.FC<DocumentPickerModalProps> = ({
    visible,
    onTakePhoto,
    onChooseFile,
    onCancel,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <Pressable style={styles.overlay} onPress={onCancel}>
                <View style={styles.container}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <View style={styles.content}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Add Document</Text>
                                <Text style={styles.subtitle}>Choose how you want to add a document</Text>
                            </View>

                            <View style={styles.options}>
                                <TouchableOpacity style={styles.option} onPress={onTakePhoto}>
                                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                                        <Ionicons name="camera" size={28} color={theme.colors.primary} />
                                    </View>
                                    <View style={styles.optionText}>
                                        <Text style={styles.optionTitle}>Take Photo</Text>
                                        <Text style={styles.optionSubtitle}>Use camera to scan</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <TouchableOpacity style={styles.option} onPress={onChooseFile}>
                                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                                        <Ionicons name="folder-open" size={28} color={theme.colors.primary} />
                                    </View>
                                    <View style={styles.optionText}>
                                        <Text style={styles.optionTitle}>Choose File</Text>
                                        <Text style={styles.optionSubtitle}>Select from storage</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    header: {
        paddingHorizontal: theme.spacing.l,
        paddingTop: theme.spacing.l,
        paddingBottom: theme.spacing.m,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    options: {
        paddingHorizontal: theme.spacing.l,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.m,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.m,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginLeft: 72, // Align with text
    },
    cancelButton: {
        marginTop: theme.spacing.m,
        marginHorizontal: theme.spacing.l,
        paddingVertical: theme.spacing.m,
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 12,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
});

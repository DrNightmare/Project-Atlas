import { Ionicons } from '@expo/vector-icons';
import { differenceInMonths, format } from 'date-fns';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IdentityDocument } from '../services/database';
import { theme } from '../theme';

interface Props {
    doc: IdentityDocument;
    onPress?: () => void;
    processing?: boolean;
}

export const IdentityDocumentCard: React.FC<Props> = ({ doc, onPress, processing }) => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'Passport': return { name: 'airplane', color: theme.colors.passport };
            case 'Visa': return { name: 'document-text', color: theme.colors.visa };
            case 'Aadhaar': return { name: 'card', color: theme.colors.aadhaar };
            case 'Driver License': return { name: 'car', color: theme.colors.license };
            case 'PAN Card': return { name: 'wallet', color: theme.colors.pan };
            default: return { name: 'document', color: theme.colors.textSecondary };
        }
    };

    const isExpiringSoon = () => {
        if (!doc.expiryDate) return false;
        const expiryDate = new Date(doc.expiryDate);
        const monthsUntilExpiry = differenceInMonths(expiryDate, new Date());
        return monthsUntilExpiry >= 0 && monthsUntilExpiry <= 6;
    };

    const isExpired = () => {
        if (!doc.expiryDate) return false;
        return new Date(doc.expiryDate) < new Date();
    };

    const icon = getIcon(doc.type);
    const showExpiryWarning = isExpiringSoon();
    const expired = isExpired();

    return (
        <TouchableOpacity
            style={[
                styles.card,
                expired && styles.expiredCard,
                showExpiryWarning && !expired && styles.warningCard
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
                <Ionicons name={icon.name as any} size={28} color={icon.color} />
            </View>

            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{doc.title}</Text>
                <Text style={styles.type}>{doc.type}</Text>

                {doc.documentNumber && (
                    <Text style={styles.documentNumber} numberOfLines={1}>
                        {doc.documentNumber}
                    </Text>
                )}

                {doc.expiryDate && (
                    <View style={styles.expiryRow}>
                        <Ionicons
                            name={expired ? "close-circle" : showExpiryWarning ? "warning" : "calendar-outline"}
                            size={14}
                            color={expired ? theme.colors.error : showExpiryWarning ? theme.colors.warning : theme.colors.textLight}
                        />
                        <Text style={[
                            styles.expiryText,
                            expired && styles.expiredText,
                            showExpiryWarning && !expired && styles.warningText
                        ]}>
                            {expired ? 'Expired ' : 'Expires '}{format(new Date(doc.expiryDate), 'MMM d, yyyy')}
                        </Text>
                    </View>
                )}

                {doc.owner && (
                    <View style={styles.ownersContainer}>
                        {doc.owner.split(',').map((owner, index) => (
                            <View key={index} style={styles.ownerBadge}>
                                <Text style={styles.ownerText}>{owner.trim()}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

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
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.m,
        ...theme.shadows.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minHeight: 140,
    },
    warningCard: {
        borderColor: theme.colors.warning,
        borderWidth: 2,
    },
    expiredCard: {
        borderColor: theme.colors.error,
        borderWidth: 2,
        opacity: 0.7,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: theme.borderRadius.s,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    type: {
        fontSize: 11,
        color: theme.colors.textLight,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    documentNumber: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontFamily: 'monospace',
        marginBottom: 8,
    },
    expiryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    expiryText: {
        fontSize: 12,
        color: theme.colors.textLight,
        marginLeft: 4,
    },
    warningText: {
        color: theme.colors.warning,
        fontWeight: '600',
    },
    expiredText: {
        color: theme.colors.error,
        fontWeight: '600',
    },
    ownersContainer: {
        flexDirection: 'row',
        gap: 4,
        flexWrap: 'wrap',
        marginTop: 4,
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
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.m,
    },
});

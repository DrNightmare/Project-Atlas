import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Document } from '../services/database';

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

        // Show time for flights and receipts
        if (doc.type === 'Flight' || doc.type === 'Receipt') {
            return `${dateStr} • ${timeStr}`;
        }
        return dateStr;
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'Flight': return { name: 'airplane', color: '#007AFF' };
            case 'Hotel': return { name: 'bed', color: '#FF9500' };
            case 'Receipt': return { name: 'receipt', color: '#34C759' };
            case 'PDF': return { name: 'document', color: '#FF3B30' };
            case 'Image': return { name: 'image', color: '#5856D6' };
            default: return { name: 'document-text', color: '#8E8E93' };
        }
    };

    const icon = getIcon(doc.type);

    return (
        <TouchableOpacity
            style={[styles.card, selected && styles.selectedCard]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
                <Ionicons name={icon.name as any} size={32} color={icon.color} />
            </View>
            <View style={styles.info}>
                <Text style={styles.title}>{doc.title}</Text>
                {doc.owner && (
                    <Text style={styles.owner}>👤 {doc.owner}</Text>
                )}
                <Text style={styles.date}>{formatDateTime()}</Text>
                <Text style={styles.type}>{doc.type}</Text>
            </View>
            {selected && (
                <View style={styles.checkIcon}>
                    <Text style={styles.checkText}>✓</Text>
                </View>
            )}
            {processing && (
                <View style={styles.processingOverlay}>
                    <ActivityIndicator size="small" color="#007AFF" />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCard: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F8FF',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        marginLeft: 12,
        justifyContent: 'center',
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    owner: {
        fontSize: 13,
        color: '#007AFF',
        marginTop: 2,
        fontWeight: '500',
    },
    date: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    type: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
        fontWeight: '500',
    },
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
});

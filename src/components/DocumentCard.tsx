import { format } from 'date-fns';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

    return (
        <TouchableOpacity
            style={[styles.card, selected && styles.selectedCard]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <Image source={{ uri: doc.uri }} style={styles.image} />
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
    image: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#eee',
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
});

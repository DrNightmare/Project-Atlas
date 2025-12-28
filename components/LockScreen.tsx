
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/auth-context';
import { useAppTheme } from '../src/context/ThemeContext';

export const LockScreen = () => {
    const { authenticate, isLoading } = useAuth();
    const theme = useAppTheme();
    const { colors } = theme;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
                    <Ionicons name="lock-closed" size={48} color={colors.primary} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                    Atlas Locked
                </Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Authentication is required to access your data.
                </Text>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={authenticate}
                    disabled={isLoading}
                >
                    <Ionicons name="finger-print" size={24} color={'#FFFFFF'} style={styles.buttonIcon} />
                    <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                        Unlock
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        padding: 32,
        width: '100%',
        maxWidth: 400,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 24,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonIcon: {
        marginRight: 12,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
    },
});

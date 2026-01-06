import { useCreateDomain } from '@/hooks/useDomains';
import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddDomainScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [interval, setInterval] = useState('60'); // Minutes
    const [errors, setErrors] = useState<{ name?: string, url?: string }>({});

    const { mutate: createDomain, isPending } = useCreateDomain();

    const validate = () => {
        const newErrors: { name?: string, url?: string } = {};
        if (!name) newErrors.name = 'Naam is verplicht';
        if (!url) newErrors.url = 'URL is verplicht';
        else if (!url.startsWith('http://') && !url.startsWith('https://')) {
            newErrors.url = 'URL moet beginnen met http:// of https://';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;

        createDomain({
            name,
            url,
            checkInterval: parseInt(interval) * 60,
        }, {
            onSuccess: () => {
                router.back();
            }
        });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Domein Toevoegen</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Naam</Text>
                        <TextInput
                            style={[styles.input, errors.name && styles.inputError]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Mijn Website"
                            placeholderTextColor={colors.muted}
                        />
                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>URL</Text>
                        <TextInput
                            style={[styles.input, errors.url && styles.inputError]}
                            value={url}
                            onChangeText={setUrl}
                            placeholder="https://example.com"
                            placeholderTextColor={colors.muted}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                        {errors.url && <Text style={styles.errorText}>{errors.url}</Text>}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Controle Interval (minuten)</Text>
                        <View style={styles.intervalGrid}>
                            {['1', '5', '15', '30', '60'].map((mins) => (
                                <Pressable
                                    key={mins}
                                    style={[styles.intervalOption, interval === mins && styles.intervalOptionActive]}
                                    onPress={() => setInterval(mins)}
                                >
                                    <Text style={[styles.intervalText, interval === mins && styles.intervalTextActive]}>
                                        {mins}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>

                <Pressable
                    style={[styles.saveButton, isPending && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isPending}
                >
                    {isPending ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Opslaan</Text>
                    )}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.card,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.foreground,
    },
    inputError: {
        borderColor: colors.error,
    },
    errorText: {
        color: colors.error,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    intervalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    intervalOption: {
        flex: 1,
        minWidth: 50,
        height: 44,
        backgroundColor: colors.background,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    intervalOptionActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    intervalText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.muted,
    },
    intervalTextActive: {
        color: '#ffffff',
    },
    saveButton: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
    },
});

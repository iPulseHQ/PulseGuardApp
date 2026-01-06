import { colors } from '@/lib/theme/colors';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, isLoaded } = useUser();

    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSave = async () => {
        if (!user) return;
        setIsUpdating(true);
        try {
            await user.update({
                firstName,
                lastName,
            });
            Alert.alert('Succes', 'Je profiel is bijgewerkt.');
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Fout', 'Kon profiel niet bijwerken.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (!isLoaded) {
        return (
            <View style={[styles.container, styles.centerContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Profiel Bewerken</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        {user?.imageUrl ? (
                            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Ionicons name="person" size={48} color={colors.muted} />
                            </View>
                        )}
                        <Pressable style={styles.editAvatarButton}>
                            <Ionicons name="camera" size={20} color="#ffffff" />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Voornaam</Text>
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Voornaam"
                            placeholderTextColor={colors.muted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Achternaam</Text>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Achternaam"
                            placeholderTextColor={colors.muted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>E-mailadres (Alleen lezen)</Text>
                        <TextInput
                            style={[styles.input, styles.inputDisabled, { color: colors.muted }]}
                            value={user?.primaryEmailAddress?.emailAddress}
                            editable={false}
                        />
                    </View>
                </View>

                <Pressable
                    style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isUpdating}
                >
                    {isUpdating ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Wijzigingen Opslaan</Text>
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
    centerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
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
    avatarSection: {
        alignItems: 'center',
        marginVertical: 32,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    avatarPlaceholder: {
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    editAvatarButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.background,
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
    inputDisabled: {
        backgroundColor: `${colors.border}10`,
    },
    saveButton: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
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

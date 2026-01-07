import { getBiometricTypeName, useSecurity } from '@/context/SecurityContext';
import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SecurityScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const {
        settings,
        updateSettings,
        biometricState,
        authenticate,
        isLoading,
    } = useSecurity();

    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleBiometricToggle = async (enabled: boolean) => {
        if (enabled) {
            // Test biometric authentication before enabling
            if (!biometricState.isAvailable) {
                Alert.alert(
                    'Niet beschikbaar',
                    'Biometrische authenticatie is niet beschikbaar op dit apparaat.'
                );
                return;
            }

            if (!biometricState.isEnrolled) {
                Alert.alert(
                    'Niet ingesteld',
                    'Stel eerst Face ID of Touch ID in via je apparaatinstellingen.'
                );
                return;
            }

            setIsAuthenticating(true);
            const success = await authenticate();
            setIsAuthenticating(false);

            if (!success) {
                Alert.alert(
                    'Authenticatie mislukt',
                    'Biometrische authenticatie kon niet worden ingeschakeld.'
                );
                return;
            }
        }

        await updateSettings({ biometricEnabled: enabled });

        if (enabled) {
            Alert.alert(
                'Ingeschakeld',
                `${getBiometricTypeName(biometricState.biometricTypes)} is nu actief voor app-beveiliging.`
            );
        }
    };

    const handleAutoLockToggle = async (enabled: boolean) => {
        await updateSettings({
            autoLockEnabled: enabled,
            lastActiveTime: enabled ? Date.now() : null,
        });
    };

    const handleAutoLockTimeoutChange = async () => {
        Alert.alert(
            'Automatisch Slot Timeout',
            'Kies na hoeveel minuten inactiviteit de app vergrendelt:',
            [
                { text: '1 minuut', onPress: () => updateSettings({ autoLockTimeout: 1 }) },
                { text: '5 minuten', onPress: () => updateSettings({ autoLockTimeout: 5 }) },
                { text: '15 minuten', onPress: () => updateSettings({ autoLockTimeout: 15 }) },
                { text: '30 minuten', onPress: () => updateSettings({ autoLockTimeout: 30 }) },
                { text: 'Annuleren', style: 'cancel' },
            ]
        );
    };

    const handleChangePassword = () => {
        Alert.alert(
            'Wachtwoord wijzigen',
            'Je kunt je wachtwoord wijzigen via de PulseGuard website of de Clerk instellingen.',
            [{ text: 'OK' }]
        );
    };

    const handleTwoFactorAuth = () => {
        Alert.alert(
            'Twee-factor authenticatie',
            'Twee-factor authenticatie kan worden ingesteld via de PulseGuard website.',
            [{ text: 'OK' }]
        );
    };

    const SecurityItem = ({
        icon,
        title,
        subtitle,
        onPress,
        rightComponent,
        disabled = false,
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        title: string;
        subtitle: string;
        onPress?: () => void;
        rightComponent?: React.ReactNode;
        disabled?: boolean;
    }) => (
        <Pressable
            style={[styles.item, disabled && styles.itemDisabled]}
            onPress={onPress}
            disabled={disabled || !onPress}
        >
            <View style={[styles.iconContainer, disabled && styles.iconContainerDisabled]}>
                <Ionicons name={icon} size={24} color={disabled ? colors.muted : colors.primary} />
            </View>
            <View style={styles.content}>
                <Text style={[styles.itemTitle, disabled && styles.itemTitleDisabled]}>{title}</Text>
                <Text style={styles.itemSubtitle}>{subtitle}</Text>
            </View>
            {rightComponent || (
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            )}
        </Pressable>
    );

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Beveiliging</Text>
                    <View style={{ width: 44 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Beveiliging</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Login & Access */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Login & Toegang</Text>
                    <View style={styles.card}>
                        <SecurityItem
                            icon="key-outline"
                            title="Wachtwoord"
                            subtitle="Wijzig je wachtwoord om je account veilig te houden"
                            onPress={handleChangePassword}
                        />
                        <SecurityItem
                            icon="shield-checkmark-outline"
                            title="Twee-factor authenticatie"
                            subtitle="Voeg een extra beveiligingslaag toe"
                            onPress={handleTwoFactorAuth}
                        />
                    </View>
                </View>

                {/* App Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Beveiliging</Text>
                    <View style={styles.card}>
                        <SecurityItem
                            icon="finger-print-outline"
                            title="Biometrische Login"
                            subtitle={
                                biometricState.isAvailable
                                    ? `Gebruik ${getBiometricTypeName(biometricState.biometricTypes)} om snel in te loggen`
                                    : 'Niet beschikbaar op dit apparaat'
                            }
                            disabled={!biometricState.isAvailable}
                            rightComponent={
                                isAuthenticating ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <Switch
                                        value={settings.biometricEnabled}
                                        onValueChange={handleBiometricToggle}
                                        disabled={!biometricState.isAvailable || isAuthenticating}
                                        trackColor={{ false: colors.border, true: colors.primary }}
                                        thumbColor="#ffffff"
                                    />
                                )
                            }
                        />
                        <SecurityItem
                            icon="lock-closed-outline"
                            title="Automatisch Slot"
                            subtitle={
                                settings.autoLockEnabled
                                    ? `Vergrendel na ${settings.autoLockTimeout} minuten inactiviteit`
                                    : 'App vergrendelt niet automatisch'
                            }
                            disabled={!settings.biometricEnabled}
                            rightComponent={
                                <Switch
                                    value={settings.autoLockEnabled}
                                    onValueChange={handleAutoLockToggle}
                                    disabled={!settings.biometricEnabled}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor="#ffffff"
                                />
                            }
                        />
                        {settings.autoLockEnabled && settings.biometricEnabled && (
                            <SecurityItem
                                icon="time-outline"
                                title="Timeout instellen"
                                subtitle={`Huidige instelling: ${settings.autoLockTimeout} minuten`}
                                onPress={handleAutoLockTimeoutChange}
                            />
                        )}
                    </View>
                </View>

                {/* Status Info */}
                <View style={styles.statusCard}>
                    <Ionicons
                        name={settings.biometricEnabled ? 'shield-checkmark' : 'shield-outline'}
                        size={48}
                        color={settings.biometricEnabled ? colors.success : colors.muted}
                    />
                    <Text style={styles.statusTitle}>
                        {settings.biometricEnabled ? 'App beveiligd' : 'Beveiliging uitgeschakeld'}
                    </Text>
                    <Text style={styles.statusSubtitle}>
                        {settings.biometricEnabled
                            ? `${getBiometricTypeName(biometricState.biometricTypes)} is actief`
                            : 'Schakel biometrische login in voor extra beveiliging'}
                    </Text>
                </View>
            </ScrollView>
        </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    itemDisabled: {
        opacity: 0.6,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: `${colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconContainerDisabled: {
        backgroundColor: `${colors.muted}15`,
    },
    content: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
    itemTitleDisabled: {
        color: colors.muted,
    },
    itemSubtitle: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 2,
    },
    statusCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: 8,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        marginTop: 16,
    },
    statusSubtitle: {
        fontSize: 14,
        color: colors.muted,
        marginTop: 8,
        textAlign: 'center',
    },
});

import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/useNotifications';
import { colors } from '@/lib/theme/colors';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useUser();
    const { signOut } = useClerk();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const { data: notificationSettings } = useNotificationSettings();
    const { mutate: updateSettings } = useUpdateNotificationSettings();

    const handleSignOut = async () => {
        Alert.alert(
            'Uitloggen',
            'Weet je zeker dat je wilt uitloggen?',
            [
                { text: 'Annuleren', style: 'cancel' },
                {
                    text: 'Uitloggen',
                    style: 'destructive',
                    onPress: async () => {
                        setIsSigningOut(true);
                        try {
                            await signOut();
                            // Navigation happens automatically via auth-aware routing
                        } catch (error) {
                            console.log('Sign out error:', error);
                            Alert.alert('Fout', 'Kon niet uitloggen. Probeer het opnieuw.');
                        } finally {
                            setIsSigningOut(false);
                        }
                    },
                },
            ]
        );
    };

    const SettingItem = ({
        icon,
        iconColor = colors.primary,
        title,
        subtitle,
        onPress,
        rightElement,
        showChevron = true,
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        iconColor?: string;
        title: string;
        subtitle?: string;
        onPress?: () => void;
        rightElement?: React.ReactNode;
        showChevron?: boolean;
    }) => (
        <Pressable style={styles.settingItem} onPress={onPress} disabled={!onPress && !rightElement}>
            <View style={[styles.settingIcon, { backgroundColor: `${iconColor}15` }]}>
                <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {rightElement || (showChevron && onPress && (
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            ))}
        </Pressable>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Instellingen</Text>
                </View>

                {/* Profile Card */}
                <Pressable
                    style={styles.profileCard}
                    onPress={() => router.push('/profile' as any)}
                >
                    {user?.imageUrl ? (
                        <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Ionicons name="person" size={32} color={colors.muted} />
                        </View>
                    )}
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>
                            {user?.fullName || user?.firstName || 'Gebruiker'}
                        </Text>
                        <Text style={styles.profileEmail}>
                            {user?.primaryEmailAddress?.emailAddress || 'Geen e-mail'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </Pressable>

                {/* Notifications Section */}
                <SectionHeader title="Meldingen" />
                <View style={styles.section}>
                    <SettingItem
                        icon="notifications-outline"
                        title="Push meldingen"
                        subtitle="Ontvang meldingen over je domeinen"
                        rightElement={
                            <Switch
                                value={notificationSettings?.pushEnabled ?? true}
                                onValueChange={(value) => updateSettings({ pushEnabled: value })}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor="#ffffff"
                            />
                        }
                        showChevron={false}
                    />
                    <SettingItem
                        icon="list-outline"
                        iconColor={colors.warning}
                        title="Meldingen geschiedenis"
                        subtitle="Bekijk al je eerdere meldingen"
                        onPress={() => router.push('/notifications' as any)}
                    />
                    <SettingItem
                        icon="mail-outline"
                        iconColor={colors.success}
                        title="E-mail meldingen"
                        subtitle="Ontvang e-mails bij incidenten"
                        rightElement={
                            <Switch
                                value={notificationSettings?.emailEnabled ?? true}
                                onValueChange={(value) => updateSettings({ emailEnabled: value })}
                                trackColor={{ false: colors.border, true: colors.success }}
                                thumbColor="#ffffff"
                            />
                        }
                        showChevron={false}
                    />
                </View>

                {/* Monitoring Section */}
                <SectionHeader title="Monitoring" />
                <View style={styles.section}>
                    <SettingItem
                        icon="globe-outline"
                        title="Domeinen beheren"
                        subtitle="Voeg toe, bewerk of verwijder domeinen"
                        onPress={() => router.push('/(tabs)/domains')}
                    />
                    <SettingItem
                        icon="bar-chart-outline"
                        iconColor={colors.chart4}
                        title="Rapporten"
                        subtitle="Bekijk uptime en performance rapporten"
                        onPress={() => router.push('/reports' as any)}
                    />
                </View>

                {/* Account Section */}
                <SectionHeader title="Account" />
                <View style={styles.section}>
                    <SettingItem
                        icon="person-outline"
                        iconColor={colors.warning}
                        title="Profiel bewerken"
                        onPress={() => router.push('/profile' as any)}
                    />
                    <SettingItem
                        icon="shield-checkmark-outline"
                        iconColor={colors.success}
                        title="Beveiliging"
                        subtitle="Wachtwoord en twee-factor authenticatie"
                        onPress={() => router.push('/security' as any)}
                    />
                    <SettingItem
                        icon="card-outline"
                        iconColor={colors.chart4}
                        title="Abonnement"
                        subtitle="Beheer je PulseGuard plan"
                        onPress={() => router.push('/subscription' as any)}
                    />
                </View>

                {/* Support Section */}
                <SectionHeader title="Ondersteuning" />
                <View style={styles.section}>
                    <SettingItem
                        icon="help-circle-outline"
                        iconColor="#0ea5e9"
                        title="Hulp & FAQ"
                        onPress={() => Linking.openURL(process.env.EXPO_PUBLIC_SUPPORT_URL || 'https://pulseguard.pro/help')}
                    />
                    <SettingItem
                        icon="chatbubble-outline"
                        iconColor={colors.success}
                        title="Contact opnemen"
                        onPress={() => Linking.openURL('mailto:support@pulseguard.pro')}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        iconColor={colors.muted}
                        title="Privacybeleid"
                        onPress={() => Linking.openURL('https://pulseguard.pro/privacy')}
                    />
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appName}>PulseGuard</Text>
                    <Text style={styles.appVersion}>
                        Versie {Constants.expoConfig?.version || '3.0.0'}
                    </Text>
                </View>

                {/* Sign Out Button */}
                <Pressable
                    style={styles.signOutButton}
                    onPress={handleSignOut}
                    disabled={isSigningOut}
                >
                    {isSigningOut ? (
                        <ActivityIndicator color={colors.error} />
                    ) : (
                        <>
                            <Ionicons name="log-out-outline" size={20} color={colors.error} />
                            <Text style={styles.signOutText}>Uitloggen</Text>
                        </>
                    )}
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.foreground,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        gap: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarPlaceholder: {
        backgroundColor: colors.cardHover,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
    },
    profileEmail: {
        fontSize: 14,
        color: colors.muted,
        marginTop: 2,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginLeft: 4,
    },
    section: {
        backgroundColor: colors.card,
        borderRadius: 16,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    settingIcon: {
        width: 42,
        height: 42,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.foreground,
    },
    settingSubtitle: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 2,
    },
    appInfo: {
        alignItems: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.muted,
    },
    appVersion: {
        fontSize: 13,
        color: colors.mutedForeground,
        marginTop: 4,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.errorMuted,
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
        marginBottom: 16,
    },
    signOutText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.error,
    },
});

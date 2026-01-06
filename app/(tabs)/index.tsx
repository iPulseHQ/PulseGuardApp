import { useDashboardStats } from '@/hooks/useDashboard';
import { colors } from '@/lib/theme/colors';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useUser();
    const { data, isLoading, isRefetching, refetch, error } = useDashboardStats();

    const stats = data?.stats;
    const recentIncidents = data?.recentIncidents || [];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Goedemorgen';
        if (hour < 18) return 'Goedemiddag';
        return 'Goedenavond';
    };

    const StatCard = ({
        title,
        value,
        icon,
        color,
        onPress,
    }: {
        title: string;
        value: string | number;
        icon: keyof typeof Ionicons.glyphMap;
        color: string;
        onPress?: () => void;
    }) => (
        <Pressable
            style={[styles.statCard, { borderLeftColor: color }]}
            onPress={onPress}
        >
            <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.statContent}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
        </Pressable>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Dashboard laden...</Text>
            </View>
        );
    }

    // Show empty state if no data or error
    if (error || !stats) {
        return (
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>{getGreeting()},</Text>
                            <Text style={styles.userName}>{user?.firstName || 'Gebruiker'}</Text>
                        </View>
                    </View>

                    {/* Empty State */}
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="globe-outline" size={48} color={colors.muted} />
                        </View>
                        <Text style={styles.emptyTitle}>Geen data beschikbaar</Text>
                        <Text style={styles.emptySubtitle}>
                            Voeg je eerste domein toe om te beginnen met monitoren
                        </Text>
                        <Pressable
                            style={styles.addDomainButton}
                            onPress={() => router.push('/add-domain' as any)}
                        >
                            <Ionicons name="add" size={20} color="#ffffff" />
                            <Text style={styles.addDomainButtonText}>Domein toevoegen</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.userName}>{user?.firstName || 'Gebruiker'}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Pressable
                            style={styles.notificationButton}
                            onPress={() => router.push('/notifications' as any)}
                        >
                            <Ionicons name="notifications-outline" size={24} color={colors.foreground} />
                            {(stats?.activeIncidents || 0) > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>
                                        {stats?.activeIncidents || 0}
                                    </Text>
                                </View>
                            )}
                        </Pressable>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Totaal Domeinen"
                        value={stats?.totalDomains || 0}
                        icon="globe-outline"
                        color={colors.primary}
                        onPress={() => router.push('/(tabs)/domains')}
                    />
                    <StatCard
                        title="Online"
                        value={stats?.onlineDomains || 0}
                        icon="checkmark-circle-outline"
                        color={colors.success}
                    />
                    <StatCard
                        title="Offline"
                        value={stats?.offlineDomains || 0}
                        icon="close-circle-outline"
                        color={colors.error}
                        onPress={() => router.push('/(tabs)/incidents')}
                    />
                    <StatCard
                        title="Uptime"
                        value={`${stats?.averageUptime || 0}%`}
                        icon="trending-up-outline"
                        color={colors.chart4}
                    />
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Snelle acties</Text>
                    <View style={styles.actionsGrid}>
                        <Pressable
                            style={styles.actionCard}
                            onPress={() => router.push('/add-domain' as any)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}15` }]}>
                                <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
                            </View>
                            <Text style={styles.actionText}>Nieuw Domein</Text>
                        </Pressable>
                        <Pressable
                            style={styles.actionCard}
                            onPress={() => router.push('/notifications' as any)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: `${colors.warning}15` }]}>
                                <Ionicons name="notifications-outline" size={28} color={colors.warning} />
                            </View>
                            <Text style={styles.actionText}>Meldingen</Text>
                        </Pressable>
                    </View>
                    <View style={[styles.actionsGrid, { marginTop: 12 }]}>
                        <Pressable
                            style={styles.actionCard}
                            onPress={() => router.push('/(tabs)/incidents')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: `${colors.error}15` }]}>
                                <Ionicons name="warning-outline" size={28} color={colors.error} />
                            </View>
                            <Text style={styles.actionText}>Incidenten</Text>
                        </Pressable>
                        <Pressable
                            style={styles.actionCard}
                            onPress={() => router.push('/(tabs)/settings')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: `${colors.chart4}15` }]}>
                                <Ionicons name="settings-outline" size={28} color={colors.chart4} />
                            </View>
                            <Text style={styles.actionText}>Instellingen</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Recent Incidents */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recente incidenten</Text>
                        <Pressable onPress={() => router.push('/(tabs)/incidents')}>
                            <Text style={styles.seeAll}>Bekijk alles</Text>
                        </Pressable>
                    </View>

                    {recentIncidents.length === 0 ? (
                        <View style={styles.emptyIncidents}>
                            <Ionicons name="checkmark-done-circle" size={48} color={colors.success} />
                            <Text style={styles.emptyIncidentsTitle}>Geen actieve incidenten</Text>
                            <Text style={styles.emptyIncidentsSubtitle}>Al je domeinen zijn online</Text>
                        </View>
                    ) : (
                        <View style={styles.incidentsList}>
                            {recentIncidents.slice(0, 3).map((incident: any) => (
                                <Pressable
                                    key={incident.id}
                                    style={styles.incidentCard}
                                    onPress={() => router.push(`/incident/${incident.uuid || incident.id}` as any)}
                                >
                                    <View style={[
                                        styles.incidentStatus,
                                        { backgroundColor: incident.resolved ? colors.success : colors.error }
                                    ]} />
                                    <View style={styles.incidentContent}>
                                        <Text style={styles.incidentDomain}>{incident.domain?.name || 'Onbekend'}</Text>
                                        <Text style={styles.incidentMessage}>{incident.message}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                                </Pressable>
                            ))}
                        </View>
                    )}
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
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: colors.muted,
        fontSize: 16,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
        color: colors.muted,
        marginBottom: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.foreground,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    notificationBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.error,
    },
    notificationBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '700',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        flexGrow: 1,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.foreground,
    },
    statTitle: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 12,
    },
    seeAll: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '500',
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 12,
        color: colors.muted,
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.muted,
        textAlign: 'center',
        marginBottom: 24,
    },
    addDomainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    addDomainButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyIncidents: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyIncidentsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
        marginTop: 12,
    },
    emptyIncidentsSubtitle: {
        fontSize: 14,
        color: colors.muted,
        marginTop: 4,
    },
    incidentsList: {
        gap: 8,
    },
    incidentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    incidentStatus: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    incidentContent: {
        flex: 1,
    },
    incidentDomain: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    incidentMessage: {
        fontSize: 12,
        color: colors.muted,
        marginTop: 2,
    },
});

import { useDeleteDomain, useDomain, useToggleDomainPause } from '@/hooks/useDomains';
import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function DomainDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const { data: domain, isLoading, refetch } = useDomain(id);
    const { mutate: deleteDomain, isPending: isDeleting } = useDeleteDomain();
    const { mutate: togglePause, isPending: isToggling } = useToggleDomainPause();

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleDelete = () => {
        Alert.alert(
            'Verwijder Domein',
            'Weet je zeker dat je dit domein wilt verwijderen? Dit kan niet ongedaan worden gemaakt.',
            [
                { text: 'Annuleren', style: 'cancel' },
                {
                    text: 'Verwijderen',
                    style: 'destructive',
                    onPress: () => {
                        deleteDomain(id, {
                            onSuccess: () => router.back(),
                        });
                    },
                },
            ]
        );
    };

    const handleTogglePause = () => {
        if (!domain) return;
        const isPaused = domain.status === 'paused';
        togglePause({ uuid: id, isPaused: !isPaused });
    };

    if (isLoading || !domain) {
        return (
            <View style={[styles.container, styles.centerContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const status = domain.status === 'paused' ? 'paused' : (domain.monitor?.uptimeStatus || domain.status || 'unknown');

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'up': return colors.success;
            case 'down': return colors.error;
            case 'paused': return colors.muted;
            case 'pending': return colors.warning;
            default: return colors.muted;
        }
    };

    const getStatusText = (s: string) => {
        switch (s) {
            case 'up': return 'Online';
            case 'down': return 'Offline';
            case 'paused': return 'Gepauzeerd';
            case 'pending': return 'Controleren...';
            default: return 'Onbekend';
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>Domein Details</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(status)}15` }]}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                        <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                            {getStatusText(status)}
                        </Text>
                    </View>
                    <Text style={styles.domainName}>{domain.domainName || domain.name || domain.url}</Text>
                    <Text style={styles.domainUrl}>{domain.url}</Text>
                </View>

                {/* Quick Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Uptime</Text>
                        <Text style={styles.statValue}>{(Number(domain.uptime) || 0).toFixed(1)}%</Text>
                        <View style={styles.statIndicator}>
                            <View style={[styles.statProgress, { width: `${domain.uptime}%`, backgroundColor: colors.success }]} />
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Responstijd</Text>
                        <Text style={styles.statValue}>
                            {domain.responseTime ? `${Math.round(domain.responseTime)}ms` : '-'}
                        </Text>
                        <Text style={styles.statSubtext}>Laatste check</Text>
                    </View>
                </View>

                {/* Detailed Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Monitoring Info</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="refresh-outline" size={20} color={colors.muted} />
                            <Text style={styles.infoLabel}>Interval</Text>
                            <Text style={styles.infoValue}>Elke {domain.checkInterval / 60} minuten</Text>
                        </View>
                        <View style={[styles.infoRow, styles.lastRow]}>
                            <Ionicons name="time-outline" size={20} color={colors.muted} />
                            <Text style={styles.infoLabel}>Laatst gecontroleerd</Text>
                            <Text style={styles.infoValue}>
                                {domain.lastCheckedAt
                                    ? format(new Date(domain.lastCheckedAt), 'HH:mm:ss', { locale: nl })
                                    : 'Nooit'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* SSL Info */}
                {domain.sslExpiresAt && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>SSL Certificaat</Text>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
                                <Text style={styles.infoLabel}>Verloopt op</Text>
                                <Text style={styles.infoValue}>
                                    {format(new Date(domain.sslExpiresAt), 'd MMM yyyy', { locale: nl })}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Incidents Section */}
                {domain.incidents && domain.incidents.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recente Incidenten</Text>
                        {domain.incidents.map((incident, index) => (
                            <Pressable
                                key={incident.id}
                                style={[styles.incidentItem, index === domain.incidents.length - 1 && styles.lastRow]}
                                onPress={() => router.push(`/incident/${incident.uuid}` as any)}
                            >
                                <View style={styles.incidentInfo}>
                                    <Text style={styles.incidentMessage}>{incident.message}</Text>
                                    <Text style={styles.incidentDate}>
                                        {format(new Date(incident.createdAt), 'd MMM HH:mm', { locale: nl })}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionSection}>
                    <Pressable
                        style={[styles.actionButton, styles.pauseButton]}
                        onPress={handleTogglePause}
                        disabled={isToggling}
                    >
                        {isToggling ? (
                            <ActivityIndicator size="small" color={colors.foreground} />
                        ) : (
                            <>
                                <Ionicons
                                    name={domain.status === 'paused' ? "play-outline" : "pause-outline"}
                                    size={20}
                                    color={colors.foreground}
                                />
                                <Text style={styles.actionButtonText}>
                                    {domain.status === 'paused' ? 'Hervatten' : 'Pauzeren'}
                                </Text>
                            </>
                        )}
                    </Pressable>

                    <Pressable
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="trash-outline" size={20} color="#ffffff" />
                                <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>Verwijderen</Text>
                            </>
                        )}
                    </Pressable>
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
        backgroundColor: colors.background,
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
    heroSection: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    domainName: {
        fontSize: 26,
        fontWeight: '700',
        color: colors.foreground,
        textAlign: 'center',
    },
    domainUrl: {
        fontSize: 16,
        color: colors.muted,
        marginTop: 6,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statLabel: {
        fontSize: 13,
        color: colors.muted,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.foreground,
    },
    statIndicator: {
        height: 4,
        backgroundColor: `${colors.success}20`,
        borderRadius: 2,
        marginTop: 12,
        overflow: 'hidden',
    },
    statProgress: {
        height: '100%',
        borderRadius: 2,
    },
    statSubtext: {
        fontSize: 11,
        color: colors.muted,
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 12,
        marginLeft: 4,
    },
    infoCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    infoLabel: {
        flex: 1,
        fontSize: 15,
        color: colors.muted,
        marginLeft: 12,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.foreground,
    },
    incidentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    incidentInfo: {
        flex: 1,
    },
    incidentMessage: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.foreground,
    },
    incidentDate: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 4,
    },
    actionSection: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 54,
        borderRadius: 14,
        gap: 8,
    },
    pauseButton: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    deleteButton: {
        backgroundColor: colors.error,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
});

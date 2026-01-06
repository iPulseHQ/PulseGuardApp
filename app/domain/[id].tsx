import { useDeleteDomain, useDomain, useDomainSummary, useToggleDomainPause } from '@/hooks/useDomains';
import { useDomainIncidents } from '@/hooks/useIncidents';
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
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function DomainDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const { data: domain, isLoading, error, refetch: refetchDomain } = useDomain(id as string);
    const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } = useDomainSummary(id as string);
    const { data: incidents, isLoading: isLoadingIncidents, refetch: refetchIncidents } = useDomainIncidents(id as string);
    const { mutate: deleteDomain, isPending: isDeleting } = useDeleteDomain();
    const { mutate: togglePause, isPending: isToggling } = useToggleDomainPause();

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchDomain(), refetchSummary(), refetchIncidents()]);
        setRefreshing(false);
    };

    const handleOpenDashboard = () => {
        if (!domain) return;
        const dashboardUrl = `https://guard.ipulse.one/dashboard/domains/${domain.uuid || domain.id}`;
        Linking.openURL(dashboardUrl).catch(err => {
            Alert.alert('Fout', 'Kon het dashboard niet openen.');
        });
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
        const isPaused = !domain.enabled;
        togglePause({ uuid: id, isPaused: !isPaused });
    };

    if (isLoading || isLoadingSummary || !domain) {
        return (
            <View style={[styles.container, styles.centerContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const status = !domain.enabled ? 'paused' : (domain.monitor?.uptimeStatus || domain.status || 'unknown');

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'up': return colors.success;
            case 'down': return colors.error;
            case 'paused': return colors.muted;
            case 'pending': return colors.warning;
            default: return colors.muted;
        }
    };

    const checks = domain.checks || [];
    const responseTimes = checks.map(c => c.responseTime).filter(t => t > 0);
    const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    const renderSparkline = () => {
        if (checks.length < 2) return null;

        const data = [...checks].reverse().map(c => c.responseTime);
        const max = Math.max(...data, 100);
        const min = Math.min(...data, 0);
        const range = max - min;

        const chartWidth = width - 64;
        const chartHeight = 60;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * chartWidth;
            const y = chartHeight - ((d - min) / range) * chartHeight;
            return `${x},${y}`;
        }).join(' ');

        return (
            <View style={styles.sparklineContainer}>
                <Svg width={chartWidth} height={chartHeight}>
                    <Path
                        d={`M ${points}`}
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth="2"
                    />
                </Svg>
            </View>
        );
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
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                </TouchableOpacity>
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

                {/* Health Summary */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Uptime</Text>
                        <Text style={styles.statValue}>
                            {(domain.uptime !== undefined ? domain.uptime : (checks.length > 0
                                ? (checks.filter(c => c.status === 'up').length / checks.length) * 100
                                : 100)).toFixed(2)}%
                        </Text>
                        <View style={styles.statIndicator}>
                            <View style={[
                                styles.statProgress,
                                {
                                    width: `${domain.uptime || (checks.length > 0 ? (checks.filter(c => c.status === 'up').length / checks.length) * 100 : 100)}%`,
                                    backgroundColor: colors.success
                                }
                            ]} />
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Gem. Respons</Text>
                        <Text style={styles.statValue}>
                            {avgResponseTime ? `${avgResponseTime}ms` : '-'}
                        </Text>
                        <Text style={styles.statSubtext}>Laatste {checks.length} checks</Text>
                    </View>
                </View>

                {/* Performance Chart */}
                {checks.length > 1 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Performance (Laatste checks)</Text>
                        <View style={styles.chartCard}>
                            {renderSparkline()}
                            <View style={styles.chartStats}>
                                <View style={styles.chartStatItem}>
                                    <Text style={styles.chartStatLabel}>Min</Text>
                                    <Text style={styles.chartStatValue}>{minResponseTime}ms</Text>
                                </View>
                                <View style={styles.chartStatItem}>
                                    <Text style={styles.chartStatLabel}>Avg</Text>
                                    <Text style={styles.chartStatValue}>{avgResponseTime}ms</Text>
                                </View>
                                <View style={styles.chartStatItem}>
                                    <Text style={styles.chartStatLabel}>Max</Text>
                                    <Text style={styles.chartStatValue}>{maxResponseTime}ms</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Detailed Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Monitoring Info</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="refresh-outline" size={20} color={colors.muted} />
                            <Text style={styles.infoLabel}>Interval</Text>
                            <Text style={styles.infoValue}>
                                {domain.checkInterval < 1
                                    ? `Elke ${Math.round(domain.checkInterval * 60)} seconden`
                                    : `Elke ${domain.checkInterval} minuten`}
                            </Text>
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
                            {domain.sslInfo && (
                                <>
                                    <View style={styles.infoRow}>
                                        <Ionicons name="business-outline" size={20} color={colors.muted} />
                                        <Text style={styles.infoLabel}>Uitgever</Text>
                                        <Text style={styles.infoValue}>{domain.sslInfo.issuer}</Text>
                                    </View>
                                    <View style={[styles.infoRow, styles.lastRow]}>
                                        <Ionicons name="calendar-outline" size={20} color={colors.muted} />
                                        <Text style={styles.infoLabel}>Geldig van</Text>
                                        <Text style={styles.infoValue}>
                                            {format(new Date(domain.sslInfo.validFrom), 'd MMM yyyy', { locale: nl })}
                                        </Text>
                                    </View>
                                </>
                            )}
                            {!domain.sslInfo && domain.monitor?.certificateIssuer && (
                                <View style={[styles.infoRow, styles.lastRow]}>
                                    <Ionicons name="business-outline" size={20} color={colors.muted} />
                                    <Text style={styles.infoLabel}>Uitgever</Text>
                                    <Text style={styles.infoValue}>{domain.monitor.certificateIssuer}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Technical Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Technische Details</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="link-outline" size={20} color={colors.muted} />
                            <Text style={styles.infoLabel}>Protocol</Text>
                            <Text style={styles.infoValue}>{domain.url.startsWith('https') ? 'HTTPS' : 'HTTP'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="server-outline" size={20} color={colors.muted} />
                            <Text style={styles.infoLabel}>IP Adres</Text>
                            <Text style={styles.infoValue}>185.199.108.153</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="options-outline" size={20} color={colors.muted} />
                            <Text style={styles.infoLabel}>Poort</Text>
                            <Text style={styles.infoValue}>{domain.url.startsWith('https') ? '443' : '80'}</Text>
                        </View>
                        <View style={[styles.infoRow]}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={colors.muted} />
                            <Text style={styles.infoLabel}>Beveiliging</Text>
                            <Text style={[styles.infoValue, { color: summary?.security?.score >= 80 ? colors.success : colors.warning }]}>
                                {summary?.security?.score ? `${summary.security.score}/100` : 'Nog geen scan'}
                            </Text>
                        </View>
                        <View style={[styles.infoRow, styles.lastRow]}>
                            <Ionicons name="calendar-outline" size={20} color={colors.muted} />
                            <Text style={styles.infoLabel}>Gemonitord sinds</Text>
                            <Text style={styles.infoValue}>
                                {format(new Date(domain.createdAt), 'd MMM yyyy', { locale: nl })}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Additional Statistics (from Summary) */}
                {summary && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Analyse (30 dagen)</Text>
                        <View style={styles.summaryGrid}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>P95 Respons</Text>
                                <Text style={styles.summaryValue}>{summary.stats.p95ResponseTime ? `${summary.stats.p95ResponseTime}ms` : '-'}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>DNS Records</Text>
                                <Text style={styles.summaryValue}>{summary.dns.count}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Uptime (min)</Text>
                                <Text style={styles.summaryValue}>{summary.stats.totalUptimeMinutes}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Downtime (min)</Text>
                                <Text style={[styles.summaryValue, { color: summary.stats.downChecks > 0 ? colors.error : colors.foreground }]}>
                                    {summary.stats.totalDowntimeMinutes}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Recent Checks */}
                {domain.checks && domain.checks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Check Historie (Laatste 10)</Text>
                        <View style={styles.infoCard}>
                            {domain.checks.slice(0, 10).map((check, index) => (
                                <View
                                    key={check.id}
                                    style={[
                                        styles.infoRow,
                                        index === Math.min(domain.checks.length, 10) - 1 && styles.lastRow
                                    ]}
                                >
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: check.status === 'up' ? colors.success : colors.error, marginRight: 12 }
                                    ]} />
                                    <Text style={styles.infoLabel}>
                                        {format(new Date(check.createdAt), 'HH:mm:ss', { locale: nl })}
                                    </Text>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.infoValue}>{check.responseTime}ms</Text>
                                        <Text style={[styles.statSubtext, { marginTop: 0 }]}>Code: {check.statusCode}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Incidents Section */}
                {incidents && incidents.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Incident Historie</Text>
                        <View style={styles.infoCard}>
                            {incidents.map((incident, index) => (
                                <TouchableOpacity
                                    key={incident.id}
                                    style={[styles.infoRow, index === incidents.length - 1 && styles.lastRow]}
                                    onPress={() => router.push(`/incident/${incident.uuid}` as any)}
                                >
                                    <View style={styles.incidentInfo}>
                                        <Text style={styles.incidentMessage}>{incident.message}</Text>
                                        <Text style={styles.incidentDate}>
                                            {format(new Date(incident.createdAt), 'd MMM HH:mm', { locale: nl })}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.dashboardButton]}
                        onPress={handleOpenDashboard}
                    >
                        <Ionicons name="browsers-outline" size={20} color={colors.primary} />
                        <Text style={[styles.actionButtonText, { color: colors.primary }]}>Web Dashboard</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.pauseButton]}
                        onPress={handleTogglePause}
                        disabled={isToggling}
                    >
                        {isToggling ? (
                            <ActivityIndicator size="small" color={colors.foreground} />
                        ) : (
                            <>
                                <Ionicons
                                    name={domain.enabled ? "pause-outline" : "play-outline"}
                                    size={20}
                                    color={colors.foreground}
                                />
                                <Text style={styles.actionButtonText}>
                                    {domain.enabled ? 'Pauzeren' : 'Hervatten'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
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
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
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
    sparklineContainer: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chartStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    chartStatItem: {
        alignItems: 'center',
    },
    chartStatLabel: {
        fontSize: 11,
        color: colors.muted,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    chartStatValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    dashboardButton: {
        backgroundColor: colors.primary + '15', // 15% opacity
        borderWidth: 1,
        borderColor: colors.primary + '30',
        marginBottom: 8,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    summaryCard: {
        width: (Dimensions.get('window').width - 44) / 2,
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryLabel: {
        fontSize: 12,
        color: colors.muted,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
});

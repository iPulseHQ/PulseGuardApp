import { useAcknowledgeIncident, useIncident, useResolveIncident } from '@/hooks/useIncidents';
import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
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

export default function IncidentDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const { data: incident, isLoading, refetch } = useIncident(id);
    const { mutate: acknowledge, isPending: isAcknowledging } = useAcknowledgeIncident();
    const { mutate: resolve, isPending: isResolving } = useResolveIncident();

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    if (isLoading || !incident) {
        return (
            <View style={[styles.container, styles.centerContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const isResolved = !!incident.resolvedAt;
    const isAcknowledged = !!incident.acknowledgedAt;

    const getIncidentIcon = (type: string) => {
        switch (type) {
            case 'down': return 'cloud-offline-outline';
            case 'ssl_expiring': return 'shield-outline';
            case 'slow_response': return 'speedometer-outline';
            default: return 'warning-outline';
        }
    };

    const getIncidentColor = (type: string) => {
        switch (type) {
            case 'down': return colors.error;
            case 'ssl_expiring': return colors.warning;
            case 'slow_response': return '#eab308';
            default: return colors.error;
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Incident Details</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Status Card */}
                <View style={styles.heroCard}>
                    <View style={[styles.iconContainer, { backgroundColor: `${getIncidentColor(incident.type)}15` }]}>
                        <Ionicons name={getIncidentIcon(incident.type) as any} size={32} color={getIncidentColor(incident.type)} />
                    </View>
                    <Text style={styles.incidentTitle}>{incident.message}</Text>

                    <View style={styles.statusBadges}>
                        <View style={[styles.badge, isResolved ? styles.resolvedBadge : styles.activeBadge]}>
                            <Text style={[styles.badgeText, { color: isResolved ? colors.success : colors.error }]}>
                                {isResolved ? 'Opgelost' : 'Actief'}
                            </Text>
                        </View>
                        {isAcknowledged && !isResolved && (
                            <View style={[styles.badge, styles.acknowledgedBadge]}>
                                <Text style={[styles.badgeText, { color: colors.warning }]}>Gezien</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Domain Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Betrokken Domein</Text>
                    <Pressable
                        style={styles.domainCard}
                        onPress={() => router.push(`/domain/${incident.domain?.id}` as any)}
                    >
                        <View style={styles.domainContent}>
                            <Text style={styles.domainName}>{incident.domain?.name || 'Onbekend'}</Text>
                            <Text style={styles.domainUrl}>{incident.domain?.url}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                    </Pressable>
                </View>

                {/* Timeline Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tijdlijn</Text>
                    <View style={styles.timeline}>
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, { backgroundColor: colors.error }]} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Gedetecteerd</Text>
                                <Text style={styles.timelineDate}>
                                    {format(new Date(incident.createdAt), 'dd MMMM yyyy, HH:mm', { locale: nl })}
                                </Text>
                                <Text style={styles.timelineRelative}>
                                    {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true, locale: nl })}
                                </Text>
                            </View>
                        </View>

                        {isAcknowledged && (
                            <View style={styles.timelineItem}>
                                <View style={[styles.timelineDot, { backgroundColor: colors.warning }]} />
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineTitle}>Gezien door beheerder</Text>
                                    <Text style={styles.timelineDate}>
                                        {format(new Date(incident.acknowledgedAt!), 'dd MMMM yyyy, HH:mm', { locale: nl })}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {isResolved && (
                            <View style={styles.timelineItem}>
                                <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineTitle}>Opgelost</Text>
                                    <Text style={styles.timelineDate}>
                                        {format(new Date(incident.resolvedAt!), 'dd MMMM yyyy, HH:mm', { locale: nl })}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                {!isResolved && (
                    <View style={styles.actionSection}>
                        {!isAcknowledged && (
                            <Pressable
                                style={[styles.actionButton, styles.acknowledgeButton]}
                                onPress={() => acknowledge(id)}
                                disabled={isAcknowledging}
                            >
                                {isAcknowledging ? <ActivityIndicator size="small" color={colors.warning} /> : (
                                    <>
                                        <Ionicons name="eye-outline" size={20} color={colors.warning} />
                                        <Text style={[styles.actionButtonText, { color: colors.warning }]}>Ik kijk ernaar</Text>
                                    </>
                                )}
                            </Pressable>
                        )}
                        <Pressable
                            style={[styles.actionButton, styles.resolveButton]}
                            onPress={() => resolve(id)}
                            disabled={isResolving}
                        >
                            {isResolving ? <ActivityIndicator size="small" color="#ffffff" /> : (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                                    <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>Markeer als Opgelost</Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                )}
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
    heroCard: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: colors.card,
        marginHorizontal: 16,
        borderRadius: 24,
        marginTop: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    incidentTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: 16,
    },
    statusBadges: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    activeBadge: {
        backgroundColor: `${colors.error}15`,
    },
    resolvedBadge: {
        backgroundColor: `${colors.success}15`,
    },
    acknowledgedBadge: {
        backgroundColor: `${colors.warning}15`,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 12,
        marginLeft: 4,
    },
    domainCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    domainContent: {
        flex: 1,
    },
    domainName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
    domainUrl: {
        fontSize: 14,
        color: colors.muted,
        marginTop: 2,
    },
    timeline: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    timelineItem: {
        flexDirection: 'row',
        paddingBottom: 24,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4,
        zIndex: 1,
    },
    timelineContent: {
        marginLeft: 20,
        flex: 1,
    },
    timelineTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.foreground,
    },
    timelineDate: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 4,
    },
    timelineRelative: {
        fontSize: 12,
        color: colors.primary,
        marginTop: 2,
        fontWeight: '500',
    },
    actionSection: {
        paddingHorizontal: 16,
        gap: 12,
        marginTop: 32,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 16,
        gap: 8,
    },
    acknowledgeButton: {
        backgroundColor: `${colors.warning}15`,
        borderWidth: 1,
        borderColor: colors.warning,
    },
    resolveButton: {
        backgroundColor: colors.success,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

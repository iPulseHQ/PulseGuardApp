import { useReportsSummary } from '@/hooks/useReports';
import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReportsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { data: summary, isLoading } = useReportsSummary();

    const ReportCard = ({ title, icon, color }: { title: string, icon: keyof typeof Ionicons.glyphMap, color: string }) => (
        <Pressable style={styles.reportCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={styles.reportTitle}>{title}</Text>
            <Ionicons name="download-outline" size={20} color={colors.muted} />
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Rapporten</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {isLoading ? (
                    <ActivityIndicator color={colors.primary} />
                ) : (
                    <View style={styles.statsOverview}>
                        <View style={styles.overviewRow}>
                            <View style={styles.overviewItem}>
                                <Text style={styles.overviewLabel}>Avg. Uptime</Text>
                                <Text style={styles.overviewValue}>{summary?.averageUptime || 0}%</Text>
                            </View>
                            <View style={[styles.overviewItem, styles.borderLeft]}>
                                <Text style={styles.overviewLabel}>Incidenten</Text>
                                <Text style={styles.overviewValue}>{summary?.totalIncidents || 0}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Beschikbare Rapporten</Text>
                <View style={styles.reportsGrid}>
                    <ReportCard
                        title="Uptime Rapport"
                        icon="stats-chart-outline"
                        color={colors.success}
                    />
                    <ReportCard
                        title="Incidenten Overzicht"
                        icon="warning-outline"
                        color={colors.error}
                    />
                    <ReportCard
                        title="Performance Analyse"
                        icon="speedometer-outline"
                        color={colors.primary}
                    />
                    <ReportCard
                        title="SLA Rapportage"
                        icon="document-text-outline"
                        color={colors.chart4}
                    />
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.muted} />
                    <Text style={styles.infoText}>
                        Rapporten worden maandelijks automatisch gegenereerd en naar je e-mail verzonden als dit is ingeschakeld in instellingen.
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
    scrollContent: {
        padding: 16,
    },
    statsOverview: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },
    overviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    overviewItem: {
        flex: 1,
        alignItems: 'center',
    },
    borderLeft: {
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
    },
    overviewLabel: {
        fontSize: 13,
        color: colors.muted,
        marginBottom: 4,
    },
    overviewValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 16,
        marginLeft: 4,
    },
    reportsGrid: {
        gap: 12,
    },
    reportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    reportTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: `${colors.muted}10`,
        borderRadius: 12,
        padding: 16,
        marginTop: 32,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: colors.muted,
        lineHeight: 18,
    },
});

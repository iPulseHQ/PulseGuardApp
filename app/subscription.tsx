import {
    formatDate,
    formatPrice,
    getPlanDisplayName,
    getStatusColor,
    useInvoices,
    useOpenBillingPortal,
    useSubscription,
    useUsageStats,
} from '@/hooks/useSubscription';
import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SubscriptionScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Fetch data
    const { data: subscriptionData, isLoading: subLoading, refetch: refetchSub } = useSubscription();
    const { data: invoicesData, isLoading: invoicesLoading, refetch: refetchInvoices } = useInvoices(5);
    const { data: usageData, isLoading: usageLoading } = useUsageStats();

    // Mutations
    const openBillingPortal = useOpenBillingPortal();

    const isLoading = subLoading || invoicesLoading;
    const isRefreshing = false;

    const handleRefresh = async () => {
        await Promise.all([refetchSub(), refetchInvoices()]);
    };

    const handleOpenPortal = async () => {
        try {
            await openBillingPortal.mutateAsync();
        } catch (error: any) {
            Alert.alert(
                'Fout',
                error?.response?.data?.message || 'Kon factuurbeheer niet openen. Probeer het later opnieuw.'
            );
        }
    };

    const PlanFeature = ({ text, included = true }: { text: string; included?: boolean }) => (
        <View style={styles.featureRow}>
            <Ionicons
                name={included ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={included ? colors.success : colors.muted}
            />
            <Text style={[styles.featureText, !included && styles.featureTextDisabled]}>
                {text}
            </Text>
        </View>
    );

    const UsageBar = ({ current, limit, label }: { current: number; limit: number; label: string }) => {
        const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
        const isUnlimited = limit === -1 || limit === Infinity;

        return (
            <View style={styles.usageItem}>
                <View style={styles.usageHeader}>
                    <Text style={styles.usageLabel}>{label}</Text>
                    <Text style={styles.usageValue}>
                        {current} / {isUnlimited ? '∞' : limit}
                    </Text>
                </View>
                <View style={styles.usageBarBg}>
                    <View
                        style={[
                            styles.usageBarFill,
                            { width: isUnlimited ? '10%' : `${percentage}%` },
                            percentage > 80 && !isUnlimited && styles.usageBarWarning,
                            percentage >= 100 && !isUnlimited && styles.usageBarDanger,
                        ]}
                    />
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Abonnement</Text>
                    <View style={{ width: 44 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    const plan = subscriptionData?.plan;
    const subscription = subscriptionData?.subscription;
    const planId = subscriptionData?.user?.currentPlanId || subscriptionData?.organization?.planId || 'free';
    const paymentStatus = subscriptionData?.user?.paymentStatus || subscriptionData?.organization?.paymentStatus || 'active';
    const planRenewsAt = subscriptionData?.user?.planRenewsAt || subscriptionData?.organization?.planRenewsAt;
    const limitations = plan?.limitations;

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Abonnement</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Current Plan Card */}
                <View style={styles.currentPlanCard}>
                    <View style={styles.planHeader}>
                        <View>
                            <Text style={styles.planLabel}>Huidig Plan</Text>
                            <Text style={styles.planName}>
                                PulseGuard {getPlanDisplayName(planId)}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(paymentStatus) + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(paymentStatus) }]} />
                            <Text style={[styles.statusText, { color: getStatusColor(paymentStatus) }]}>
                                {paymentStatus === 'active' ? 'Actief' : paymentStatus}
                            </Text>
                        </View>
                    </View>

                    {plan && (
                        <Text style={styles.planPrice}>
                            {plan.price === 0 ? 'Gratis' : formatPrice(plan.price)}
                            {plan.price > 0 && (
                                <Text style={styles.planPeriod}> / {plan.interval === 'month' ? 'maand' : 'jaar'}</Text>
                            )}
                        </Text>
                    )}

                    {planRenewsAt && (
                        <Text style={styles.renewText}>
                            Verlengt op {formatDate(planRenewsAt)}
                        </Text>
                    )}

                    <View style={styles.divider} />

                    {/* Plan Features */}
                    <View style={styles.features}>
                        <PlanFeature
                            text={limitations?.maxDomains === -1 ? 'Onbeperkt aantal domeinen' : `${limitations?.maxDomains || 1} domein(en)`}
                        />
                        <PlanFeature
                            text={`${limitations?.checkInterval || 5} minuten controle interval`}
                        />
                        <PlanFeature
                            text="SMS meldingen"
                            included={limitations?.smsNotifications || false}
                        />
                        <PlanFeature
                            text="Telefonische meldingen"
                            included={limitations?.phoneNotifications || false}
                        />
                        <PlanFeature
                            text="API toegang"
                            included={limitations?.apiAccess || false}
                        />
                        <PlanFeature
                            text="Priority support"
                            included={limitations?.prioritySupport || false}
                        />
                    </View>
                </View>

                {/* Usage Stats */}
                {usageData && (
                    <View style={styles.usageCard}>
                        <Text style={styles.sectionTitle}>Gebruik</Text>
                        <UsageBar
                            current={usageData.domains?.current || 0}
                            limit={usageData.domains?.limit || 1}
                            label="Domeinen"
                        />
                        <UsageBar
                            current={usageData.teamMembers?.current || 0}
                            limit={usageData.teamMembers?.limit || 1}
                            label="Teamleden"
                        />
                    </View>
                )}

                {/* Manage Button */}
                <Pressable
                    style={[styles.manageButton, openBillingPortal.isPending && styles.buttonDisabled]}
                    onPress={handleOpenPortal}
                    disabled={openBillingPortal.isPending}
                >
                    {openBillingPortal.isPending ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <>
                            <Text style={styles.manageButtonText}>Beheer via Stripe</Text>
                            <Ionicons name="open-outline" size={18} color="#ffffff" />
                        </>
                    )}
                </Pressable>

                {/* Invoice History */}
                <Text style={styles.billingHistoryTitle}>Factuurgeschiedenis</Text>
                <View style={styles.historyCard}>
                    {invoicesData?.data && invoicesData.data.length > 0 ? (
                        invoicesData.data.map((invoice, index) => (
                            <View
                                key={invoice.id}
                                style={[
                                    styles.historyItem,
                                    index === invoicesData.data.length - 1 && styles.lastItem,
                                ]}
                            >
                                <View>
                                    <Text style={styles.historyDate}>
                                        {new Date(invoice.created * 1000).toLocaleDateString('nl-NL', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </Text>
                                    <Text style={styles.historyId}>
                                        Factuur #{invoice.number || invoice.id.slice(-8)}
                                    </Text>
                                </View>
                                <View style={styles.historyRight}>
                                    <Text style={styles.historyAmount}>
                                        {formatPrice(invoice.amount_paid / 100, invoice.currency)}
                                    </Text>
                                    <View style={[
                                        styles.invoiceStatus,
                                        { backgroundColor: invoice.status === 'paid' ? colors.success + '20' : colors.warning + '20' }
                                    ]}>
                                        <Text style={[
                                            styles.invoiceStatusText,
                                            { color: invoice.status === 'paid' ? colors.success : colors.warning }
                                        ]}>
                                            {invoice.status === 'paid' ? 'Betaald' : invoice.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyHistory}>
                            <Ionicons name="receipt-outline" size={32} color={colors.muted} />
                            <Text style={styles.emptyHistoryText}>Nog geen facturen</Text>
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
    currentPlanCard: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.primary,
        marginBottom: 20,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    planLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    planName: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.foreground,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    planPrice: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.foreground,
        marginTop: 8,
    },
    planPeriod: {
        fontSize: 16,
        fontWeight: '400',
        color: colors.muted,
    },
    renewText: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 20,
    },
    features: {
        gap: 12,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: 15,
        color: colors.foreground,
    },
    featureTextDisabled: {
        color: colors.muted,
        textDecorationLine: 'line-through',
    },
    usageCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 20,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
    usageItem: {
        gap: 8,
    },
    usageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    usageLabel: {
        fontSize: 14,
        color: colors.foreground,
    },
    usageValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    usageBarBg: {
        height: 8,
        backgroundColor: colors.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    usageBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 4,
    },
    usageBarWarning: {
        backgroundColor: colors.warning,
    },
    usageBarDanger: {
        backgroundColor: colors.error,
    },
    manageButton: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 32,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    manageButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    billingHistoryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 16,
        marginLeft: 4,
    },
    historyCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    lastItem: {
        borderBottomWidth: 0,
    },
    historyDate: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.foreground,
    },
    historyId: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 2,
    },
    historyRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    historyAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
    invoiceStatus: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    invoiceStatusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    emptyHistory: {
        padding: 32,
        alignItems: 'center',
        gap: 8,
    },
    emptyHistoryText: {
        fontSize: 14,
        color: colors.muted,
    },
});

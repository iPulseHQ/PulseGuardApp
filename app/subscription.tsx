import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SubscriptionScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const PlanFeature = ({ text }: { text: string }) => (
        <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Abonnement</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.currentPlanCard}>
                    <Text style={styles.planLabel}>Huidig Plan</Text>
                    <Text style={styles.planName}>PulseGuard Pro</Text>
                    <Text style={styles.planPrice}>€19.99<Text style={styles.planPeriod}> / maand</Text></Text>

                    <View style={styles.divider} />

                    <View style={styles.features}>
                        <PlanFeature text="Onbeperkt aantal domeinen" />
                        <PlanFeature text="1 minuut controle interval" />
                        <PlanFeature text="SMS & Bel meldingen" />
                        <PlanFeature text="Uitgebreide rapportages" />
                    </View>
                </View>

                <Pressable style={styles.manageButton}>
                    <Text style={styles.manageButtonText}>Beheer via Stripe</Text>
                    <Ionicons name="open-outline" size={18} color="#ffffff" />
                </Pressable>

                <Text style={styles.billingHistoryTitle}>Factuurgeschiedenis</Text>
                <View style={styles.historyCard}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={[styles.historyItem, i === 3 && styles.lastItem]}>
                            <View>
                                <Text style={styles.historyDate}>1 Jan 2026</Text>
                                <Text style={styles.historyId}>Factuur #PG-2026-00{i}</Text>
                            </View>
                            <Text style={styles.historyAmount}>€19.99</Text>
                        </View>
                    ))}
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
    currentPlanCard: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.primary,
        marginBottom: 20,
    },
    planLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    planName: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.foreground,
        marginBottom: 8,
    },
    planPrice: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.foreground,
    },
    planPeriod: {
        fontSize: 16,
        fontWeight: '400',
        color: colors.muted,
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
    historyAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground,
    },
});

import { useDomains } from '@/hooks/useDomains';
import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Domain {
    id: string;
    uuid: string;
    name?: string;
    domainName?: string;
    url: string;
    status: 'up' | 'down' | 'pending' | 'paused' | 'unknown';
    monitor?: {
        uptimeStatus: 'up' | 'down' | 'pending' | 'paused' | 'unknown';
    };
    lastCheckedAt: string;
    responseTime: number | null;
    uptime: number;
    sslExpiresAt?: string;
}

export default function DomainsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: domains = [], isLoading, isRefetching, refetch } = useDomains();

    const filteredDomains = domains.filter((domain: Domain) => {
        const name = domain.domainName || domain.name || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            domain.url.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const getStatusColor = (status: Domain['status'] | string | undefined) => {
        switch (status) {
            case 'up':
                return colors.success;
            case 'down':
                return colors.error;
            case 'pending':
                return colors.warning;
            case 'paused':
                return colors.muted;
            default:
                return colors.muted;
        }
    };

    const getStatusText = (status: Domain['status'] | string | undefined) => {
        switch (status) {
            case 'up':
                return 'Online';
            case 'down':
                return 'Offline';
            case 'pending':
                return 'Controleren...';
            case 'paused':
                return 'Gepauzeerd';
            default:
                return 'Onbekend';
        }
    };

    const formatResponseTime = (ms: any) => {
        const value = Number(ms);
        if (isNaN(value) || ms === null || ms === undefined) return '-';
        if (value < 1000) return `${Math.round(value)}ms`;
        return `${(value / 1000).toFixed(1)}s`;
    };

    const renderDomainItem = ({ item }: { item: Domain }) => {
        const name = item.domainName || item.name || item.url || 'Onbekend';
        const status = item.status || item.monitor?.uptimeStatus || 'unknown';
        const uuid = item.uuid || item.id;

        const uptime = typeof item.uptime === 'number' ? item.uptime :
            (typeof item.uptime === 'string' ? parseFloat(item.uptime) : 0);
        const safeUptime = isNaN(uptime) ? 0 : uptime;

        return (
            <Pressable
                style={styles.domainCard}
                onPress={() => router.push(`/domain/${uuid}` as any)}
            >
                <View style={styles.domainHeader}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                    <View style={styles.domainInfo}>
                        <Text style={styles.domainName} numberOfLines={1}>
                            {name}
                        </Text>
                        <Text style={styles.domainUrl} numberOfLines={1}>
                            {item.url}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </View>

                <View style={styles.domainStats}>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>Status</Text>
                        <Text style={[styles.statValue, { color: getStatusColor(status) }]}>
                            {getStatusText(status)}
                        </Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>Response</Text>
                        <Text style={styles.statValue}>{formatResponseTime(item.responseTime)}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>Uptime</Text>
                        <Text style={styles.statValue}>{safeUptime.toFixed(1)}%</Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Domeinen laden...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Text style={styles.title}>Domeinen</Text>
                <Pressable
                    style={styles.addButton}
                    onPress={() => router.push('/add-domain' as any)}
                >
                    <Ionicons name="add" size={24} color="#ffffff" />
                </Pressable>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={colors.muted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Zoek domeinen..."
                    placeholderTextColor={colors.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={colors.muted} />
                    </Pressable>
                )}
            </View>

            {/* Domains List */}
            <FlatList
                data={filteredDomains}
                renderItem={renderDomainItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: insets.bottom + 100 },
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
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="globe-outline" size={64} color={colors.muted} />
                        <Text style={styles.emptyTitle}>
                            {searchQuery ? 'Geen resultaten' : 'Geen domeinen'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery
                                ? 'Probeer een andere zoekopdracht'
                                : 'Voeg je eerste domein toe om te beginnen'}
                        </Text>
                        {!searchQuery && (
                            <Pressable
                                style={styles.emptyButton}
                                onPress={() => router.push('/add-domain' as any)}
                            >
                                <Ionicons name="add" size={20} color="#ffffff" />
                                <Text style={styles.emptyButtonText}>Domein toevoegen</Text>
                            </Pressable>
                        )}
                    </View>
                }
            />
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.foreground,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        marginHorizontal: 16,
        marginBottom: 16,
        paddingHorizontal: 14,
        borderRadius: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.foreground,
    },
    listContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    domainCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    domainHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    domainInfo: {
        flex: 1,
    },
    domainName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
    domainUrl: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 2,
    },
    domainStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    stat: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: colors.muted,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 64,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.muted,
        textAlign: 'center',
        marginTop: 8,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        marginTop: 24,
    },
    emptyButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});

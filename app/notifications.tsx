import { useNotificationHistory } from '@/hooks/useNotifications';
import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NotificationItem {
    id: string;
    title?: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    isRead: boolean;
    createdAt: string;
    metadata?: any;
}

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const { data: notificationsData, isLoading, refetch } = useNotificationHistory();

    // Handle different backend response structures
    const notifications: NotificationItem[] = notificationsData?.notifications ||
        (Array.isArray(notificationsData) ? notificationsData : []);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'error': return 'alert-circle';
            case 'warning': return 'warning';
            case 'success': return 'checkmark-circle';
            default: return 'notifications';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'error': return colors.error;
            case 'warning': return colors.warning;
            case 'success': return colors.success;
            default: return colors.primary;
        }
    };

    const renderItem = ({ item }: { item: NotificationItem }) => (
        <Pressable
            style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
            onPress={() => {
                // If it's an incident notification, navigate to incident
                if (item.metadata?.incidentId || item.metadata?.uuid) {
                    router.push(`/incident/${item.metadata.incidentId || item.metadata.uuid}` as any);
                } else if (item.metadata?.domainId) {
                    router.push(`/domain/${item.metadata.domainId}` as any);
                }
            }}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${getColor(item.type)}15` }]}>
                <Ionicons name={getIcon(item.type) as any} size={24} color={getColor(item.type)} />
            </View>
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title || (item.type === 'error' ? 'Systeem Fout' : 'Melding')}
                    </Text>
                    <Text style={styles.time}>
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: nl })}
                    </Text>
                </View>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Meldingen</Text>
                <View style={[styles.backButton, { backgroundColor: 'transparent' }]}>
                    {notifications.length > 0 && <Ionicons name="checkmark-done" size={24} color={colors.primary} />}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="notifications-off-outline" size={48} color={colors.muted} />
                            </View>
                            <Text style={styles.emptyTitle}>Geen meldingen</Text>
                            <Text style={styles.emptySubtitle}>Je bent helemaal bij!</Text>
                        </View>
                    }
                />
            )}
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    unreadCard: {
        borderColor: `${colors.primary}40`,
        backgroundColor: `${colors.primary}05`,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.foreground,
        flex: 1,
        marginRight: 8,
    },
    time: {
        fontSize: 12,
        color: colors.muted,
    },
    message: {
        fontSize: 14,
        color: colors.muted,
        lineHeight: 18,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
        marginLeft: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: colors.muted,
    },
});

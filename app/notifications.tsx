import { useMarkAllNotificationsAsRead, useMarkNotificationAsRead, useNotificationHistory } from '@/hooks/useNotifications';
import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
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
    const { mutate: markAsRead } = useMarkNotificationAsRead();
    const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllNotificationsAsRead();

    // Handle different backend response structures
    const notifications: NotificationItem[] = notificationsData?.data ||
        notificationsData?.notifications ||
        (Array.isArray(notificationsData) ? notificationsData : []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

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

    const handleNotificationPress = (item: NotificationItem) => {
        if (!item.isRead) {
            markAsRead(item.id);
        }

        // If it's an incident notification, navigate to incident
        if (item.metadata?.incidentId || item.metadata?.uuid) {
            router.push(`/incident/${item.metadata.incidentId || item.metadata.uuid}` as any);
        } else if (item.metadata?.domainId) {
            router.push(`/domain/${item.metadata.domainId}` as any);
        }
    };

    const renderItem = ({ item }: { item: NotificationItem }) => (
        <TouchableOpacity
            style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${getColor(item.type)}10` }]}>
                    <Ionicons name={getIcon(item.type) as any} size={20} color={getColor(item.type)} />
                </View>
                <View style={styles.headerTextContainer}>
                    <Text style={[styles.title, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
                        {item.title || (item.type === 'error' ? 'Systeem Fout' : 'Melding')}
                    </Text>
                    <Text style={styles.time}>
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: nl })}
                    </Text>
                </View>
                {!item.isRead && (
                    <View style={styles.unreadIndicator} />
                )}
            </View>
            <Text style={[styles.message, !item.isRead && styles.unreadMessage]} numberOfLines={3}>
                {item.message}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meldingen</Text>
                <View style={styles.headerRight}>
                    {unreadCount > 0 && (
                        <TouchableOpacity
                            onPress={() => markAllAsRead()}
                            disabled={isMarkingAll}
                            style={styles.actionButton}
                        >
                            {isMarkingAll ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Ionicons name="checkmark-done-outline" size={24} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    )}
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
                                <Ionicons name="notifications-off-outline" size={32} color={colors.muted} />
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
        backgroundColor: colors.background, // Should be white or very light gray
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.foreground,
    },
    headerRight: {
        width: 40,
        alignItems: 'flex-end',
    },
    actionButton: {
        padding: 4,
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
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    unreadCard: {
        borderColor: colors.border,
        backgroundColor: colors.card, // Keep white background but maybe add a blue accent bar?
        // Or shadcn style: simple dot.
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.muted,
    },
    unreadTitle: {
        color: colors.foreground,
        fontWeight: '600',
    },
    time: {
        fontSize: 12,
        color: colors.muted,
        marginTop: 2,
    },
    unreadIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
    },
    message: {
        fontSize: 14,
        color: colors.muted,
        lineHeight: 20,
    },
    unreadMessage: {
        color: colors.foreground,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        padding: 24,
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
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
        maxWidth: 250,
    },
});

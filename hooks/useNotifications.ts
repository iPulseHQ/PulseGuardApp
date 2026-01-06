import { useOrganizationContext } from '@/context/OrganizationContext';
import { API_ENDPOINTS, useApiClient } from '@/lib/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

interface NotificationSettings {
    pushEnabled: boolean;
    emailEnabled: boolean;
    incidentAlerts: boolean;
    uptimeReports: boolean;
    sslAlerts: boolean;
}

/**
 * Hook to manage push notification registration and settings
 */
export function usePushNotifications() {
    const api = useApiClient();
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const notificationListener = useRef<Notifications.Subscription>(null);
    const responseListener = useRef<Notifications.Subscription>(null);

    // Check if we're in Expo Go (notifications won't work)
    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    const notificationsSupported = !isExpoGo && Device.isDevice;

    /**
     * Register for push notifications
     */
    const registerForPushNotifications = async (): Promise<string | null> => {
        if (!notificationsSupported) {
            console.log('[Notifications] Not supported in current environment');
            return null;
        }

        try {
            // Set up notification channels on Android
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'PulseGuard Alerts',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#3b82f6',
                    sound: 'default',
                });

                await Notifications.setNotificationChannelAsync('critical', {
                    name: 'Critical Alerts',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250, 250, 250],
                    lightColor: '#ef4444',
                });
            }

            // Request permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('[Notifications] Permission not granted');
                return null;
            }

            // Get the push token
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
            if (!projectId) {
                throw new Error('Project ID not found');
            }

            const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('[Notifications] Token:', token);

            // Register token with backend
            await registerTokenWithBackend(token);

            return token;
        } catch (error) {
            console.error('[Notifications] Registration error:', error);
            return null;
        }
    };

    /**
     * Send push token to backend
     */
    const registerTokenWithBackend = async (token: string) => {
        try {
            await api.post(API_ENDPOINTS.EXPO_PUSH_TOKEN, {
                token,
                device_name: Device.deviceName || 'PulseGuard Mobile',
                device_type: Platform.OS,
                app_version: Constants.expoConfig?.version || '3.0.0',
            });
            console.log('[Notifications] Token registered with backend');
        } catch (error) {
            console.error('[Notifications] Failed to register token:', error);
        }
    };

    useEffect(() => {
        if (!notificationsSupported) return;

        // Register on mount
        registerForPushNotifications().then(setExpoPushToken);

        // Listener for incoming notifications
        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log('[Notifications] Received:', notification);
                setNotification(notification);
            }
        );

        // Listener for notification taps
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                console.log('[Notifications] Response:', response);
                // Handle navigation based on notification data here
            }
        );

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [notificationsSupported]);

    return {
        expoPushToken,
        notification,
        notificationsSupported,
        isExpoGo,
        registerForPushNotifications,
    };
}

/**
 * Hook to fetch notification settings
 */
export function useNotificationSettings() {
    const api = useApiClient();

    return useQuery<NotificationSettings>({
        queryKey: ['notifications', 'settings'],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.NOTIFICATION_SETTINGS);
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to update notification settings
 */
export function useUpdateNotificationSettings() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settings: Partial<NotificationSettings>) => {
            const response = await api.patch(API_ENDPOINTS.NOTIFICATION_SETTINGS, settings);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'settings'] });
        },
    });
}

/**
 * Hook to fetch notification history
 */
export function useNotificationHistory(limit: number = 50) {
    const api = useApiClient();
    const { activeOrganizationId } = useOrganizationContext();

    return useQuery({
        queryKey: ['notifications', 'history', limit, activeOrganizationId],
        queryFn: async () => {
            const params: any = { limit };
            if (activeOrganizationId) {
                params.organization = activeOrganizationId;
            }
            const response = await api.get(API_ENDPOINTS.NOTIFICATIONS, { params });
            return response.data;
        },
        staleTime: 1000 * 60, // 1 minute
    });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkNotificationAsRead() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.put(API_ENDPOINTS.NOTIFICATION_READ(id));
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'history'] });
        },
    });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await api.put(API_ENDPOINTS.NOTIFICATIONS_READ_ALL);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'history'] });
        },
    });
}

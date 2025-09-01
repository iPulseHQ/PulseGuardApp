import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NotificationToastProps {
  onPress?: (data?: any) => void;
  autoHideDelay?: number;
}

export default function NotificationToast({ onPress, autoHideDelay = 5000 }: NotificationToastProps) {
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    // Listen for notifications
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Toast showing notification:', notification);
      setNotification(notification);
      setIsVisible(true);

      // Slide down animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Auto hide after delay
      setTimeout(() => {
        hideToast();
      }, autoHideDelay);
    });

    return () => {
      subscription.remove();
    };
  }, [autoHideDelay, slideAnim]);

  const hideToast = () => {
    Animated.spring(slideAnim, {
      toValue: -100,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start(() => {
      setIsVisible(false);
      setNotification(null);
    });
  };

  const handlePress = () => {
    if (onPress && notification?.request.content.data) {
      onPress(notification.request.content.data);
    }
    hideToast();
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'domain_down':
        return 'alert-circle';
      case 'domain_up':
        return 'checkmark-circle';
      case 'high_ping':
        return 'speedometer';
      case 'ssl_expiration':
        return 'shield-checkmark';
      case 'device_offline':
        return 'hardware-chip';
      case 'device_online':
        return 'hardware-chip';
      case 'incident_created':
        return 'warning';
      case 'incident_resolved':
        return 'checkmark-circle';
      case 'critical_system':
        return 'flame';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type?: string) => {
    switch (type) {
      case 'domain_down':
      case 'device_offline':
      case 'incident_created':
      case 'critical_system':
        return '#ef4444'; // Red for critical issues
      case 'domain_up':
      case 'device_online':
      case 'incident_resolved':
        return '#22c55e'; // Green for resolved issues
      case 'high_ping':
      case 'ssl_expiration':
        return '#f59e0b'; // Yellow/Orange for warnings
      default:
        return '#3b82f6'; // Blue for default
    }
  };

  if (!isVisible || !notification) {
    return null;
  }

  const data = notification.request.content.data;
  const iconName = getNotificationIcon(data?.type);
  const iconColor = getNotificationColor(data?.type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity style={styles.toast} onPress={handlePress} activeOpacity={0.9}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={iconName as any} size={24} color={iconColor} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.request.content.title || 'PulseGuard Alert'}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {notification.request.content.body || 'Nieuwe notificatie ontvangen'}
            </Text>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  body: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
});

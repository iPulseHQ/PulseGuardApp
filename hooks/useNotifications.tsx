import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  registerForPushNotifications: () => Promise<string | null>;
  sendTokenToWebView: (webViewRef: any, token: string) => void;
  isExpoGo: boolean;
  notificationsSupported: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Check if we're running in Expo Go
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  
  // Check if notifications are supported (not in Expo Go for SDK 53+)
  const notificationsSupported = !isExpoGo && Device.isDevice;

  const registerForPushNotifications = async (): Promise<string | null> => {
    if (!notificationsSupported) {
      console.log('Push notifications not supported in current environment (Expo Go SDK 53+)');
      return null;
    }

    let token = null;

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'PulseGuard Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3b82f6',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          enableLights: true,
        });

        // Create critical alerts channel for high priority notifications
        await Notifications.setNotificationChannelAsync('critical', {
          name: 'Critical Domain Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250, 250, 250],
          lightColor: '#ef4444',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          enableLights: true,
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return null;
      }
      
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      
      console.log('Expo Push Token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
      if (error instanceof Error && error.message?.includes('removed from Expo Go')) {
        console.log('Push notifications require a development build (not Expo Go)');
      }
      token = null;
    }

    return token;
  };

  const sendTokenToWebView = (webViewRef: any, token: string): void => {
    if (!webViewRef?.current) {
      console.error('WebView ref not available');
      return;
    }

    try {
      const deviceInfo = {
        token: token,
        device_name: Device.deviceName || 'Unknown Device',
        device_type: Platform.OS,
        app_version: Constants.expoConfig?.version || '1.0.0',
        is_expo_go: isExpoGo,
        notifications_supported: notificationsSupported
      };

      // Send the token to the WebView via postMessage
      const script = `
        window.postMessage({
          type: 'expo-push-token',
          data: ${JSON.stringify(deviceInfo)}
        }, '*');
        true; // note: this is required, or you'll sometimes get silent failures
      `;

      webViewRef.current.injectJavaScript(script);
      console.log('Device info sent to WebView for registration');
    } catch (error) {
      console.error('Error sending token to WebView:', error);
    }
  };

  useEffect(() => {
    if (!notificationsSupported) {
      console.log('⚠️  Running in Expo Go - Push notifications not available');
      console.log('📱 For push notifications, create a development build with: npx expo run:android or npx expo run:ios');
      return;
    }

    // Register for push notifications on app start
    registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token);
        console.log('Push token ready:', token);
      } else {
        console.log('Failed to register for push notifications');
      }
    });

    // Listener for when a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      setNotification(notification);
    });

    // Listener for when a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      // Handle notification tap - you can navigate to specific screens here
      const data = response.notification.request.content.data;
      if (data?.domain_id || data?.domain_uuid) {
        // You could implement navigation to domain details here
        console.log('Navigate to domain:', data.domain_id || data.domain_uuid);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [notificationsSupported]);

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    registerForPushNotifications,
    sendTokenToWebView,
    isExpoGo,
    notificationsSupported,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 
import axios from 'axios';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  registerForPushNotifications: () => Promise<string | null>;
  sendTokenToServer: (token: string) => Promise<void>;
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
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const registerForPushNotifications = async (): Promise<string | null> => {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'PulseGuard Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
        sound: true,
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
        sound: true,
        enableVibrate: true,
        showBadge: true,
        enableLights: true,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        alert('Push notification permissions are required for domain monitoring alerts!');
        return null;
      }
      
      try {
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
        token = null;
      }
    } else {
      alert('Must use physical device for Push Notifications');
    }

    return token;
  };

  const sendTokenToServer = async (token: string): Promise<void> => {
    try {
      // Send the token to your Laravel API
      await axios.post('https://app.pulseguard.nl/api/expo-push-token', {
        token: token,
        device_name: Device.deviceName || 'Unknown Device',
        device_type: Platform.OS,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000,
      });
      
      console.log('Token successfully sent to server');
    } catch (error) {
      console.error('Error sending token to server:', error);
      // Don't throw error - app should continue working even if token registration fails
    }
  };

  useEffect(() => {
    // Register for push notifications on app start
    registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token);
        sendTokenToServer(token);
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
  }, []);

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    registerForPushNotifications,
    sendTokenToServer,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 
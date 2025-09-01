import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import NotificationToast from './NotificationToast';

const PULSEGUARD_URL = 'https://guard.ipulse.one';

export default function PulseGuardWebView() {
  const webViewRef = useRef<WebView>(null);
  const { getToken, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // Handle incoming notifications
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can add custom handling here if needed
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      // Handle notification tap
      const data = response.notification.request.content.data;
      if (data.url) {
        // Navigate to specific URL in WebView
        webViewRef.current?.injectJavaScript(`
          window.location.href = '${data.url}';
        `);
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // Register device for push notifications
  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Push notificaties', 'Push notificaties zijn nodig voor PulseGuard alerts');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 'pulseguard-app',
      });

      console.log('Expo push token:', token.data);
      setExpoPushToken(token.data);

      // Register token with backend
      await registerPushToken(token.data);

    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  // Register push token with Laravel backend
  const registerPushToken = async (token: string) => {
    try {
      const clerkToken = await getToken();

      if (!clerkToken || !user) {
        console.log('User not authenticated, skipping push token registration');
        return;
      }

      const deviceName = `${Device.deviceName || 'Unknown Device'} (${Device.osName} ${Device.osVersion})`;

      const response = await fetch(`${PULSEGUARD_URL}/api/expo-push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clerkToken}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          device_name: deviceName,
          device_type: Device.osName?.toLowerCase() || 'unknown',
          app_version: Constants.expoConfig?.version || '1.0.0',
        }),
      });

      if (response.ok) {
        console.log('Push token registered successfully');
      } else {
        console.error('Failed to register push token:', response.status);
      }
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  };

  // WebView navigation state change handler
  const handleNavigationStateChange = (navState: any) => {
    console.log('Navigation state changed:', navState.url);
  };

  // WebView load start handler
  const handleLoadStart = () => {
    setIsLoading(true);
  };

  // WebView load end handler
  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  // WebView error handler
  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setIsLoading(false);
  };

  // JavaScript to inject into WebView for Clerk authentication
  const injectedJavaScript = `
    (function() {
      // Wait for page to load
      window.addEventListener('load', function() {
        // Check if Clerk is loaded
        if (window.Clerk) {
          console.log('Clerk is available in WebView');

          // Listen for authentication state changes
          window.Clerk.addListener(function(event) {
            if (event.type === 'auth') {
              console.log('Clerk auth event:', event);

              // Send auth state to React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'clerk_auth',
                isSignedIn: !!event.user,
                user: event.user
              }));
            }
          });
        }

        // Also check periodically for Clerk auth state
        setInterval(function() {
          if (window.Clerk && window.Clerk.user) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'clerk_auth_check',
              isSignedIn: true,
              user: window.Clerk.user
            }));
          }
        }, 5000);
      });

      // Override console.log to send logs to React Native
      const originalLog = console.log;
      console.log = function(...args) {
        originalLog.apply(console, args);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'console_log',
          message: args.join(' ')
        }));
      };
    })();
  `;

  // Handle notification tap to navigate in WebView
  const handleNotificationPress = (data: any) => {
    console.log('Notification pressed with data:', data);

    if (data.url && webViewRef.current) {
      // Navigate to the URL from notification data
      webViewRef.current.injectJavaScript(`
        window.location.href = '${data.url}';
      `);
    } else if (data.domain_uuid && webViewRef.current) {
      // Navigate to domain details
      webViewRef.current.injectJavaScript(`
        window.location.href = 'https://guard.ipulse.one/domains/${data.domain_uuid}';
      `);
    } else if (data.incident_uuid && webViewRef.current) {
      // Navigate to incident details
      webViewRef.current.injectJavaScript(`
        window.location.href = 'https://guard.ipulse.one/incidents/${data.incident_uuid}';
      `);
    }
  };

  return (
    <View style={styles.container}>
      <NotificationToast
        onPress={handleNotificationPress}
        autoHideDelay={6000}
      />

      <WebView
        ref={webViewRef}
        source={{ uri: PULSEGUARD_URL }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="compatibility"
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        injectedJavaScript={injectedJavaScript}
        userAgent="PulseGuardMobile/1.0"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('WebView message:', data);

            if (data.type === 'clerk_auth' || data.type === 'clerk_auth_check') {
              console.log('Clerk auth state:', data.isSignedIn);
            }
          } catch (error) {
            console.log('WebView message (not JSON):', event.nativeEvent.data);
          }
        }}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.loadingText}>PulseGuard wordt geladen...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
  },
});

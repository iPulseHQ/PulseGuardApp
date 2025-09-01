import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import NotificationToast from './NotificationToast';

const PULSEGUARD_URL = 'https://guard.ipulse.one';

export default function PulseGuardWebView() {
  const webViewRef = useRef<WebView>(null);
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
    const isExpoGo = Constants.executionEnvironment === 'storeClient';

    if (!Device.isDevice || isExpoGo) {
      console.log('Push notifications only work on physical devices (not Expo Go)');
      console.log('For push notifications, create a development build with: npx expo run:android or npx expo run:ios');
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

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        console.error('Project ID not found in app configuration');
        throw new Error('Project ID not found');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      console.log('Expo push token:', token.data);
      setExpoPushToken(token.data);

      // Register token with backend
      await registerPushToken(token.data);

    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  // Store push token for when user logs in via WebView
  const registerPushToken = async (token: string) => {
    console.log('Expo push token available:', token);
    // Token will be registered via Laravel webhook when user is authenticated in WebView
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

  // Minimal JavaScript for WebView communication
  const injectedJavaScript = `
    (function() {
      console.log('PulseGuard WebView loaded');
    })();
    true;
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
          console.log('WebView message:', event.nativeEvent.data);
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

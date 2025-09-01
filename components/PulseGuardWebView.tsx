import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import NotificationToast from './NotificationToast';

const PULSEGUARD_URL = 'https://guard.ipulse.one';

export default function PulseGuardWebView() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // Configure notification handling and register for push notifications
  useEffect(() => {
    // Configure how notifications should be handled
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

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

    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return;
    }

    if (isExpoGo) {
      console.log('Push notifications not supported in Expo Go - need development build');
      // Show user-friendly message
      Alert.alert(
        'Push Notificaties',
        'Push notificaties werken niet in Expo Go. Download de app uit de App Store of TestFlight voor notificaties.',
        [{ text: 'OK' }]
      );
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

  // Store push token and send to WebView for registration
  const registerPushToken = async (token: string) => {
    console.log('Expo push token available:', token);
    
    // Send token to WebView immediately if available
    if (webViewRef.current) {
      sendTokenToWebView(token);
    }
    
    // Store token in state so it can be sent when WebView loads
    setExpoPushToken(token);
  };

  // Send push token to WebView for registration with Laravel backend
  const sendTokenToWebView = (token: string) => {
    if (!webViewRef.current) {
      console.log('WebView not ready, storing token for later');
      return;
    }

    try {
      const deviceInfo = {
        token: token,
        device_name: Device.deviceName || 'PulseGuard Mobile',
        device_type: Platform.OS,
        app_version: Constants.expoConfig?.version || '2.0.0',
        is_expo_go: Constants.executionEnvironment === 'storeClient',
        app_name: 'PulseGuard Mobile'
      };

      // JavaScript to register the push token with Laravel
      const script = `
        (function() {
          // Wait for jQuery and ensure user is authenticated
          function registerPushToken() {
            if (typeof $ === 'undefined') {
              setTimeout(registerPushToken, 500);
              return;
            }
            
            // Check if user is authenticated (look for common auth indicators)
            const isAuthenticated = document.querySelector('meta[name="csrf-token"]') || 
                                   document.querySelector('[data-user-id]') ||
                                   window.location.pathname.includes('/dashboard') ||
                                   window.location.pathname.includes('/domains');
            
            if (!isAuthenticated) {
              console.log('User not authenticated yet, waiting...');
              setTimeout(registerPushToken, 2000);
              return;
            }
            
            console.log('Registering push token with backend...');
            
            $.ajaxSetup({
              headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') || ''
              }
            });
            
            $.ajax({
              url: '/api/expo-push-token',
              method: 'POST',
              data: ${JSON.stringify(deviceInfo)},
              success: function(response) {
                console.log('Push token registered successfully:', response);
                
                // Show success notification in the web interface
                if (typeof toastr !== 'undefined') {
                  toastr.success('Push notificaties zijn ingeschakeld voor deze app!');
                } else {
                  // Fallback notification
                  const notification = document.createElement('div');
                  notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#22c55e;color:white;padding:12px 16px;border-radius:8px;z-index:10000;font-family:sans-serif;';
                  notification.textContent = '✅ Push notificaties ingeschakeld!';
                  document.body.appendChild(notification);
                  setTimeout(() => notification.remove(), 4000);
                }
              },
              error: function(xhr, status, error) {
                console.error('Failed to register push token:', xhr.responseJSON || error);
                
                // Show error notification
                if (typeof toastr !== 'undefined') {
                  toastr.error('Kon push notificaties niet inschakelen. Probeer opnieuw.');
                } else {
                  // Fallback notification
                  const notification = document.createElement('div');
                  notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#ef4444;color:white;padding:12px 16px;border-radius:8px;z-index:10000;font-family:sans-serif;';
                  notification.textContent = '❌ Push notificaties niet ingeschakeld';
                  document.body.appendChild(notification);
                  setTimeout(() => notification.remove(), 4000);
                }
              }
            });
          }
          
          // Start registration process
          registerPushToken();
        })();
        true;
      `;

      webViewRef.current.injectJavaScript(script);
      console.log('Push token sent to WebView for registration');

    } catch (error) {
      console.error('Error sending token to WebView:', error);
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
    
    // Send push token to WebView once it's loaded
    if (expoPushToken) {
      console.log('WebView loaded, sending push token...');
      // Delay slightly to ensure page is fully loaded
      setTimeout(() => {
        sendTokenToWebView(expoPushToken);
      }, 1000);
    }
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

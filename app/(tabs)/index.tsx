import * as KeepAwake from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNotifications } from '../../hooks/useNotifications';

const PULSEGUARD_URL = 'https://app.pulseguard.nl';

export default function KioskScreen() {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const { expoPushToken } = useNotifications();
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(PULSEGUARD_URL);

  // Keep screen awake in kiosk mode
  useEffect(() => {
    KeepAwake.activateKeepAwake();
    return () => {
      KeepAwake.deactivateKeepAwake();
    };
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    
    Alert.alert(
      'Connection Error',
      'Unable to load PulseGuard. Please check your internet connection.',
      [
        {
          text: 'Retry',
          onPress: () => {
            if (webViewRef.current) {
              webViewRef.current.reload();
            }
          },
        },
      ]
    );
  };

  const injectedJavaScript = `
    (function() {
      // Inject the Expo push token into the web app
      if (window.localStorage) {
        window.localStorage.setItem('expo_push_token', '${expoPushToken || ''}');
      }
      
      // Add custom styling for kiosk mode
      const style = document.createElement('style');
      style.textContent = \`
        /* Hide browser-specific UI elements */
        body {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          overflow-x: hidden;
        }
        
        /* Enhance touch targets for mobile */
        button, a, .clickable {
          min-height: 44px;
          min-width: 44px;
        }
        
        /* Disable text selection */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Custom scrollbar for better touch experience */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      \`;
      document.head.appendChild(style);
      
      // Notify the web app that it's running in kiosk mode
      window.isKioskMode = true;
      window.expoPushToken = '${expoPushToken || ''}';
      
      // Dispatch a custom event to let the web app know the token is available
      window.dispatchEvent(new CustomEvent('expo-token-ready', {
        detail: { token: '${expoPushToken || ''}' }
      }));
      
      // Add message handler for web app communication
      window.addEventListener('message', function(event) {
        if (event.data.type === 'expo-notification-test') {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'notification-test',
            message: event.data.message || 'Test from WebView'
          }));
        }
      });
      
      true; // Required for injected JavaScript
    })();
  `;

  const userAgent = 'PulseGuardKiosk/1.0 (Mobile App)';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="auto" backgroundColor="#3b82f6" />
      
      <WebView
        ref={webViewRef}
        source={{ uri: PULSEGUARD_URL }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        injectedJavaScript={injectedJavaScript}
        userAgent={userAgent}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
        allowsLinkPreview={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        bounces={false}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        nestedScrollEnabled={true}
        contentInsetAdjustmentBehavior="automatic"
        onMessage={(event) => {
          // Handle messages from the web app
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('Message from WebView:', data);
            
            // You can handle specific messages from the web app here
            if (data.type === 'notification-test') {
              Alert.alert('Test Notification', data.message);
            }
          } catch (error) {
            console.log('Raw message from WebView:', event.nativeEvent.data);
          }
        }}
        onLoadStart={() => {
          console.log('Loading PulseGuard...');
        }}
        onLoadEnd={() => {
          console.log('PulseGuard loaded successfully');
        }}
        onShouldStartLoadWithRequest={(request) => {
          // Allow navigation within the PulseGuard domain
          const url = request.url.toLowerCase();
          
          // Allow PulseGuard URLs
          if (url.includes('pulseguard.nl') || url.includes('localhost')) {
            return true;
          }
          
          // Allow common authentication domains
          if (url.includes('clerk.') || url.includes('google.') || url.includes('github.')) {
            return true;
          }
          
          // Block external navigation
          console.log('Blocked external navigation to:', request.url);
          return false;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b82f6',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

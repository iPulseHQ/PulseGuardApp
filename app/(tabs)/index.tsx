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
  const { expoPushToken, sendTokenToWebView } = useNotifications();
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(PULSEGUARD_URL);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenSent, setTokenSent] = useState(false);

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

  // Send token when both token and authentication are ready
  useEffect(() => {
    if (expoPushToken && isAuthenticated && !tokenSent && webViewRef.current) {
      console.log('Sending token to authenticated WebView...');
      sendTokenToWebView(webViewRef, expoPushToken);
      setTokenSent(true);
    }
  }, [expoPushToken, isAuthenticated, tokenSent, sendTokenToWebView]);

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
    
    // Check if we're on the main app (not Clerk login)
    const isOnMainApp = navState.url.includes('app.pulseguard.nl') && 
                       !navState.url.includes('clerk') && 
                       !navState.url.includes('sign-in') && 
                       !navState.url.includes('sign-up');
    
    if (isOnMainApp && !isAuthenticated) {
      console.log('User appears to be authenticated and on main app');
      setIsAuthenticated(true);
    }
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
      // Add custom styling for kiosk mode with scroll performance optimizations
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
          /* Performance optimizations for scrolling */
          -webkit-overflow-scrolling: touch;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-perspective: 1000;
          perspective: 1000;
        }
        
        /* Enhanced scroll performance for all elements */
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-overflow-scrolling: touch;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        
        /* Optimize scrollable containers */
        .scrollable, 
        [style*="overflow"], 
        [class*="scroll"],
        .table-responsive,
        .overflow-auto,
        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          will-change: scroll-position;
        }
        
        /* Enhance touch targets for mobile */
        button, a, .clickable {
          min-height: 44px;
          min-width: 44px;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
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
        
        /* Optimize animations and transitions */
        * {
          -webkit-animation-duration: 0.1s;
          animation-duration: 0.1s;
          -webkit-transition-duration: 0.1s;
          transition-duration: 0.1s;
        }
        
        /* Reduce motion for better performance */
        @media (prefers-reduced-motion: reduce) {
          * {
            -webkit-animation-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            -webkit-animation-iteration-count: 1 !important;
            animation-iteration-count: 1 !important;
            -webkit-transition-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      \`;
      document.head.appendChild(style);
      
      // Optimize scroll performance with requestAnimationFrame
      let ticking = false;
      function optimizeScrollPerformance() {
        const scrollableElements = document.querySelectorAll('[style*="overflow"], .scrollable, .table-responsive, .overflow-auto, .overflow-y-auto');
        scrollableElements.forEach(el => {
          el.style.webkitOverflowScrolling = 'touch';
          el.style.transform = 'translateZ(0)';
          el.style.willChange = 'scroll-position';
        });
        
        // Add momentum scrolling to body if not already present
        if (!document.body.style.webkitOverflowScrolling) {
          document.body.style.webkitOverflowScrolling = 'touch';
        }
      }
      
      // Run optimization immediately and on DOM changes
      optimizeScrollPerformance();
      
      // Use MutationObserver to optimize new elements
      const observer = new MutationObserver(() => {
        if (!ticking) {
          requestAnimationFrame(() => {
            optimizeScrollPerformance();
            ticking = false;
          });
          ticking = true;
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Notify the web app that it's running in kiosk mode
      window.isKioskMode = true;
      
      // Listen for push token messages from React Native
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'expo-push-token') {
          console.log('Received push token from native app:', event.data.data);
          
          // Register the token with the Laravel backend using authenticated session
          fetch('/api/expo-push-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/json',
              // Get CSRF token from meta tag if available
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            credentials: 'same-origin', // Include cookies for session auth
            body: JSON.stringify(event.data.data)
          })
          .then(response => {
            if (response.ok) {
              console.log('Push token registered successfully');
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'token-registration-success',
                message: 'Push token registered successfully'
              }));
            } else {
              console.error('Failed to register push token:', response.status, response.statusText);
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'token-registration-error',
                message: 'Failed to register push token: ' + response.status
              }));
            }
          })
          .catch(error => {
            console.error('Error registering push token:', error);
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'token-registration-error',
              message: 'Network error: ' + error.message
            }));
          });
        }
        
        if (event.data && event.data.type === 'expo-notification-test') {
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
        scalesPageToFit={false}
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
        // Performance optimizations for scrolling
        renderingOptimizationEnabled={true}
        directEventTypes={['onScroll']}
        nativeConfig={{
          props: {
            webkitAllowsAirPlayForMediaPlayback: false,
            webkitBounces: false,
            webkitScrollEnabled: true,
            webkitKeyboardDisplayRequiresUserAction: false,
            webkitAllowsInlineMediaPlayback: true,
          }
        }}
        // Android specific optimizations
        androidLayerType="hardware"
        androidHardwareAccelerationDisabled={false}
        cacheMode="LOAD_DEFAULT"
        textZoom={100}
        onMessage={(event) => {
          // Handle messages from the web app
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('Message from WebView:', data);
            
            // Handle different message types
            if (data.type === 'notification-test') {
              Alert.alert('Test Notification', data.message);
            } else if (data.type === 'token-registration-success') {
              console.log('✅ Push token registered successfully');
            } else if (data.type === 'token-registration-error') {
              console.error('❌ Push token registration failed:', data.message);
            }
          } catch (error) {
            console.log('Raw message from WebView:', event.nativeEvent.data);
          }
        }}
        onLoadStart={() => {
          console.log('Loading PulseGuard...');
          // Reset authentication state when starting a new load
          setIsAuthenticated(false);
          setTokenSent(false);
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

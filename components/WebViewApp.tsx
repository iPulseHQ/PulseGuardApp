import * as KeepAwake from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNotifications } from '../hooks/useNotifications';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';

interface WebViewAppProps {
  appMode: 'main' | 'files' | 'crm';
  initialUrl: string;
  onBackToLauncher: () => void;
}

const getAppDisplayName = (mode: string) => {
  switch (mode) {
    case 'main': return 'PulseGuard';
    case 'files': return 'PulseFiles';
    case 'crm': return 'PulseCRM';
    default: return 'App';
  }
};

export default function WebViewApp({ appMode, initialUrl, onBackToLauncher }: WebViewAppProps) {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const { expoPushToken, sendTokenToWebView } = useNotifications();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenSent, setTokenSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [injectedJS, setInjectedJS] = useState('');
  const isWeb = Platform.OS === 'web';

  // Keep screen awake in kiosk mode (native only)
  useEffect(() => {
    if (isWeb) return;
    KeepAwake.activateKeepAwake();
    return () => {
      KeepAwake.deactivateKeepAwake();
    };
  }, [isWeb]);

  // On web, redirect to the web app directly instead of rendering WebView
  useEffect(() => {
    if (!isWeb) return;
    try {
      window.location.assign(initialUrl);
    } catch {}
  }, [isWeb, initialUrl]);

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

  // Generate basic injected JavaScript for kiosk mode
  useEffect(() => {
    const generateJS = async () => {
      console.log('Generating injected JavaScript...');
      const js = await createInjectedJavaScript();
      console.log('Generated JS length:', js.length);
      setInjectedJS(js);
    };
    generateJS();
  }, []);

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
    const isOnMainApp = (navState.url.includes('app.pulseguard.pro') || 
                         navState.url.includes('files.pulseguard.pro') ||
                         navState.url.includes('crm.staging.pulseguard.pro')) && 
                       !navState.url.includes('accounts.pulseguard.pro') &&
                       !navState.url.includes('clerk') && 
                       !navState.url.includes('sign-in') && 
                       !navState.url.includes('sign-up');
    
    if (isOnMainApp && !isAuthenticated) {
      console.log('User appears to be authenticated and on main app');
      setIsAuthenticated(true);
    }
    
    console.log('Current URL:', navState.url);
    console.log('Is on main app:', isOnMainApp);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    
    Alert.alert(
      'Verbindingsfout',
      `Kan ${getAppDisplayName(appMode)} niet laden. Controleer je internetverbinding.`,
      [
        {
          text: 'Opnieuw proberen',
          onPress: () => {
            if (webViewRef.current) {
              webViewRef.current.reload();
            }
          },
        },
        {
          text: 'Terug naar startscherm',
          onPress: onBackToLauncher,
        },
      ]
    );
  };

  // Create basic injected JavaScript for kiosk mode only
  const createInjectedJavaScript = async () => {
    return `
      (function() {
        console.log('Injected JavaScript executing...');
        console.log('Current URL:', window.location.href);
        console.log('App Mode:', '${appMode}');
        
        // Add custom styling for kiosk mode
        const style = document.createElement('style');
        style.textContent = \`
          body {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
          }
          
          button, a, .clickable, [role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
          
          .content, main, [role="main"], .main-content {
            padding-bottom: 100px !important;
            -webkit-overflow-scrolling: touch;
          }
        \`;
        document.head.appendChild(style);
        
        // Notify the web app that it's running in kiosk mode
        window.isKioskMode = true;
        window.appMode = '${appMode}';
        
        // Check for test notification in URL
        const urlParams = new URLSearchParams(window.location.search);
        const testNotification = urlParams.get('test_notification');
        if (testNotification) {
          console.log('Test notification requested:', testNotification);
          
          // Send test notification after page loads
          setTimeout(() => {
            fetch('/api/expo-push-token/test', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
              },
              credentials: 'same-origin',
              body: JSON.stringify({
                type: testNotification
              })
            })
            .then(response => response.json())
            .then(data => {
              console.log('Test notification result:', data);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'test-notification-result',
                  success: true,
                  message: data.message
                }));
              }
            })
            .catch(error => {
              console.error('Test notification error:', error);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'test-notification-result',
                  success: false,
                  error: error.message
                }));
              }
            });
          }, 2000);
        }
        
        // Listen for push token messages from React Native
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'expo-push-token') {
            console.log('Received push token from native app:', event.data.data);
            
            // Register the token with the backend
            const endpoints = {
              main: '/api/expo-push-token',
              files: '/api/user/push-token',
              crm: '/api/push-token'
            };
            
            const endpoint = endpoints['${appMode}'] || endpoints.main;
            
            fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
              },
              credentials: 'same-origin',
              body: JSON.stringify(event.data.data)
            })
            .then(response => {
              if (response.ok) {
                console.log('Push token registered successfully');
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'token-registration-success',
                    message: 'Push token registered successfully'
                  }));
                }
              } else {
                console.error('Failed to register push token:', response.status);
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'token-registration-error',
                    message: 'Failed to register push token: ' + response.status
                  }));
                }
              }
            })
            .catch(error => {
              console.error('Error registering push token:', error);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'token-registration-error',
                  message: 'Network error: ' + error.message
                }));
              }
            });
          }
        });
        
        true;
      })();
    `;
  };

  const userAgent = 'PulseGuardApp/2.0 (Mobile App)';

  // Web fallback UI while redirecting
  if (isWeb) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}> 
        <StatusBar style="light" backgroundColor="#1e40af" />
        <View style={styles.webFallback}> 
          <Text style={styles.webFallbackText}>Doorsturen naar {getAppDisplayName(appMode)}…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}> 
      <StatusBar style="auto" />
      
      {/* Back button */}
      <TouchableOpacity 
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={onBackToLauncher}
        activeOpacity={0.8}
      >
        <View style={styles.backButtonCircle}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </View>
      </TouchableOpacity>
      
      {/* WebView takes full screen */}
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        injectedJavaScript={injectedJS || ''}
        onLoadEnd={() => {
          console.log(`${getAppDisplayName(appMode)} loaded successfully`);
          console.log('Injected JS length:', injectedJS.length);
          setIsLoading(false);
        }}
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
        incognito={false}
        cacheEnabled={true}
        bounces={false}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        nestedScrollEnabled={true}
        contentInsetAdjustmentBehavior="never"
        androidLayerType="hardware"
        cacheMode="LOAD_DEFAULT"
        textZoom={100}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('Message from WebView:', data);
            
            if (data.type === 'notification-test') {
              Alert.alert('Test Notificatie', data.message);
            } else if (data.type === 'test-notification-result') {
              if (data.success) {
                console.log('Test notification sent successfully:', data.message);
                Alert.alert('Test Notificatie', data.message || 'Test notificatie verstuurd!');
              } else {
                console.error('Test notification failed:', data.error);
                Alert.alert('Fout', 'Test notificatie mislukt: ' + (data.error || 'Onbekende fout'));
              }
            } else if (data.type === 'token-registration-success') {
              console.log('Push token registered successfully');
            } else if (data.type === 'token-registration-error') {
              console.error('Push token registration failed:', data.message);
            }
          } catch (error) {
            console.log('Raw message from WebView:', event.nativeEvent.data);
          }
        }}
        onLoadStart={() => {
          console.log(`Loading ${getAppDisplayName(appMode)}...`);
          setIsLoading(true);
          setIsAuthenticated(false);
          setTokenSent(false);
        }}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url.toLowerCase();
          
          // Allow PulseGuard URLs and authentication domains
          if (url.includes('pulseguard.pro') || 
              url.includes('pulseguard.nl') || 
              url.includes('localhost') ||
              url.includes('clerk.') || 
              url.includes('google.') || 
              url.includes('github.')) {
            return true;
          }
          
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
    backgroundColor: '#ffffff',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1000,
  },
  backButtonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  webFallbackText: {
    color: '#111827',
    fontSize: 16,
  },
});
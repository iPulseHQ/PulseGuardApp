import * as KeepAwake from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useNotifications } from '../../hooks/useNotifications';

const PULSEGUARD_URL = 'https://app.pulseguard.pro';
const FILES_URL = 'https://files.pulseguard.pro/';

type AppMode = 'main' | 'files';

const { width: screenWidth } = Dimensions.get('window');

export default function KioskScreen() {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const { expoPushToken, sendTokenToWebView } = useNotifications();
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(PULSEGUARD_URL);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenSent, setTokenSent] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('main');
  const [isLoading, setIsLoading] = useState(true);
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
      // Use assign to keep history entry
      const targetUrl = appMode === 'files' ? FILES_URL : PULSEGUARD_URL;
      window.location.assign(targetUrl);
    } catch {}
  }, [isWeb, appMode]);

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
    const isOnMainApp = (navState.url.includes('app.pulseguard.pro') || navState.url.includes('app.pulseguard.nl') || navState.url.includes('files.pulseguard.pro')) && 
                       !navState.url.includes('clerk') && 
                       !navState.url.includes('sign-in') && 
                       !navState.url.includes('sign-up');
    
    if (isOnMainApp && !isAuthenticated) {
      console.log('User appears to be authenticated and on main app');
      setIsAuthenticated(true);
    }
  };

  const switchApp = (mode: AppMode) => {
    if (mode === appMode) return;
    
    setAppMode(mode);
    setIsLoading(true);
    setIsAuthenticated(false);
    setTokenSent(false);
    
    const newUrl = mode === 'files' ? FILES_URL : PULSEGUARD_URL;
    setCurrentUrl(newUrl);
    
    if (webViewRef.current) {
      webViewRef.current.source = { uri: newUrl };
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    
    Alert.alert(
      'Connection Error',
      `Unable to load ${appMode === 'files' ? 'PulseFiles' : 'PulseGuard'}. Please check your internet connection.`,
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
        /* Hide browser-specific UI elements and improve mobile experience */
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
        .overflow-y-auto,
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          will-change: scroll-position;
        }
        
        /* Enhance touch targets for mobile */
        button, a, .clickable, [role="button"] {
          min-height: 44px;
          min-width: 44px;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
        
        /* Better button styling for bottom navigation/actions */
        .fixed, .sticky, [class*="bottom"], [class*="footer"] {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          will-change: transform;
        }
        
        /* Improve scrolling for long content areas */
        .content, main, [role="main"], .main-content {
          padding-bottom: 100px !important; /* Extra space for bottom buttons */
          -webkit-overflow-scrolling: touch;
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
          -webkit-animation-duration: 0.2s;
          animation-duration: 0.2s;
          -webkit-transition-duration: 0.2s;
          transition-duration: 0.2s;
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
        
        /* Specific fixes for common bottom button issues */
        .btn-group, .button-group, .actions, .form-actions {
          margin-bottom: 20px !important;
          padding-bottom: 20px !important;
        }
        
        /* Ensure forms are properly scrollable */
        form {
          padding-bottom: 60px !important;
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
        
        // Fix bottom padding for better button visibility
        const mainContent = document.querySelector('main, .main-content, .content, [role="main"]');
        if (mainContent && !mainContent.style.paddingBottom) {
          mainContent.style.paddingBottom = '100px';
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
      window.appMode = '${appMode}';
      
      // Share Clerk authentication state between apps
      const shareClerkAuth = () => {
        // Get Clerk session token from current app
        const clerkSession = window.__clerk_session || localStorage.getItem('__clerk_session');
        const clerkToken = window.__clerk_jwt_token || localStorage.getItem('__clerk_jwt_token');
        const clerkUser = window.__clerk_user || localStorage.getItem('__clerk_user');
        
        if (clerkSession || clerkToken) {
          // Store in shared storage for cross-app authentication
          try {
            localStorage.setItem('pulseguard_clerk_session', clerkSession || '');
            localStorage.setItem('pulseguard_clerk_token', clerkToken || '');
            localStorage.setItem('pulseguard_clerk_user', clerkUser || '');
            localStorage.setItem('pulseguard_auth_domain', window.location.hostname);
            localStorage.setItem('pulseguard_auth_timestamp', Date.now().toString());
            
            console.log('Clerk authentication state shared across apps');
          } catch (e) {
            console.warn('Failed to share Clerk auth state:', e);
          }
        }
      };
      
      // Check for shared authentication when switching between apps
      const loadSharedClerkAuth = () => {
        if (window.appMode === 'files' || window.location.hostname.includes('files.pulseguard.pro')) {
          try {
            const sharedSession = localStorage.getItem('pulseguard_clerk_session');
            const sharedToken = localStorage.getItem('pulseguard_clerk_token');
            const sharedUser = localStorage.getItem('pulseguard_clerk_user');
            const authTimestamp = localStorage.getItem('pulseguard_auth_timestamp');
            
            // Check if auth is recent (within 24 hours)
            const isRecentAuth = authTimestamp && (Date.now() - parseInt(authTimestamp)) < (24 * 60 * 60 * 1000);
            
            if (isRecentAuth && (sharedSession || sharedToken)) {
              // Set Clerk auth state for PulseFiles
              if (sharedSession) window.__clerk_session = sharedSession;
              if (sharedToken) window.__clerk_jwt_token = sharedToken;
              if (sharedUser) window.__clerk_user = sharedUser;
              
              console.log('Loaded shared Clerk authentication for PulseFiles');
              
              // Trigger Clerk authentication check
              if (window.Clerk) {
                window.Clerk.load().then(() => {
                  console.log('Clerk loaded with shared authentication');
                }).catch(e => {
                  console.warn('Failed to load Clerk with shared auth:', e);
                });
              }
            }
          } catch (e) {
            console.warn('Failed to load shared Clerk auth:', e);
          }
        }
      };
      
      // Share auth when page loads and when auth changes
      shareClerkAuth();
      loadSharedClerkAuth();
      
      // Monitor for Clerk auth changes
      const authWatcher = setInterval(() => {
        shareClerkAuth();
      }, 5000);
      
      // Clean up on page unload
      window.addEventListener('beforeunload', () => {
        clearInterval(authWatcher);
      });
      
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

  const userAgent = 'PulseGuardKiosk/2.0 (Mobile App)';

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 10 : 20 }]}>
      <Text style={styles.headerTitle}>PulseGuard</Text>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, appMode === 'main' && styles.activeTab]}
          onPress={() => switchApp('main')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, appMode === 'main' && styles.activeTabText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, appMode === 'files' && styles.activeTab]}
          onPress={() => switchApp('files')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, appMode === 'files' && styles.activeTabText]}>Files</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Web fallback UI while redirecting
  if (isWeb) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}> 
        <StatusBar style="light" backgroundColor="#1e40af" />
        <View style={styles.webFallback}> 
          <Text style={styles.webFallbackText}>Doorsturen naar {appMode === 'files' ? 'PulseFiles' : 'PulseGuard'}…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}> 
      <StatusBar style="light" backgroundColor="#1e40af" />
      
      {renderHeader()}
      
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
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
        contentInsetAdjustmentBehavior="never"
        // Performance-related props kept within supported API
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
          console.log(`Loading ${appMode === 'files' ? 'PulseFiles' : 'PulseGuard'}...`);
          setIsLoading(true);
          // Reset authentication state when starting a new load
          setIsAuthenticated(false);
          setTokenSent(false);
        }}
        onLoadEnd={() => {
          console.log(`${appMode === 'files' ? 'PulseFiles' : 'PulseGuard'} loaded successfully`);
          setIsLoading(false);
        }}
        onShouldStartLoadWithRequest={(request) => {
          // Allow navigation within the PulseGuard domain
          const url = request.url.toLowerCase();
          
          // Allow PulseGuard URLs (both .pro and legacy .nl)
          if (url.includes('pulseguard.pro') || url.includes('pulseguard.nl') || url.includes('localhost')) {
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
    backgroundColor: '#1e40af',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeTabText: {
    color: '#1e40af',
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
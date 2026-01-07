import { OrganizationProvider } from '@/context/OrganizationContext';
import { SecurityProvider } from '@/context/SecurityContext';
import { tokenCache } from '@/lib/auth/token-cache';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Configure notification behavior with error handling
// Note: This may not work in Expo Go with SDK 53+
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.warn('Failed to configure notification handler:', error);
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Get the Clerk publishable key
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Please set it in your .env file.'
  );
}

// Auth-aware navigation component
function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:57',message:'InitialLayout useEffect triggered',data:{isLoaded,isSignedIn,segments},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion

    if (!isLoaded) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:58',message:'isLoaded is false, returning early',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H6'})}).catch(()=>{});
      // #endregion
      return;
    }

    // Voorkom navigatie voordat de router echt klaar is
    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === '(auth)';

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:62',message:'Navigation logic evaluation',data:{rootSegment,inAuthGroup,isSignedIn},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion

    if (isSignedIn && inAuthGroup) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:65',message:'Navigating to tabs (signed in, in auth group)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H6'})}).catch(()=>{});
      // #endregion
      // Gebruik een kleine vertraging om de 'href' undefined error te voorkomen
      setTimeout(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:67',message:'Executing router.replace to /(tabs)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H6'})}).catch(()=>{});
        // #endregion
        router.replace('/(tabs)');
      }, 1);
    } else if (!isSignedIn && !inAuthGroup && rootSegment !== undefined) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:69',message:'Navigating to sign-in (not signed in, not in auth group)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H6'})}).catch(()=>{});
      // #endregion
      setTimeout(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:71',message:'Executing router.replace to /(auth)/sign-in',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H6'})}).catch(()=>{});
        // #endregion
        router.replace('/(auth)/sign-in');
      }, 1);
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:74',message:'No navigation action taken',data:{isSignedIn,inAuthGroup,rootSegment},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H6'})}).catch(()=>{});
      // #endregion
    }
  }, [isLoaded, isSignedIn, segments]);

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={publishableKey}
    >
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <OrganizationProvider>
            <SecurityProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                  <InitialLayout />
                  <StatusBar style="light" />
                </SafeAreaProvider>
              </GestureHandlerRootView>
            </SecurityProvider>
          </OrganizationProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
});

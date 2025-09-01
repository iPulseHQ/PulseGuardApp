import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotificationProvider } from '../hooks/useNotifications';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Removed Clerk authentication - using browser-based authentication instead

export default function RootLayout() {
  console.log('RootLayout rendering...');

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  console.log('Fonts loaded:', loaded);

  useEffect(() => {
    if (loaded) {
      console.log('Hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    console.log('Fonts not loaded yet, showing null');
    return null;
  }

  console.log('Rendering main app');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NotificationProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="dark" />
        </NotificationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

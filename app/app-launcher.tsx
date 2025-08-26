import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { useNotifications } from '../hooks/useNotifications';


interface AppOption {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  url: string;
  mode: 'main' | 'files' | 'crm';
}

const apps: AppOption[] = [
  {
    id: 'pulseguard',
    title: 'PulseGuard',
    subtitle: 'Dashboard en monitoring',
    icon: 'shield-checkmark',
    color: '#1e40af',
    url: process.env.EXPO_PUBLIC_PULSEGUARD_URL || 'https://app.pulseguard.pro',
    mode: 'main',
  },
  {
    id: 'pulsefiles',
    title: 'PulseFiles',
    subtitle: 'Bestandsbeheer',
    icon: 'folder',
    color: '#059669',
    url: process.env.EXPO_PUBLIC_PULSEFILES_URL || 'https://files.pulseguard.pro',
    mode: 'files',
  },
  {
    id: 'pulsecrm',
    title: 'PulseCRM',
    subtitle: 'Klantbeheer',
    icon: 'people',
    color: '#dc2626',
    url: process.env.EXPO_PUBLIC_PULSECRM_URL || 'https://crm.staging.pulseguard.pro',
    mode: 'crm',
  },
];

export default function AppLauncher() {
  console.log('AppLauncher rendering...');
  
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut } = useAuth();
  const { expoPushToken } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  
  console.log('User:', !!user, user?.firstName);
  console.log('Push token available:', !!expoPushToken);

  const handleAppSelect = async (app: AppOption) => {
    setIsLoading(true);
    try {
      // Add mobile auth indicator to URL
      const urlWithAuth = app.url + (app.url.includes('?') ? '&' : '?') + 'mobile_auth=true&timestamp=' + Date.now();
      
      // Navigate to the web view with the selected app
      router.push({
        pathname: '/(tabs)',
        params: { app: app.mode, url: urlWithAuth }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress.split('@')[0];
    }
    return 'Gebruiker';
  };

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        
        {/* Header */}
        <View style={styles.header}>
          <GlassCard style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.welcomeText}>Welkom,</Text>
                <Text style={styles.userName}>{getUserDisplayName()}</Text>
              </View>
              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={handleSignOut}
                disabled={isLoading}
              >
                <Ionicons name="log-out-outline" size={24} color="rgba(255, 255, 255, 0.9)" />
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        {/* App Selection */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Kies een app</Text>
          
          <View style={styles.appsGrid}>
            {apps.map((app) => (
              <TouchableOpacity
                key={app.id}
                onPress={() => handleAppSelect(app)}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <GlassCard style={styles.appCard}>
                  <View style={styles.appCardContent}>
                    <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                      <Ionicons name={app.icon} size={32} color="#ffffff" />
                    </View>
                    <View style={styles.appInfo}>
                      <Text style={styles.appTitle}>{app.title}</Text>
                      <Text style={styles.appSubtitle}>{app.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Additional Links */}
          <View style={styles.additionalLinks}>

            <TouchableOpacity 
              onPress={() => {
                const url = process.env.EXPO_PUBLIC_MAIN_WEBSITE_URL || 'https://pulseguard.pro';
                Linking.openURL(url);
              }}
            >
              <GlassCard style={styles.linkCard}>
                <View style={styles.linkCardContent}>
                  <Ionicons name="globe-outline" size={24} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.linkText}>Hoofdwebsite bezoeken</Text>
                  <Ionicons name="open-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                </View>
              </GlassCard>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                const url = process.env.EXPO_PUBLIC_SUPPORT_URL || 'https://arjandh.notion.site/2400645fff3080a99f1aff31d39eb931?pvs=105';
                Linking.openURL(url);
              }}
            >
              <GlassCard style={styles.linkCard}>
                <View style={styles.linkCardContent}>
                  <Ionicons name="help-circle-outline" size={24} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.linkText}>Ondersteuning</Text>
                  <Ionicons name="open-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerCard: {
    marginTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  signOutButton: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  appsGrid: {
    gap: 20,
  },
  appCard: {
    marginBottom: 4,
  },
  appCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  additionalLinks: {
    marginTop: 32,
    marginBottom: 40,
    gap: 16,
  },
  linkCard: {
    marginBottom: 4,
  },
  linkCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
});
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, TextInput } from 'react-native';
import { useAuth, useSignIn, useOAuth, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppLauncher from '../app-launcher';
import WebViewApp from '../../components/WebViewApp';


export default function MainScreen() {
  console.log('MainScreen rendering...');
  
  const params = useLocalSearchParams();
  const { isSignedIn, isLoaded } = useAuth();
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { startOAuthFlow: googleAuth } = useOAuth({ strategy: 'oauth_google' });
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  console.log('MainScreen params:', params);
  console.log('Is signed in:', isSignedIn);
  console.log('Auth loaded:', isLoaded);

  useEffect(() => {
    if (params.app && params.url && isSignedIn) {
      setSelectedApp(params.app as string);
      setSelectedUrl(params.url as string);
    } else if (params.app && params.url && !isSignedIn) {
      // Clear params if user is not signed in
      router.replace('/(tabs)');
    }
  }, [params, isSignedIn]);

  const handleBackToLauncher = () => {
    setSelectedApp(null);
    setSelectedUrl(null);
    router.replace('/(tabs)');
  };

  const handleSignIn = async () => {
    if (!signInLoaded) return;
    
    if (!email || !password) {
      Alert.alert('Error', 'Vul email en wachtwoord in');
      return;
    }

    setIsLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password: password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        console.error('Sign-in incomplete:', signInAttempt.status);
        Alert.alert('Login Error', 'Login was not completed successfully');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Error', error.errors?.[0]?.message || 'Er is een fout opgetreden bij het inloggen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { createdSessionId, setActive: oauthSetActive } = await googleAuth();
      
      if (createdSessionId) {
        await oauthSetActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert('Login Error', 'Er is een fout opgetreden bij Google login.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingScreenContainer}>
        <View style={styles.loadingContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#1e40af" />
          <Text style={styles.loadingText}>PulseGuard wordt geladen...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SignedIn>
        {selectedApp && selectedUrl ? (
          <WebViewApp 
            appMode={selectedApp as 'main' | 'files' | 'crm'}
            initialUrl={selectedUrl}
            onBackToLauncher={handleBackToLauncher}
          />
        ) : (
          <AppLauncher />
        )}
      </SignedIn>
      <SignedOut>
        <View style={styles.signInScreenContainer}>
          <View style={styles.signInContainer}>
            <View style={styles.loginCard}>
              <View style={styles.loginHeader}>
                <Ionicons name="shield-checkmark" size={64} color="#1e40af" style={styles.loginIcon} />
                <Text style={styles.loginTitle}>Welkom bij PulseGuard</Text>
                <Text style={styles.loginSubtitle}>Log in om toegang te krijgen tot je applicaties</Text>
              </View>
              <View style={styles.formContainer}>
                {/* OAuth Buttons */}
                <TouchableOpacity 
                  style={[styles.oauthButton, styles.googleButton]}
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <Ionicons name="logo-google" size={24} color="#ffffff" />
                  <Text style={styles.oauthButtonText}>
                    {isLoading ? 'Bezig...' : 'Inloggen met Google'}
                  </Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>of</Text>
                  <View style={styles.divider} />
                </View>

                {/* Email/Password Form */}
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Wachtwoord"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={handleSignIn}
                  disabled={isLoading}
                >
                  <Ionicons name="log-in" size={24} color="#ffffff" />
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Bezig met inloggen...' : 'Inloggen'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SignedOut>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  signInScreenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingScreenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  loginHeader: {
    padding: 32,
    paddingBottom: 16,
    alignItems: 'center',
  },
  formContainer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    gap: 16,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    color: '#334155',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loginIcon: {
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    minWidth: 200,
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    color: '#1e40af',
    fontSize: 18,
    fontWeight: '600',
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  googleButton: {
    backgroundColor: '#ea4335',
    borderColor: '#ea4335',
  },
  oauthButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
});
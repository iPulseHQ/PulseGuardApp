import { colors } from '@/lib/theme/colors';
import { useOAuth, useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Google OAuth Hook
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Multi-factor / Device verification state
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [verificationFactor, setVerificationFactor] = useState<any>(null);

    // Warm up browser effect
    useEffect(() => {
        if (Platform.OS !== 'web') {
            void WebBrowser.warmUpAsync();
        }
        return () => {
            if (Platform.OS !== 'web') {
                void WebBrowser.coolDownAsync();
            }
        };
    }, []);

    // Email/Wachtwoord login
    const onSignInPress = useCallback(async () => {
        if (!isLoaded || !signIn) return;

        if (!emailAddress.trim() || !password) {
            setError('Vul e-mail en wachtwoord in');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Stap 1: Create sign in
            const result = await signIn.create({
                identifier: emailAddress.trim(),
                password: password,
            });

            console.log('SignIn result status:', result.status);

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
            } else if (result.status === 'needs_first_factor') {
                // Device verification of email code nodig
                console.log('Needs first factor, factors:', result.supportedFirstFactors);

                // We zoeken naar de email_code factor (meest voorkomend voor nieuwe devices)
                const emailCodeFactor = result.supportedFirstFactors?.find(
                    (f: any) => f.strategy === 'email_code'
                );

                if (emailCodeFactor) {
                    setVerificationFactor(emailCodeFactor);
                    setPendingVerification(true);
                    setError(null);

                    // We moeten de factor "preparen" (verstuurt de mail)
                    await signIn.prepareFirstFactor(emailCodeFactor as any);
                } else {
                    setError('Andere verificatie methode nodig. Log in via de website.');
                }
            } else if (result.status === 'needs_second_factor') {
                // 2FA / TOTP nodig
                setPendingVerification(true);
                setVerificationFactor({ strategy: 'totp' });
            } else {
                setError(`Status: ${result.status}. Log in via de website.`);
            }
        } catch (err: any) {
            console.log('Sign-in error details:', JSON.stringify(err, null, 2));
            const clerkError = err.errors?.[0];
            setError(clerkError?.longMessage || clerkError?.message || 'Inloggen mislukt');
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, emailAddress, password, signIn, setActive]);

    // Code verificatie (voor nieuwe devices / 2FA)
    const onVerifyCodePress = useCallback(async () => {
        if (!isLoaded || !signIn || !code) return;

        setIsLoading(true);
        setError(null);

        try {
            let result;
            if (verificationFactor?.strategy === 'totp') {
                result = await signIn.attemptSecondFactor({
                    strategy: 'totp',
                    code,
                });
            } else {
                result = await signIn.attemptFirstFactor({
                    strategy: 'email_code',
                    code,
                });
            }

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
            } else {
                console.log('Verification not complete:', result.status);
                setError('Verificatie niet voltooid. Probeer opnieuw.');
            }
        } catch (err: any) {
            console.log('Verification error:', JSON.stringify(err, null, 2));
            const clerkError = err.errors?.[0];
            setError(clerkError?.longMessage || clerkError?.message || 'Code is onjuist');
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, signIn, code, verificationFactor, setActive]);

    // Google OAuth login
    const onGoogleSignIn = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const redirectUrl = AuthSession.makeRedirectUri();
            const { createdSessionId, setActive: setActiveSession } = await startOAuthFlow({
                redirectUrl
            });

            if (createdSessionId && setActiveSession) {
                await setActiveSession({ session: createdSessionId });
            }
        } catch (err: any) {
            console.log('Google OAuth Error:', err);
            if (!err.message?.includes('cancel')) {
                setError(err.message || 'Google login mislukt');
            }
        } finally {
            setIsLoading(false);
        }
    }, [startOAuthFlow]);

    // Verificatie Scherm
    if (pendingVerification) {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="mail-open-outline" size={48} color={colors.primary} />
                        </View>
                        <Text style={styles.title}>Verifieer device</Text>
                        <Text style={styles.subtitle}>
                            Vul de code in die we naar {emailAddress} hebben gestuurd
                        </Text>
                    </View>

                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color={colors.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Verificatiecode</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="key-outline" size={20} color={colors.muted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="123456"
                                    placeholderTextColor={colors.muted}
                                    value={code}
                                    onChangeText={(text) => {
                                        setCode(text);
                                        setError(null);
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    autoFocus
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        <Pressable
                            style={[styles.signInButton, isLoading && styles.buttonDisabled]}
                            onPress={onVerifyCodePress}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                                    <Text style={styles.signInButtonText}>Code Verifiëren</Text>
                                </>
                            )}
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                setPendingVerification(false);
                                setCode('');
                                setError(null);
                            }}
                            style={styles.backButton}
                        >
                            <Text style={styles.backButtonText}>Terug naar login</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="pulse" size={48} color={colors.primary} />
                    </View>
                    <Text style={styles.title}>PulseGuard</Text>
                    <Text style={styles.subtitle}>Log in op je dashboard</Text>
                </View>

                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color={colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>E-mailadres</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={colors.muted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="je@email.com"
                                placeholderTextColor={colors.muted}
                                value={emailAddress}
                                onChangeText={(text) => {
                                    setEmailAddress(text);
                                    setError(null);
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Wachtwoord</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.muted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={colors.muted}
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setError(null);
                                }}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                editable={!isLoading}
                                onSubmitEditing={onSignInPress}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={colors.muted}
                                />
                            </Pressable>
                        </View>
                    </View>

                    <Pressable
                        style={[styles.signInButton, isLoading && styles.buttonDisabled]}
                        onPress={onSignInPress}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="log-in-outline" size={20} color="#ffffff" />
                                <Text style={styles.signInButtonText}>Inloggen</Text>
                            </>
                        )}
                    </Pressable>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>of</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <Pressable
                        style={[styles.socialButton, isLoading && styles.buttonDisabled]}
                        onPress={onGoogleSignIn}
                        disabled={isLoading}
                    >
                        <Ionicons name="logo-google" size={20} color={colors.foreground} />
                        <Text style={styles.socialButtonText}>Google Login</Text>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Geen account? </Text>
                    <Link href="/(auth)/sign-up" asChild>
                        <Pressable>
                            <Text style={styles.footerLink}>Registreren</Text>
                        </Pressable>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 72,
        height: 72,
        borderRadius: 18,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.muted,
        textAlign: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        marginLeft: 12,
        flex: 1,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.foreground,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.foreground,
    },
    eyeButton: {
        padding: 8,
    },
    signInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        gap: 10,
        marginTop: 10,
    },
    signInButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    backButton: {
        marginTop: 16,
        alignItems: 'center',
        paddingVertical: 12,
    },
    backButtonText: {
        color: colors.muted,
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        color: colors.muted,
        paddingHorizontal: 16,
        fontSize: 14,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingVertical: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    socialButtonText: {
        color: colors.foreground,
        fontSize: 16,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        color: colors.muted,
        fontSize: 15,
    },
    footerLink: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
});

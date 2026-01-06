import { colors } from '@/lib/theme/colors';
import { useOAuth, useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useState } from 'react';
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

export default function SignUpScreen() {
    const { signUp, setActive, isLoaded } = useSignUp();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Verification state
    const [pendingVerification, setPendingVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    // Google OAuth - only use if available
    let googleOAuth: ReturnType<typeof useOAuth> | null = null;
    try {
        googleOAuth = useOAuth({ strategy: 'oauth_google' });
    } catch (e) {
        // Google OAuth not configured
    }

    const onSignUp = useCallback(async () => {
        if (!isLoaded) return;

        if (!email.trim()) {
            setError('Vul je e-mailadres in');
            return;
        }
        if (!password) {
            setError('Vul een wachtwoord in');
            return;
        }
        if (password.length < 8) {
            setError('Wachtwoord moet minimaal 8 tekens bevatten');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await signUp.create({
                firstName: firstName.trim() || undefined,
                lastName: lastName.trim() || undefined,
                emailAddress: email.trim(),
                password,
            });

            // Send email verification code
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setPendingVerification(true);
        } catch (err: any) {
            console.log('Sign up error:', err);
            const errorCode = err.errors?.[0]?.code;
            const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message;

            if (errorCode === 'form_identifier_exists' || errorMessage?.includes('already')) {
                setError('Dit e-mailadres is al in gebruik');
            } else if (errorMessage?.includes('password')) {
                setError('Wachtwoord voldoet niet aan de eisen');
            } else {
                setError(errorMessage || 'Er is iets misgegaan. Probeer het opnieuw.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, firstName, lastName, email, password, signUp]);

    const onVerify = useCallback(async () => {
        if (!isLoaded) return;

        if (!verificationCode.trim()) {
            setError('Vul de verificatiecode in');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await signUp.attemptEmailAddressVerification({
                code: verificationCode.trim(),
            });

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                // Navigation happens automatically
            } else {
                console.log('Verification needs more steps:', result.status);
                setError('Verificatie niet voltooid');
            }
        } catch (err: any) {
            console.log('Verification error:', err);
            const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message;

            if (errorMessage?.includes('incorrect') || errorMessage?.includes('invalid')) {
                setError('Onjuiste verificatiecode');
            } else {
                setError(errorMessage || 'Verificatie mislukt. Probeer het opnieuw.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, verificationCode, signUp, setActive]);

    const onGoogleSignUp = useCallback(async () => {
        if (!googleOAuth) {
            setError('Google login is niet beschikbaar');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { createdSessionId, setActive: setActiveSession } = await googleOAuth.startOAuthFlow();

            if (createdSessionId && setActiveSession) {
                await setActiveSession({ session: createdSessionId });
                // Navigation happens automatically
            }
        } catch (err: any) {
            console.log('Google sign up error:', err);
            if (!err.message?.includes('cancelled')) {
                setError('Google registratie mislukt. Probeer het opnieuw.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [googleOAuth]);

    // Verification screen
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
                            <Ionicons name="mail-open" size={48} color={colors.primary} />
                        </View>
                        <Text style={styles.title}>Verifieer je e-mail</Text>
                        <Text style={styles.subtitle}>
                            We hebben een code gestuurd naar {email}
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
                                    value={verificationCode}
                                    onChangeText={(text) => {
                                        setVerificationCode(text);
                                        setError(null);
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!isLoading}
                                    onSubmitEditing={onVerify}
                                />
                            </View>
                        </View>

                        <Pressable
                            style={[styles.signInButton, isLoading && styles.buttonDisabled]}
                            onPress={onVerify}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                                    <Text style={styles.signInButtonText}>Verifiëren</Text>
                                </>
                            )}
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
                    { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo & Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="pulse" size={48} color={colors.primary} />
                    </View>
                    <Text style={styles.title}>Account aanmaken</Text>
                    <Text style={styles.subtitle}>Begin met het monitoren van je servers</Text>
                </View>

                {/* Error Message */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color={colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Sign Up Form */}
                <View style={styles.form}>
                    {/* Name Row */}
                    <View style={styles.nameRow}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Voornaam</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, { paddingLeft: 14 }]}
                                    placeholder="John"
                                    placeholderTextColor={colors.muted}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    autoCapitalize="words"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Achternaam</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, { paddingLeft: 14 }]}
                                    placeholder="Doe"
                                    placeholderTextColor={colors.muted}
                                    value={lastName}
                                    onChangeText={setLastName}
                                    autoCapitalize="words"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>E-mailadres</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={colors.muted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="je@email.com"
                                placeholderTextColor={colors.muted}
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    setError(null);
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Wachtwoord</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.muted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Minimaal 8 tekens"
                                placeholderTextColor={colors.muted}
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setError(null);
                                }}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                editable={!isLoading}
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

                    {/* Sign Up Button */}
                    <Pressable
                        style={[styles.signInButton, isLoading && styles.buttonDisabled]}
                        onPress={onSignUp}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="person-add-outline" size={20} color="#ffffff" />
                                <Text style={styles.signInButtonText}>Account aanmaken</Text>
                            </>
                        )}
                    </Pressable>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>of</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Google Sign Up */}
                    {googleOAuth && (
                        <Pressable
                            style={[styles.socialButton, isLoading && styles.buttonDisabled]}
                            onPress={onGoogleSignUp}
                            disabled={isLoading}
                        >
                            <Ionicons name="logo-google" size={20} color={colors.foreground} />
                            <Text style={styles.socialButtonText}>Doorgaan met Google</Text>
                        </Pressable>
                    )}
                </View>

                {/* Sign In Link */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Al een account? </Text>
                    <Link href="/(auth)/sign-in" asChild>
                        <Pressable>
                            <Text style={styles.footerLink}>Inloggen</Text>
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
        width: 88,
        height: 88,
        borderRadius: 22,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
        borderWidth: 1,
        borderColor: colors.border,
    },
    title: {
        fontSize: 28,
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
        backgroundColor: colors.errorMuted,
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
    },
    form: {
        gap: 18,
    },
    nameRow: {
        flexDirection: 'row',
        gap: 12,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.foreground,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: colors.foreground,
    },
    eyeButton: {
        padding: 6,
    },
    signInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
        marginTop: 8,
    },
    signInButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
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
        gap: 10,
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

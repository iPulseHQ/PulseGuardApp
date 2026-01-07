import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Storage keys
const SECURITY_SETTINGS_KEY = 'pulseguard_security_settings';

// Types
export interface SecuritySettings {
    biometricEnabled: boolean;
    autoLockEnabled: boolean;
    autoLockTimeout: number; // in minutes
    lastActiveTime: number | null;
}

export interface BiometricState {
    isAvailable: boolean;
    biometricTypes: LocalAuthentication.AuthenticationType[];
    isEnrolled: boolean;
}

interface SecurityContextType {
    // Settings
    settings: SecuritySettings;
    updateSettings: (updates: Partial<SecuritySettings>) => Promise<void>;

    // Biometric state
    biometricState: BiometricState;
    checkBiometricAvailability: () => Promise<void>;

    // Authentication
    isLocked: boolean;
    authenticate: () => Promise<boolean>;
    lock: () => void;
    unlock: () => void;

    // Loading state
    isLoading: boolean;
}

const defaultSettings: SecuritySettings = {
    biometricEnabled: false,
    autoLockEnabled: false,
    autoLockTimeout: 5,
    lastActiveTime: null,
};

const defaultBiometricState: BiometricState = {
    isAvailable: false,
    biometricTypes: [],
    isEnrolled: false,
};

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
    const [biometricState, setBiometricState] = useState<BiometricState>(defaultBiometricState);
    const [isLocked, setIsLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load settings from secure storage
    useEffect(() => {
        loadSettings();
        checkBiometricAvailability();
    }, []);

    const loadSettings = async () => {
        try {
            const stored = await SecureStore.getItemAsync(SECURITY_SETTINGS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as SecuritySettings;
                setSettings(parsed);

                // Check if we should lock the app based on auto-lock settings
                if (parsed.autoLockEnabled && parsed.lastActiveTime) {
                    const elapsed = Date.now() - parsed.lastActiveTime;
                    const timeoutMs = parsed.autoLockTimeout * 60 * 1000;
                    if (elapsed > timeoutMs && parsed.biometricEnabled) {
                        setIsLocked(true);
                    }
                }
            }
        } catch (error) {
            console.error('[Security] Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async (newSettings: SecuritySettings) => {
        try {
            await SecureStore.setItemAsync(
                SECURITY_SETTINGS_KEY,
                JSON.stringify(newSettings)
            );
        } catch (error) {
            console.error('[Security] Failed to save settings:', error);
        }
    };

    const updateSettings = async (updates: Partial<SecuritySettings>) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        await saveSettings(newSettings);
    };

    const checkBiometricAvailability = async () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:108',message:'checkBiometricAvailability started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        try {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:111',message:'Calling LocalAuthentication.hasHardwareAsync',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:111',message:'LocalAuthentication.hasHardwareAsync completed',data:{hasHardware},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:112',message:'Calling LocalAuthentication.isEnrolledAsync',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:112',message:'LocalAuthentication.isEnrolledAsync completed',data:{isEnrolled},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:113',message:'Calling LocalAuthentication.supportedAuthenticationTypesAsync',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion
            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:113',message:'LocalAuthentication.supportedAuthenticationTypesAsync completed',data:{supportedTypes},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion

            setBiometricState({
                isAvailable: hasHardware,
                biometricTypes: supportedTypes,
                isEnrolled,
            });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:108',message:'checkBiometricAvailability completed successfully',data:{hasHardware,isEnrolled,supportedTypesCount:supportedTypes.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion
        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:120',message:'checkBiometricAvailability failed',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion
            console.error('[Security] Failed to check biometric availability:', error);
            // Set safe defaults on error
            setBiometricState(defaultBiometricState);
        }
    };

    const authenticate = useCallback(async (): Promise<boolean> => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:124',message:'authenticate called',data:{biometricEnabled:settings.biometricEnabled,isAvailable:biometricState.isAvailable},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion

        if (!settings.biometricEnabled || !biometricState.isAvailable) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:125',message:'authenticate early return - biometric not enabled or not available',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion
            return true;
        }

        try {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:130',message:'Calling LocalAuthentication.authenticateAsync',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Ontgrendel PulseGuard',
                fallbackLabel: 'Gebruik wachtwoord',
                cancelLabel: 'Annuleren',
                disableDeviceFallback: false,
            });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:130',message:'LocalAuthentication.authenticateAsync completed',data:{success:result.success},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion

            if (result.success) {
                setIsLocked(false);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:138',message:'Authentication successful, updating settings',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
                // #endregion
                await updateSettings({ lastActiveTime: Date.now() });
                return true;
            }

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:143',message:'Authentication failed - result.success is false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion
            return false;
        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/SecurityContext.tsx:145',message:'Authentication threw exception',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H1'})}).catch(()=>{});
            // #endregion
            console.error('[Security] Authentication failed:', error);
            return false;
        }
    }, [settings.biometricEnabled, biometricState.isAvailable]);

    const lock = useCallback(() => {
        if (settings.biometricEnabled) {
            setIsLocked(true);
        }
    }, [settings.biometricEnabled]);

    const unlock = useCallback(() => {
        setIsLocked(false);
        updateSettings({ lastActiveTime: Date.now() });
    }, []);

    // Update last active time periodically
    useEffect(() => {
        if (!isLocked && settings.autoLockEnabled) {
            const interval = setInterval(() => {
                updateSettings({ lastActiveTime: Date.now() });
            }, 30000); // Every 30 seconds

            return () => clearInterval(interval);
        }
    }, [isLocked, settings.autoLockEnabled]);

    return (
        <SecurityContext.Provider
            value={{
                settings,
                updateSettings,
                biometricState,
                checkBiometricAvailability,
                isLocked,
                authenticate,
                lock,
                unlock,
                isLoading,
            }}
        >
            {children}
        </SecurityContext.Provider>
    );
}

export function useSecurity() {
    const context = useContext(SecurityContext);
    if (context === undefined) {
        throw new Error('useSecurity must be used within a SecurityProvider');
    }
    return context;
}

/**
 * Helper function to get biometric type name in Dutch
 */
export function getBiometricTypeName(types: LocalAuthentication.AuthenticationType[]): string {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Touch ID / Vingerafdruk';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris Scanner';
    }
    return 'Biometrische authenticatie';
}

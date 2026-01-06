import { useAuth } from '@clerk/clerk-expo';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.ipulse.one';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10);

// Suppress noisy logs in development
const DEBUG = __DEV__ && true; // Set to true to enable debug logs

/**
 * Creates an axios instance configured for PulseGuard API
 */
export const createApiClient = (): AxiosInstance => {
    const client = axios.create({
        baseURL: API_URL,
        timeout: API_TIMEOUT,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });

    return client;
};

/**
 * Hook to get an authenticated API client
 * Automatically adds the Clerk JWT token to requests
 */
export const useApiClient = () => {
    const { getToken, isSignedIn } = useAuth();

    const client = createApiClient();

    // Add auth interceptor
    client.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
            // Only try to get token if user is signed in
            if (!isSignedIn) {
                return config;
            }

            try {
                const token = await getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (error) {
                if (DEBUG) console.log('[API] Failed to get auth token');
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Add response interceptor for error handling
    client.interceptors.response.use(
        (response) => {
            if (DEBUG) console.log(`[API] Success ${response.config.method?.toUpperCase()} ${response.config.url}`);
            return response;
        },
        (error) => {
            const url = error.config?.url || 'unknown';
            const method = error.config?.method?.toUpperCase() || 'UNKNOWN';

            if (error.response) {
                const { status } = error.response;

                if (DEBUG) {
                    console.log(`[API] Error ${status} ${method} ${url}`);
                    if (status === 401) {
                        console.log('[API] Unauthorized - Token may be expired');
                    } else if (status === 403) {
                        console.log('[API] Forbidden - Access denied');
                    } else if (status === 404) {
                        console.log(`[API] Not found: ${url}`);
                    } else if (status >= 500) {
                        console.log(`[API] Server error (${status}): ${url}`);
                    }
                }
            } else if (error.request && DEBUG) {
                console.log(`[API] Network error - No response received from ${method} ${url}`);
            } else if (DEBUG) {
                console.log(`[API] Error: ${error.message}`);
            }

            return Promise.reject(error);
        }
    );

    return client;
};

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
    // Dashboard
    DASHBOARD_STATS: '/dashboard/stats',

    // Domains
    DOMAINS: '/api/domains',
    DOMAIN: (uuid: string) => `/api/domains/${uuid}`,
    DOMAIN_CHECKS: (uuid: string) => `/api/domains/${uuid}/checks`,

    // Incidents
    INCIDENTS: '/incidents',
    INCIDENT: (uuid: string) => `/incidents/${uuid}`,
    INCIDENT_ACKNOWLEDGE: (uuid: string) => `/incidents/${uuid}/acknowledge`,
    INCIDENT_RESOLVE: (uuid: string) => `/incidents/${uuid}/resolve`,

    // Notifications
    NOTIFICATIONS: '/notifications/in-app',
    NOTIFICATION_SETTINGS: '/notifications/preferences',
    EXPO_PUSH_TOKEN: '/expo-push-token',

    // Reports
    REPORTS_SUMMARY: '/api/reports/summary',
    REPORTS_SHARE: '/api/reports/share',

    // Security
    SECURITY_SUMMARY: '/security/summary',
    SECURITY_DOMAIN: (uuid: string) => `/security/domain/${uuid}`,
    SECURITY_SCAN: (uuid: string) => `/security/scan/${uuid}`,
    SECURITY_RECOMMENDATIONS: (uuid: string) => `/security/recommendations/${uuid}`,
    SECURITY_SHARE: '/security/reports/share',

    // User
    USER_PROFILE: '/users/me',
    USER_SETTINGS: '/users/me/settings',
} as const;

export default createApiClient;

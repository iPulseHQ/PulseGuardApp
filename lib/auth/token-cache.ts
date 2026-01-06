import { TokenCache } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Token cache implementation for Clerk authentication
 * Uses expo-secure-store for native platforms and localStorage for web
 */

const createTokenCache = (): TokenCache => {
    return {
        async getToken(key: string) {
            try {
                if (Platform.OS === 'web') {
                    return localStorage.getItem(key);
                }
                const item = await SecureStore.getItemAsync(key);
                if (item) {
                    console.log(`[TokenCache] Retrieved token for key: ${key.substring(0, 10)}...`);
                }
                return item;
            } catch (error) {
                console.error('[TokenCache] Error getting token:', error);
                return null;
            }
        },
        async saveToken(key: string, token: string) {
            try {
                if (Platform.OS === 'web') {
                    localStorage.setItem(key, token);
                    return;
                }
                await SecureStore.setItemAsync(key, token);
                console.log(`[TokenCache] Saved token for key: ${key.substring(0, 10)}...`);
            } catch (error) {
                console.error('[TokenCache] Error saving token:', error);
            }
        },
        async clearToken(key: string) {
            try {
                if (Platform.OS === 'web') {
                    localStorage.removeItem(key);
                    return;
                }
                await SecureStore.deleteItemAsync(key);
                console.log(`[TokenCache] Cleared token for key: ${key.substring(0, 10)}...`);
            } catch (error) {
                console.error('[TokenCache] Error clearing token:', error);
            }
        },
    };
};

export const tokenCache = createTokenCache();

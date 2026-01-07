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
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:12',message:'getToken called',data:{key:key.substring(0,10)+'...',platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
            // #endregion
            try {
                if (Platform.OS === 'web') {
                    const result = localStorage.getItem(key);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:15',message:'getToken from localStorage completed',data:{hasToken:result ? 'yes' : 'no'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
                    // #endregion
                    return result;
                }
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:18',message:'Calling SecureStore.getItemAsync',data:{key:key.substring(0,10)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
                // #endregion
                const item = await SecureStore.getItemAsync(key);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:18',message:'SecureStore.getItemAsync completed',data:{hasToken:item ? 'yes' : 'no'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
                // #endregion
                if (item) {
                    console.log(`[TokenCache] Retrieved token for key: ${key.substring(0, 10)}...`);
                }
                return item;
            } catch (error) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:23',message:'getToken failed',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
                // #endregion
                console.error('[TokenCache] Error getting token:', error);
                return null;
            }
        },
        async saveToken(key: string, token: string) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:27',message:'saveToken called',data:{key:key.substring(0,10)+'...',platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
            // #endregion
            try {
                if (Platform.OS === 'web') {
                    localStorage.setItem(key, token);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:30',message:'saveToken to localStorage completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
                    // #endregion
                    return;
                }
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:33',message:'Calling SecureStore.setItemAsync',data:{key:key.substring(0,10)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
                // #endregion
                await SecureStore.setItemAsync(key, token);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:33',message:'SecureStore.setItemAsync completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
                // #endregion
                console.log(`[TokenCache] Saved token for key: ${key.substring(0, 10)}...`);
            } catch (error) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:37',message:'saveToken failed',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
                // #endregion
                console.error('[TokenCache] Error saving token:', error);
            }
        },
        async clearToken(key: string) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:40',message:'clearToken called',data:{key:key.substring(0,10)+'...',platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
            // #endregion
            try {
                if (Platform.OS === 'web') {
                    localStorage.removeItem(key);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:43',message:'clearToken from localStorage completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
                    // #endregion
                    return;
                }
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:46',message:'Calling SecureStore.deleteItemAsync',data:{key:key.substring(0,10)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
                // #endregion
                await SecureStore.deleteItemAsync(key);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:46',message:'SecureStore.deleteItemAsync completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
                // #endregion
                console.log(`[TokenCache] Cleared token for key: ${key.substring(0, 10)}...`);
            } catch (error) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth/token-cache.ts:50',message:'clearToken failed',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H5'})}).catch(()=>{});
                // #endregion
                console.error('[TokenCache] Error clearing token:', error);
            }
        },
    };
};

export const tokenCache = createTokenCache();

import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface OrganizationContextType {
    activeOrganizationId: string | null;
    setActiveOrganizationId: (id: string | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const STORAGE_KEY = 'pulseguard_active_org_id';

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(null);

    useEffect(() => {
        // Load the saved organization ID on mount
        const loadOrgId = async () => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:16',message:'loadOrgId started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
            // #endregion
            try {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:20',message:'Calling SecureStore.getItemAsync',data:{key:STORAGE_KEY},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
                // #endregion
                const savedId = await SecureStore.getItemAsync(STORAGE_KEY);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:20',message:'SecureStore.getItemAsync completed',data:{savedId:savedId ? 'present' : 'null'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
                // #endregion
                if (savedId) {
                    setActiveOrganizationIdState(savedId);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:22',message:'setActiveOrganizationIdState called',data:{savedId},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
                    // #endregion
                }
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:16',message:'loadOrgId completed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
                // #endregion
            } catch (error) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:25',message:'loadOrgId failed',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
                // #endregion
                console.error('Failed to load active organization ID:', error);
            }
        };

        loadOrgId();
    }, []);

    const setActiveOrganizationId = async (id: string | null) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:32',message:'setActiveOrganizationId called',data:{id:id ? 'present' : 'null'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        try {
            if (id) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:35',message:'Calling SecureStore.setItemAsync',data:{key:STORAGE_KEY},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
                // #endregion
                await SecureStore.setItemAsync(STORAGE_KEY, id);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:35',message:'SecureStore.setItemAsync completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
                // #endregion
            } else {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:37',message:'Calling SecureStore.deleteItemAsync',data:{key:STORAGE_KEY},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
                // #endregion
                await SecureStore.deleteItemAsync(STORAGE_KEY);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:37',message:'SecureStore.deleteItemAsync completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
                // #endregion
            }
            setActiveOrganizationIdState(id);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:39',message:'setActiveOrganizationIdState called',data:{id:id ? 'present' : 'null'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
            // #endregion
        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4cd5b07-3157-4f6f-8572-b7af77d6e870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'context/OrganizationContext.tsx:41',message:'setActiveOrganizationId failed',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H4'})}).catch(()=>{});
            // #endregion
            console.error('Failed to save active organization ID:', error);
        }
    };

    return (
        <OrganizationContext.Provider value={{ activeOrganizationId, setActiveOrganizationId }}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganizationContext() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganizationContext must be used within an OrganizationProvider');
    }
    return context;
}

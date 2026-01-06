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
            try {
                const savedId = await SecureStore.getItemAsync(STORAGE_KEY);
                if (savedId) {
                    setActiveOrganizationIdState(savedId);
                }
            } catch (error) {
                console.error('Failed to load active organization ID:', error);
            }
        };

        loadOrgId();
    }, []);

    const setActiveOrganizationId = async (id: string | null) => {
        try {
            if (id) {
                await SecureStore.setItemAsync(STORAGE_KEY, id);
            } else {
                await SecureStore.deleteItemAsync(STORAGE_KEY);
            }
            setActiveOrganizationIdState(id);
        } catch (error) {
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

import { API_ENDPOINTS, useApiClient } from '@/lib/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface Domain {
    id: string;
    uuid: string;
    name?: string;
    domainName?: string;
    url: string;
    status: 'up' | 'down' | 'pending' | 'paused' | 'unknown';
    monitor?: {
        uptimeStatus: 'up' | 'down' | 'pending' | 'paused' | 'unknown';
    };
    lastCheckedAt: string;
    responseTime: number | null;
    uptime: number;
    sslExpiresAt?: string;
    checkInterval: number;
    createdAt: string;
}

interface DomainDetails extends Domain {
    checks: DomainCheck[];
    incidents: DomainIncident[];
    sslInfo?: {
        issuer: string;
        validFrom: string;
        validTo: string;
        daysUntilExpiry: number;
    };
}

interface DomainCheck {
    id: string;
    status: 'up' | 'down';
    responseTime: number;
    statusCode: number;
    createdAt: string;
}

interface DomainIncident {
    id: string;
    uuid: string;
    message: string;
    createdAt: string;
    resolvedAt: string | null;
}

interface CreateDomainInput {
    name: string;
    url: string;
    checkInterval?: number;
    alertThreshold?: number;
}

interface UpdateDomainInput {
    name?: string;
    checkInterval?: number;
    alertThreshold?: number;
    isPaused?: boolean;
}

/**
 * Hook to fetch all domains
 */
export function useDomains() {
    const api = useApiClient();

    return useQuery<Domain[]>({
        queryKey: ['domains'],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.DOMAINS);
            // Backend returns paginated object { domains: [], total: ... }
            return response.data.domains || response.data;
        },
        staleTime: 1000 * 30, // 30 seconds
    });
}

/**
 * Hook to fetch a single domain by UUID
 */
export function useDomain(uuid: string) {
    const api = useApiClient();

    return useQuery<DomainDetails>({
        queryKey: ['domains', uuid],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.DOMAIN(uuid));
            return response.data;
        },
        enabled: !!uuid,
        staleTime: 1000 * 15, // 15 seconds
    });
}

/**
 * Hook to fetch domain check history
 */
export function useDomainChecks(uuid: string, limit: number = 100) {
    const api = useApiClient();

    return useQuery<DomainCheck[]>({
        queryKey: ['domains', uuid, 'checks', limit],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.DOMAIN_CHECKS(uuid), {
                params: { limit },
            });
            return response.data;
        },
        enabled: !!uuid,
        staleTime: 1000 * 30,
    });
}

/**
 * Hook to create a new domain
 */
export function useCreateDomain() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateDomainInput) => {
            const response = await api.post(API_ENDPOINTS.DOMAINS, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

/**
 * Hook to update a domain
 */
export function useUpdateDomain() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ uuid, data }: { uuid: string; data: UpdateDomainInput }) => {
            const response = await api.patch(API_ENDPOINTS.DOMAIN(uuid), data);
            return response.data;
        },
        onSuccess: (_, { uuid }) => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domains', uuid] });
        },
    });
}

/**
 * Hook to delete a domain
 */
export function useDeleteDomain() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (uuid: string) => {
            await api.delete(API_ENDPOINTS.DOMAIN(uuid));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

/**
 * Hook to pause/resume a domain
 */
export function useToggleDomainPause() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ uuid, isPaused }: { uuid: string; isPaused: boolean }) => {
            const response = await api.patch(API_ENDPOINTS.DOMAIN(uuid), { isPaused });
            return response.data;
        },
        onSuccess: (_, { uuid }) => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            queryClient.invalidateQueries({ queryKey: ['domains', uuid] });
        },
    });
}

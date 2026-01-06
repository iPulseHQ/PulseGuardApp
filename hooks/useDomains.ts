import { useOrganizationContext } from '@/context/OrganizationContext';
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
        certificateIssuer?: string;
        certificateExpirationDate?: string;
    };
    lastCheckedAt: string;
    responseTime: number | null;
    uptime: number;
    sslExpiresAt?: string;
    checkInterval: number;
    enabled: boolean;
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

export interface DomainSummary {
    domain: {
        id: string;
        uuid: string;
        url: string;
        domainName?: string;
    };
    monitor: any;
    stats: {
        totalChecks: number;
        upChecks: number;
        downChecks: number;
        uptimePercentage: number | null;
        avgResponseTime: number | null;
        p95ResponseTime: number | null;
        latestStatusCode: number | null;
        totalUptimeMinutes: number;
        totalDowntimeMinutes: number;
    };
    dns: {
        count: number;
        records: any[];
    };
    security: any;
    performance: {
        filmstrip: any;
        filmstripGeneratedAt: string | null;
        resourceTimings: any;
        resourceTimingsGeneratedAt: string | null;
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
    const { activeOrganizationId } = useOrganizationContext();

    return useQuery<Domain[]>({
        queryKey: ['domains', activeOrganizationId],
        queryFn: async () => {
            const params = activeOrganizationId ? { organization: activeOrganizationId } : {};
            const response = await api.get(API_ENDPOINTS.DOMAINS, { params });
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

/**
 * Hook to get domain summary
 */
export function useDomainSummary(uuid: string) {
    const api = useApiClient();

    return useQuery({
        queryKey: ['domains', uuid, 'summary'],
        queryFn: async () => {
            const response = await api.get<DomainSummary>(API_ENDPOINTS.DOMAIN_SUMMARY(uuid));
            return response.data;
        },
        enabled: !!uuid,
    });
}

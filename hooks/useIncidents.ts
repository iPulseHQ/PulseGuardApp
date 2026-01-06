import { API_ENDPOINTS, useApiClient } from '@/lib/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface Incident {
    id: string;
    uuid: string;
    type: string;
    title?: string;
    message: string;
    errorMessage?: string;
    createdAt: string;
    detectedAt?: string;
    resolvedAt: string | null;
    acknowledgedAt: string | null;
    status?: string;
    severity?: string;
    domain: {
        id: string;
        name: string;
        domainName?: string;
        url: string;
    };
}

type FilterType = 'all' | 'active' | 'resolved';

/**
 * Hook to fetch incidents with optional filter
 */
export function useIncidents(filter: FilterType = 'all') {
    const api = useApiClient();

    return useQuery<Incident[]>({
        queryKey: ['incidents', filter],
        queryFn: async () => {
            const params: Record<string, string | boolean | number> = {};

            if (filter === 'active') {
                params.status = 'open';
            } else if (filter === 'resolved') {
                params.status = 'resolved';
            }

            const response = await api.get(API_ENDPOINTS.INCIDENTS, { params });
            const data = response.data.incidents || response.data;

            if (!Array.isArray(data)) return [];

            return data.map((i: any) => ({
                ...i,
                uuid: i.uuid || i.id,
                message: i.title || i.errorMessage || i.message || 'Systeem incident',
                createdAt: i.createdAt || i.detectedAt,
                acknowledgedAt: i.status === 'investigating' ? new Date().toISOString() : i.acknowledgedAt,
                domain: {
                    ...i.domain,
                    name: i.domain?.domainName || i.domain?.name || i.domain?.url || 'Onbekend'
                }
            }));
        },
        staleTime: 1000 * 30, // 30 seconds
    });
}

/**
 * Hook to fetch a single incident by UUID
 */
export function useIncident(uuid: string) {
    const api = useApiClient();

    return useQuery<Incident>({
        queryKey: ['incidents', uuid],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.INCIDENT(uuid));
            const i = response.data;
            return {
                ...i,
                uuid: i.uuid || i.id,
                message: i.title || i.errorMessage || i.message || 'Systeem incident',
                createdAt: i.createdAt || i.detectedAt,
                acknowledgedAt: i.status === 'investigating' ? new Date().toISOString() : i.acknowledgedAt,
                domain: {
                    ...i.domain,
                    name: i.domain?.domainName || i.domain?.name || i.domain?.url || 'Onbekend'
                }
            };
        },
        enabled: !!uuid,
    });
}

/**
 * Hook to get the count of active incidents for badge display
 */
export function useIncidentBadgeCount() {
    const api = useApiClient();

    const { data, ...rest } = useQuery<{ count: number }>({
        queryKey: ['incidents', 'badge-count'],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.INCIDENTS, {
                params: { status: 'open', limit: 1 },
            });

            // Handle paginated response
            if (response.data?.pagination) {
                return { count: response.data.pagination.total };
            }
            if (Array.isArray(response.data)) {
                return { count: response.data.length };
            }
            return { count: response.data?.count || 0 };
        },
        staleTime: 1000 * 60, // 1 minute
        refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
    });

    return { count: data?.count || 0, ...rest };
}

/**
 * Hook to acknowledge an incident
 */
export function useAcknowledgeIncident() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (uuid: string) => {
            // Backend doesn't have a dedicated acknowledge endpoint, so we update status
            const response = await api.put(API_ENDPOINTS.INCIDENT(uuid), { status: 'investigating' });
            return response.data;
        },
        onSuccess: (_, uuid) => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            queryClient.invalidateQueries({ queryKey: ['incidents', uuid] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

/**
 * Hook to resolve an incident
 */
export function useResolveIncident() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (uuid: string) => {
            const response = await api.put(`${API_ENDPOINTS.INCIDENT(uuid)}/resolve`);
            return response.data;
        },
        onSuccess: (_, uuid) => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            queryClient.invalidateQueries({ queryKey: ['incidents', uuid] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

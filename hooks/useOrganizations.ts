import { API_ENDPOINTS, useApiClient } from '@/lib/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    role: 'ADMIN' | 'MEMBER' | 'OWNER';
}

export function useOrganizations() {
    const api = useApiClient();

    return useQuery<Organization[]>({
        queryKey: ['organizations'],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.ORGANIZATIONS);
            return response.data;
        },
    });
}

export function useOrganization(id?: string) {
    const api = useApiClient();

    return useQuery<Organization>({
        queryKey: ['organizations', id],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.ORGANIZATION(id!));
            return response.data;
        },
        enabled: !!id,
    });
}

export function useSyncOrganizations() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (force: boolean = false) => {
            const response = await api.post(API_ENDPOINTS.ORGANIZATION_SYNC, null, {
                params: { force: force.toString() }
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
        },
    });
}

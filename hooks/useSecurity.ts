import { API_ENDPOINTS, useApiClient } from '@/lib/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useSecuritySummary() {
    const api = useApiClient();

    return useQuery({
        queryKey: ['security', 'summary'],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.SECURITY_SUMMARY);
            return response.data;
        },
    });
}

export function useDomainSecurity(domainId: string) {
    const api = useApiClient();

    return useQuery({
        queryKey: ['security', 'domain', domainId],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.SECURITY_DOMAIN(domainId));
            return response.data;
        },
        enabled: !!domainId,
    });
}

export function useScanDomainSecurity() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (domainId: string) => {
            const response = await api.post(API_ENDPOINTS.SECURITY_SCAN(domainId));
            return response.data;
        },
        onSuccess: (_, domainId) => {
            queryClient.invalidateQueries({ queryKey: ['security', 'domain', domainId] });
        },
    });
}

import { API_ENDPOINTS, useApiClient } from '@/lib/api/client';
import { useMutation, useQuery } from '@tanstack/react-query';

export function useReportsSummary() {
    const api = useApiClient();

    return useQuery({
        queryKey: ['reports', 'summary'],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.REPORTS_SUMMARY);
            return response.data;
        },
    });
}

export function useShareReport() {
    const api = useApiClient();

    return useMutation({
        mutationFn: async (expiration: string = '7days') => {
            const response = await api.post(API_ENDPOINTS.REPORTS_SHARE, { expiration });
            return response.data;
        },
    });
}

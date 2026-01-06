import { API_ENDPOINTS, useApiClient } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
    totalDomains: number;
    onlineDomains: number;
    offlineDomains: number;
    pausedDomains: number;
    averageUptime: number;
    averageResponseTime: number;
    activeIncidents: number;
    checksToday: number;
}

interface RecentIncident {
    id: string;
    uuid: string;
    message: string;
    resolved: boolean;
    createdAt: string;
    domain: {
        id: string;
        name: string;
        url: string;
    };
}

interface DashboardData {
    stats: DashboardStats;
    recentIncidents: RecentIncident[];
}

/**
 * Hook to fetch dashboard statistics and recent incidents
 */
export function useDashboardStats() {
    const api = useApiClient();

    return useQuery<DashboardData>({
        queryKey: ['dashboard', 'stats'],
        queryFn: async () => {
            // Fetch stats and incidents in parallel, but handle failures gracefully
            const results = await Promise.allSettled([
                api.get(API_ENDPOINTS.DASHBOARD_STATS),
                api.get(API_ENDPOINTS.INCIDENTS, { params: { limit: 5 } })
            ]);

            const statsRes = results[0].status === 'fulfilled' ? results[0].value : null;
            const incidentsRes = results[1].status === 'fulfilled' ? results[1].value : null;

            // If both failed, we can't show anything
            if (!statsRes && !incidentsRes) {
                throw new Error('Could not fetch dashboard data');
            }

            const backendStats = statsRes?.data || {};
            const incidentData = incidentsRes?.data || {};

            // Map backend stats to mobile app DashboardStats
            const stats: DashboardStats = {
                totalDomains: backendStats.domains?.total || 0,
                onlineDomains: backendStats.domains?.up || 0,
                offlineDomains: backendStats.domains?.down || 0,
                pausedDomains: 0,
                averageUptime: backendStats.domains?.uptime || 100,
                averageResponseTime: backendStats.performance?.avgResponseTime || 0,
                activeIncidents: backendStats.incidents?.active || 0,
                checksToday: 0,
            };

            // Map incidents
            const incidentsList = Array.isArray(incidentData) ? incidentData : (incidentData.incidents || []);
            const incidents = incidentsList.map((i: any) => ({
                id: i.id,
                uuid: i.uuid || i.id,
                message: i.title || i.errorMessage || i.message || 'Systeem incident',
                resolved: i.status === 'resolved' || i.status === 'closed' || !!i.resolvedAt,
                createdAt: i.createdAt || i.detectedAt,
                domain: {
                    id: i.domain?.id,
                    name: i.domain?.domainName || i.domain?.name || i.domain?.url || 'Domein',
                    url: i.domain?.url || '',
                }
            }));

            return {
                stats,
                recentIncidents: incidents,
            };
        },
        staleTime: 1000 * 30, // 30 seconds
        refetchInterval: 1000 * 60, // Refetch every minute
    });
}

/**
 * Hook to get uptime statistics for a specific time range
 */
export function useUptimeStats(days: number = 30) {
    const api = useApiClient();

    return useQuery({
        queryKey: ['dashboard', 'uptime', days],
        queryFn: async () => {
            const response = await api.get(`${API_ENDPOINTS.DASHBOARD_STATS}/uptime`, {
                params: { days },
            });
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

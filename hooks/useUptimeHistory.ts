import { useOrganizationContext } from '@/context/OrganizationContext';
import { useApiClient } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';

// Types for Uptime History
export interface UptimeDataPoint {
    date: string;
    uptime: number;
    downtime: number;
    checks: number;
    avgResponseTime: number;
}

export interface UptimeHistoryResponse {
    domain: {
        id: string;
        uuid: string;
        url: string;
        domainName?: string;
    };
    period: {
        start: string;
        end: string;
        days: number;
    };
    summary: {
        overallUptime: number;
        totalChecks: number;
        upChecks: number;
        downChecks: number;
        avgResponseTime: number;
        p95ResponseTime: number;
        minResponseTime: number;
        maxResponseTime: number;
    };
    daily: UptimeDataPoint[];
    hourly?: UptimeDataPoint[];
}

export interface ResponseTimeDataPoint {
    timestamp: string;
    responseTime: number;
    status: 'up' | 'down';
}

export interface ChecksHistoryResponse {
    checks: ResponseTimeDataPoint[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

// API Endpoints
const UPTIME_ENDPOINTS = {
    DOMAIN_HISTORY: (uuid: string) => `/api/domains/${uuid}/history`,
    DOMAIN_CHECKS: (uuid: string) => `/api/domains/${uuid}/checks`,
    DASHBOARD_UPTIME: '/dashboard/uptime-history',
};

/**
 * Hook to fetch domain uptime history
 */
export function useDomainUptimeHistory(uuid: string, days = 30) {
    const api = useApiClient();

    return useQuery<UptimeHistoryResponse>({
        queryKey: ['domains', uuid, 'uptime-history', days],
        queryFn: async () => {
            try {
                const response = await api.get(UPTIME_ENDPOINTS.DOMAIN_HISTORY(uuid), {
                    params: { days },
                });
                return response.data;
            } catch (error: any) {
                // Return empty data if endpoint doesn't exist (404)
                if (error?.response?.status === 404) {
                    return null;
                }
                throw error;
            }
        },
        enabled: !!uuid,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error: any) => {
            // Don't retry on 404 errors
            if (error?.response?.status === 404) {
                return false;
            }
            return failureCount < 2;
        },
    });
}

/**
 * Hook to fetch domain checks history with pagination
 */
export function useDomainChecksHistory(uuid: string, page = 1, limit = 100) {
    const api = useApiClient();

    return useQuery<ChecksHistoryResponse>({
        queryKey: ['domains', uuid, 'checks-history', page, limit],
        queryFn: async () => {
            const response = await api.get(UPTIME_ENDPOINTS.DOMAIN_CHECKS(uuid), {
                params: { page, limit },
            });
            return response.data;
        },
        enabled: !!uuid,
        staleTime: 1000 * 30, // 30 seconds
    });
}

/**
 * Hook to fetch overall uptime history for dashboard
 */
export function useDashboardUptimeHistory(days = 7) {
    const api = useApiClient();
    const { activeOrganizationId } = useOrganizationContext();

    return useQuery<{
        period: { start: string; end: string; days: number };
        daily: Array<{
            date: string;
            uptime: number;
            totalDomains: number;
            domainsUp: number;
            domainsDown: number;
        }>;
    }>({
        queryKey: ['dashboard', 'uptime-history', days, activeOrganizationId],
        queryFn: async () => {
            const params: any = { days };
            if (activeOrganizationId) {
                params.organizationId = activeOrganizationId;
            }
            const response = await api.get(UPTIME_ENDPOINTS.DASHBOARD_UPTIME, { params });
            return response.data;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

/**
 * Helper function to calculate uptime percentage from data points
 */
export function calculateUptimePercentage(data: UptimeDataPoint[]): number {
    if (!data || data.length === 0) return 100;

    const totalChecks = data.reduce((sum, d) => sum + d.checks, 0);
    const upChecks = data.reduce((sum, d) => sum + (d.uptime * d.checks / 100), 0);

    return totalChecks > 0 ? (upChecks / totalChecks) * 100 : 100;
}

/**
 * Helper function to format uptime data for charts
 */
export function formatUptimeForChart(data: UptimeDataPoint[]): {
    labels: string[];
    uptimeData: number[];
    responseTimeData: number[];
} {
    const sortedData = [...data].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
        labels: sortedData.map(d => {
            const date = new Date(d.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        }),
        uptimeData: sortedData.map(d => d.uptime),
        responseTimeData: sortedData.map(d => d.avgResponseTime),
    };
}

/**
 * Get uptime status color based on percentage
 */
export function getUptimeStatusColor(uptime: number): string {
    if (uptime >= 99.9) return '#22c55e'; // Green
    if (uptime >= 99) return '#84cc16'; // Lime
    if (uptime >= 95) return '#f59e0b'; // Amber
    if (uptime >= 90) return '#f97316'; // Orange
    return '#ef4444'; // Red
}

/**
 * Format duration in human readable format
 */
export function formatDuration(minutes: number): string {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;

    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours < 24) {
        return mins > 0 ? `${hours}u ${mins}m` : `${hours}u`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return remainingHours > 0 ? `${days}d ${remainingHours}u` : `${days}d`;
}

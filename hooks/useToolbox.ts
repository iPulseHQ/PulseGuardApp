import { useApiClient } from '@/lib/api/client';
import { useMutation, useQuery } from '@tanstack/react-query';

// Types for DNS Scanner
export interface DNSRecord {
    type: string;
    name: string;
    value: string;
    ttl?: number;
    priority?: number;
}

export interface DNSScanResult {
    domain: string;
    records: DNSRecord[];
    nameservers?: string[];
    scanTime: number;
}

// Types for IP Scanner
export interface IPScanResult {
    ip: string;
    hostname?: string;
    organization?: string;
    asn?: string;
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
    timezone?: string;
    loc?: string;
    postal?: string;
    isp?: string;
    isVPN?: boolean;
    isProxy?: boolean;
    isTor?: boolean;
    isHosting?: boolean;
}

export interface MyIPResult extends IPScanResult {
    ip: string;
}

// Types for Port Scanner
export interface PortResult {
    port: number;
    status: 'open' | 'closed' | 'filtered';
    service?: string;
    protocol: 'tcp' | 'udp';
    responseTime?: number;
}

export interface PortScanProgress {
    type: 'progress';
    progress: number;
}

export interface PortScanResult {
    type: 'result';
    results: {
        target: string;
        ports: PortResult[];
        scanTime: number;
        openPorts: number;
        closedPorts: number;
        filteredPorts: number;
    };
}

// API Endpoints
const TOOLBOX_ENDPOINTS = {
    DNS_SCANNER: '/api/toolbox/dns-scanner',
    IP_SCANNER: '/api/toolbox/ip-scanner',
    IP_MY_IP: '/api/toolbox/ip-scanner/my-ip',
    PORT_SCANNER: '/api/toolbox/port-scanner',
};

/**
 * Hook to perform DNS scan
 */
export function useDNSScanner() {
    const api = useApiClient();

    return useMutation<DNSScanResult, Error, string>({
        mutationFn: async (domain: string) => {
            const response = await api.post(TOOLBOX_ENDPOINTS.DNS_SCANNER, { domain });
            return response.data;
        },
    });
}

/**
 * Hook to perform IP scan/lookup
 */
export function useIPScanner() {
    const api = useApiClient();

    return useMutation<IPScanResult, Error, string>({
        mutationFn: async (ip: string) => {
            const response = await api.post(TOOLBOX_ENDPOINTS.IP_SCANNER, { ip });
            return response.data;
        },
    });
}

/**
 * Hook to get my IP information
 */
export function useMyIP() {
    const api = useApiClient();

    return useQuery<MyIPResult>({
        queryKey: ['toolbox', 'my-ip'],
        queryFn: async () => {
            // First get the client's IP using a public API
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const { ip } = await ipResponse.json();

            // Then get detailed info from our backend
            const response = await api.post(TOOLBOX_ENDPOINTS.IP_MY_IP, { ip });
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
    });
}

/**
 * Hook to perform port scan
 * Note: Port scanning returns streaming NDJSON, handled differently
 */
export function usePortScanner() {
    const api = useApiClient();

    return useMutation<PortScanResult['results'], Error, {
        target: string;
        scanType: 'quick' | 'common' | 'full' | 'custom';
        customPorts?: string;
        protocol: 'tcp' | 'udp' | 'both';
        timeout: number;
    }>({
        mutationFn: async ({ target, scanType, customPorts, protocol, timeout }) => {
            const response = await api.post(TOOLBOX_ENDPOINTS.PORT_SCANNER, {
                target,
                scanType,
                customPorts,
                protocol,
                timeout,
            }, {
                // Disable streaming for now, just get final result
                timeout: timeout * 1000 + 60000, // Extra time for processing
            });

            // Parse NDJSON response
            const lines = response.data.split('\n').filter(Boolean);
            for (const line of lines) {
                const parsed = JSON.parse(line);
                if (parsed.type === 'result') {
                    return parsed.results;
                }
            }

            throw new Error('No result received from port scan');
        },
    });
}

// Common port services mapping
export const PORT_SERVICES: Record<number, string> = {
    20: 'FTP Data',
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    465: 'SMTPS',
    587: 'SMTP Submission',
    993: 'IMAPS',
    995: 'POP3S',
    3306: 'MySQL',
    3389: 'RDP',
    5432: 'PostgreSQL',
    5900: 'VNC',
    6379: 'Redis',
    8080: 'HTTP Proxy',
    8443: 'HTTPS Alt',
    27017: 'MongoDB',
};

/**
 * Get service name for a port
 */
export function getServiceName(port: number): string {
    return PORT_SERVICES[port] || 'Unknown';
}

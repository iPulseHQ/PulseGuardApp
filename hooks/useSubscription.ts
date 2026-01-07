import { useOrganizationContext } from '@/context/OrganizationContext';
import { useApiClient } from '@/lib/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

// Helper to adapt context for subscription hooks
function useOrganization() {
    const { activeOrganizationId } = useOrganizationContext();
    return { currentOrganization: activeOrganizationId ? { id: activeOrganizationId } : null };
}

// Types
export interface Plan {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    interval: string;
    isActive: boolean;
    limitations?: PlanLimitations;
}

export interface PlanLimitations {
    maxDomains: number;
    maxTeamMembers: number;
    checkInterval: number;
    retentionDays: number;
    smsNotifications: boolean;
    phoneNotifications: boolean;
    apiAccess: boolean;
    customStatusPage: boolean;
    prioritySupport: boolean;
}

export interface Subscription {
    id: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    status: string;
    planId: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
    plan?: Plan;
}

export interface SubscriptionData {
    user?: {
        id: string;
        email: string;
        name?: string;
        currentPlanId: string;
        paymentStatus: string;
        planExpiresAt: string | null;
        planRenewsAt: string | null;
        trialEndsAt: string | null;
    };
    organization?: {
        id: string;
        name: string;
        planId: string;
        paymentStatus: string;
        planExpiresAt: string | null;
        planRenewsAt: string | null;
        trialEndsAt: string | null;
    };
    plan: Plan;
    subscription: Subscription | null;
}

export interface Invoice {
    id: string;
    number: string;
    status: string;
    amount_due: number;
    amount_paid: number;
    currency: string;
    created: number;
    hosted_invoice_url: string;
    invoice_pdf: string;
}

export interface UsageStats {
    domains: { current: number; limit: number };
    teamMembers: { current: number; limit: number };
    apiCalls?: { current: number; limit: number };
}

// API Endpoints extension
const BILLING_ENDPOINTS = {
    SUBSCRIPTION: '/billing/subscription',
    PLANS: '/billing/plans',
    INVOICES: '/billing/stripe/invoices',
    USAGE: '/billing/usage',
    PORTAL_SESSION: '/billing/portal-session',
    CHECKOUT_SESSION: '/billing/checkout-session',
};

/**
 * Hook to get subscription data for the current user or organization
 */
export function useSubscription() {
    const api = useApiClient();
    const { currentOrganization } = useOrganization();

    return useQuery<SubscriptionData>({
        queryKey: ['subscription', currentOrganization?.id],
        queryFn: async () => {
            const params = currentOrganization?.id
                ? `?organizationId=${currentOrganization.id}`
                : '';
            const response = await api.get(`${BILLING_ENDPOINTS.SUBSCRIPTION}${params}`);
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to get all available plans
 */
export function usePlans() {
    const api = useApiClient();

    return useQuery<Plan[]>({
        queryKey: ['plans'],
        queryFn: async () => {
            const response = await api.get(BILLING_ENDPOINTS.PLANS);
            return response.data;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}

/**
 * Hook to get invoice history
 */
export function useInvoices(limit = 10) {
    const api = useApiClient();
    const { currentOrganization } = useOrganization();

    return useQuery<{ data: Invoice[] }>({
        queryKey: ['invoices', currentOrganization?.id, limit],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: String(limit) });
            if (currentOrganization?.id) {
                params.append('organizationId', currentOrganization.id);
            }
            const response = await api.get(`${BILLING_ENDPOINTS.INVOICES}?${params}`);
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to get usage statistics
 */
export function useUsageStats() {
    const api = useApiClient();
    const { currentOrganization } = useOrganization();

    return useQuery<UsageStats>({
        queryKey: ['usage', currentOrganization?.id],
        queryFn: async () => {
            const params = currentOrganization?.id
                ? `?organizationId=${currentOrganization.id}`
                : '';
            const response = await api.get(`${BILLING_ENDPOINTS.USAGE}${params}`);
            return response.data;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

/**
 * Hook to open Stripe billing portal
 */
export function useOpenBillingPortal() {
    const api = useApiClient();
    const { currentOrganization } = useOrganization();

    return useMutation({
        mutationFn: async () => {
            // Create a deep link for coming back to the app
            const returnUrl = Linking.createURL('subscription');

            const response = await api.post(BILLING_ENDPOINTS.PORTAL_SESSION, {
                organizationId: currentOrganization?.id,
                returnUrl,
            });

            if (response.data?.url) {
                // Open Stripe billing portal in browser
                await WebBrowser.openBrowserAsync(response.data.url);
            }

            return response.data;
        },
    });
}

/**
 * Hook to create a checkout session for upgrading plans
 */
export function useCreateCheckoutSession() {
    const api = useApiClient();
    const { currentOrganization } = useOrganization();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (planId: string) => {
            const successUrl = Linking.createURL('subscription?success=true');
            const cancelUrl = Linking.createURL('subscription?canceled=true');

            const response = await api.post(BILLING_ENDPOINTS.CHECKOUT_SESSION, {
                planId,
                organizationId: currentOrganization?.id,
                successUrl,
                cancelUrl,
            });

            if (response.data?.url) {
                // Open Stripe checkout in browser
                await WebBrowser.openBrowserAsync(response.data.url);
            }

            return response.data;
        },
        onSuccess: () => {
            // Invalidate subscription data after checkout
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
        },
    });
}

/**
 * Helper function to format price
 */
export function formatPrice(amount: number, currency = 'EUR'): string {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount);
}

/**
 * Helper function to format date
 */
export function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Helper function to get plan display name
 */
export function getPlanDisplayName(planId: string): string {
    const names: Record<string, string> = {
        free: 'Gratis',
        starter: 'Starter',
        professional: 'Professional',
        business: 'Business',
        enterprise: 'Enterprise',
    };
    return names[planId] || planId;
}

/**
 * Helper function to get status color
 */
export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        active: '#22c55e',
        trialing: '#3b82f6',
        past_due: '#f59e0b',
        canceled: '#ef4444',
        incomplete: '#f59e0b',
        incomplete_expired: '#ef4444',
        unpaid: '#ef4444',
    };
    return colors[status] || '#6b7280';
}

/**
 * PulseGuard Design Tokens
 * Based on the web app's dark mode colors
 */
export const colors = {
    // Backgrounds - neutral dark tones (no blue tint)
    background: '#0a0a0a',      // oklch(0.145 0 0) - main background
    card: '#171717',            // oklch(0.205 0 0) - card background  
    cardHover: '#1f1f1f',       // slightly lighter for hover states

    // Borders
    border: 'rgba(255, 255, 255, 0.1)',  // oklch(1 0 0 / 10%)
    borderLight: 'rgba(255, 255, 255, 0.15)',

    // Text
    foreground: '#fafafa',      // oklch(0.985 0 0) - primary text
    muted: '#a3a3a3',           // oklch(0.708 0 0) - muted text
    mutedForeground: '#737373', // slightly darker muted

    // Primary (brand blue)
    primary: '#3b82f6',
    primaryForeground: '#ffffff',

    // Status colors
    success: '#22c55e',
    successMuted: 'rgba(34, 197, 94, 0.1)',

    warning: '#f59e0b',
    warningMuted: 'rgba(245, 158, 11, 0.1)',

    error: '#ef4444',
    errorMuted: 'rgba(239, 68, 68, 0.1)',

    // Chart colors
    chart1: '#3b82f6',  // blue
    chart2: '#22c55e',  // green
    chart3: '#f59e0b',  // yellow
    chart4: '#8b5cf6',  // purple
    chart5: '#ef4444',  // red
} as const;

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
} as const;

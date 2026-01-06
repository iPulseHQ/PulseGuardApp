import { useIncidentBadgeCount } from '@/hooks/useIncidents';
import { Badge, Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform, } from 'react-native';

export default function TabLayout() {
    const { count: incidentCount } = useIncidentBadgeCount();

    return (
        <NativeTabs
            minimizeBehavior={Platform.OS === 'ios' ? 'onScrollDown' : undefined}
            screenOptions={{
                headerShown: false,
            }}
        >
            {/* Dashboard Tab */}
            <NativeTabs.Trigger name="index">
                <Icon
                    sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
                    drawable="ic_dashboard"
                />
                <Label>Dashboard</Label>
            </NativeTabs.Trigger>

            {/* Domains Tab */}
            <NativeTabs.Trigger name="domains">
                <Icon
                    sf={{ default: 'globe', selected: 'globe.badge.chevron.backward' }}
                    drawable="ic_domains"
                />
                <Label>Domeinen</Label>
            </NativeTabs.Trigger>

            {/* Incidents Tab */}
            <NativeTabs.Trigger name="incidents">
                <Icon
                    sf={{ default: 'exclamationmark.triangle', selected: 'exclamationmark.triangle.fill' }}
                    drawable="ic_incidents"
                />
                <Label>Incidenten</Label>
                {incidentCount > 0 && (
                    <Badge>{incidentCount > 9 ? '9+' : incidentCount.toString()}</Badge>
                )}
            </NativeTabs.Trigger>

            {/* Settings Tab */}
            <NativeTabs.Trigger name="settings">
                <Icon
                    sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
                    drawable="ic_settings"
                />
                <Label>Instellingen</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}

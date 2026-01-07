import {
    getServiceName,
    useDNSScanner,
    useIPScanner,
    useMyIP,
    usePortScanner
} from '@/hooks/useToolbox';
import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToolType = 'dns' | 'ip' | 'port' | 'myip';

export default function ToolboxScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [activeTool, setActiveTool] = useState<ToolType>('myip');
    const [domain, setDomain] = useState('');
    const [ip, setIp] = useState('');
    const [target, setTarget] = useState('');
    const [scanType, setScanType] = useState<'quick' | 'common' | 'full'>('quick');

    // Hooks
    const dnsScanner = useDNSScanner();
    const ipScanner = useIPScanner();
    const myIP = useMyIP();
    const portScanner = usePortScanner();

    const handleDNSScan = () => {
        if (!domain.trim()) {
            Alert.alert('Fout', 'Voer een domeinnaam in');
            return;
        }
        dnsScanner.mutate(domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]);
    };

    const handleIPScan = () => {
        if (!ip.trim()) {
            Alert.alert('Fout', 'Voer een IP-adres in');
            return;
        }
        ipScanner.mutate(ip.trim());
    };

    const handlePortScan = () => {
        if (!target.trim()) {
            Alert.alert('Fout', 'Voer een doel (IP of hostname) in');
            return;
        }
        portScanner.mutate({
            target: target.trim(),
            scanType,
            protocol: 'tcp',
            timeout: 5,
        });
    };

    const ToolTab = ({ type, icon, label }: { type: ToolType; icon: keyof typeof Ionicons.glyphMap; label: string }) => (
        <Pressable
            style={[styles.toolTab, activeTool === type && styles.toolTabActive]}
            onPress={() => setActiveTool(type)}
        >
            <Ionicons name={icon} size={20} color={activeTool === type ? colors.primary : colors.muted} />
            <Text style={[styles.toolTabText, activeTool === type && styles.toolTabTextActive]}>{label}</Text>
        </Pressable>
    );

    const renderMyIPSection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mijn IP Informatie</Text>

            {myIP.isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>IP-informatie ophalen...</Text>
                </View>
            ) : myIP.error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={colors.error} />
                    <Text style={styles.errorText}>Kon IP-informatie niet ophalen</Text>
                    <Pressable style={styles.retryButton} onPress={() => myIP.refetch()}>
                        <Text style={styles.retryButtonText}>Opnieuw proberen</Text>
                    </Pressable>
                </View>
            ) : myIP.data ? (
                <View style={styles.resultCard}>
                    <View style={styles.ipHighlight}>
                        <Text style={styles.ipLabel}>Jouw IP-adres</Text>
                        <Text style={styles.ipValue}>{myIP.data.ip}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoGrid}>
                        {myIP.data.city && (
                            <View style={styles.infoItem}>
                                <Ionicons name="location" size={16} color={colors.muted} />
                                <Text style={styles.infoLabel}>Locatie</Text>
                                <Text style={styles.infoValue}>{myIP.data.city}, {myIP.data.country}</Text>
                            </View>
                        )}
                        {myIP.data.isp && (
                            <View style={styles.infoItem}>
                                <Ionicons name="globe" size={16} color={colors.muted} />
                                <Text style={styles.infoLabel}>ISP</Text>
                                <Text style={styles.infoValue}>{myIP.data.isp}</Text>
                            </View>
                        )}
                        {myIP.data.organization && (
                            <View style={styles.infoItem}>
                                <Ionicons name="business" size={16} color={colors.muted} />
                                <Text style={styles.infoLabel}>Organisatie</Text>
                                <Text style={styles.infoValue}>{myIP.data.organization}</Text>
                            </View>
                        )}
                        {myIP.data.asn && (
                            <View style={styles.infoItem}>
                                <Ionicons name="server" size={16} color={colors.muted} />
                                <Text style={styles.infoLabel}>ASN</Text>
                                <Text style={styles.infoValue}>{myIP.data.asn}</Text>
                            </View>
                        )}
                        {myIP.data.timezone && (
                            <View style={styles.infoItem}>
                                <Ionicons name="time" size={16} color={colors.muted} />
                                <Text style={styles.infoLabel}>Tijdzone</Text>
                                <Text style={styles.infoValue}>{myIP.data.timezone}</Text>
                            </View>
                        )}
                    </View>

                    {/* Security indicators */}
                    <View style={styles.securitySection}>
                        <Text style={styles.securityTitle}>Beveiligingscheck</Text>
                        <View style={styles.securityGrid}>
                            <View style={[styles.securityBadge, { backgroundColor: myIP.data.isVPN ? colors.warning + '20' : colors.success + '20' }]}>
                                <Ionicons name={myIP.data.isVPN ? 'warning' : 'checkmark-circle'} size={16} color={myIP.data.isVPN ? colors.warning : colors.success} />
                                <Text style={[styles.securityBadgeText, { color: myIP.data.isVPN ? colors.warning : colors.success }]}>
                                    {myIP.data.isVPN ? 'VPN Gedetecteerd' : 'Geen VPN'}
                                </Text>
                            </View>
                            <View style={[styles.securityBadge, { backgroundColor: myIP.data.isProxy ? colors.warning + '20' : colors.success + '20' }]}>
                                <Ionicons name={myIP.data.isProxy ? 'warning' : 'checkmark-circle'} size={16} color={myIP.data.isProxy ? colors.warning : colors.success} />
                                <Text style={[styles.securityBadgeText, { color: myIP.data.isProxy ? colors.warning : colors.success }]}>
                                    {myIP.data.isProxy ? 'Proxy Gedetecteerd' : 'Geen Proxy'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            ) : null}
        </View>
    );

    const renderDNSSection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>DNS Lookup</Text>
            <Text style={styles.sectionSubtitle}>Analyseer DNS-records van een domein</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="globe-outline" size={20} color={colors.muted} />
                <TextInput
                    style={styles.input}
                    placeholder="voorbeeld.nl"
                    placeholderTextColor={colors.muted}
                    value={domain}
                    onChangeText={setDomain}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                />
            </View>

            <Pressable
                style={[styles.scanButton, dnsScanner.isPending && styles.scanButtonDisabled]}
                onPress={handleDNSScan}
                disabled={dnsScanner.isPending}
            >
                {dnsScanner.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <>
                        <Ionicons name="search" size={20} color="#ffffff" />
                        <Text style={styles.scanButtonText}>DNS Scannen</Text>
                    </>
                )}
            </Pressable>

            {dnsScanner.data && (
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>DNS Records voor {dnsScanner.data.domain}</Text>
                    <Text style={styles.resultSubtitle}>Scan tijd: {dnsScanner.data.scanTime}ms</Text>

                    {dnsScanner.data.records.map((record, index) => (
                        <View key={index} style={styles.dnsRecord}>
                            <View style={styles.dnsRecordType}>
                                <Text style={styles.dnsRecordTypeText}>{record.type}</Text>
                            </View>
                            <View style={styles.dnsRecordContent}>
                                <Text style={styles.dnsRecordValue} numberOfLines={2}>{record.value}</Text>
                                {record.ttl && <Text style={styles.dnsRecordTTL}>TTL: {record.ttl}</Text>}
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    const renderIPSection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>IP Lookup</Text>
            <Text style={styles.sectionSubtitle}>Bekijk details van een IP-adres</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="server-outline" size={20} color={colors.muted} />
                <TextInput
                    style={styles.input}
                    placeholder="8.8.8.8"
                    placeholderTextColor={colors.muted}
                    value={ip}
                    onChangeText={setIp}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="numeric"
                />
            </View>

            <Pressable
                style={[styles.scanButton, ipScanner.isPending && styles.scanButtonDisabled]}
                onPress={handleIPScan}
                disabled={ipScanner.isPending}
            >
                {ipScanner.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <>
                        <Ionicons name="search" size={20} color="#ffffff" />
                        <Text style={styles.scanButtonText}>IP Opzoeken</Text>
                    </>
                )}
            </Pressable>

            {ipScanner.data && (
                <View style={styles.resultCard}>
                    <View style={styles.ipHighlight}>
                        <Text style={styles.ipLabel}>IP-adres</Text>
                        <Text style={styles.ipValue}>{ipScanner.data.ip}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoGrid}>
                        {ipScanner.data.city && (
                            <View style={styles.infoItem}>
                                <Ionicons name="location" size={16} color={colors.muted} />
                                <Text style={styles.infoLabel}>Locatie</Text>
                                <Text style={styles.infoValue}>{ipScanner.data.city}, {ipScanner.data.country}</Text>
                            </View>
                        )}
                        {ipScanner.data.organization && (
                            <View style={styles.infoItem}>
                                <Ionicons name="business" size={16} color={colors.muted} />
                                <Text style={styles.infoLabel}>Organisatie</Text>
                                <Text style={styles.infoValue}>{ipScanner.data.organization}</Text>
                            </View>
                        )}
                        {ipScanner.data.asn && (
                            <View style={styles.infoItem}>
                                <Ionicons name="server" size={16} color={colors.muted} />
                                <Text style={styles.infoLabel}>ASN</Text>
                                <Text style={styles.infoValue}>{ipScanner.data.asn}</Text>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </View>
    );

    const renderPortSection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Port Scanner</Text>
            <Text style={styles.sectionSubtitle}>Scan open poorten van een server</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="git-network-outline" size={20} color={colors.muted} />
                <TextInput
                    style={styles.input}
                    placeholder="voorbeeld.nl of 192.168.1.1"
                    placeholderTextColor={colors.muted}
                    value={target}
                    onChangeText={setTarget}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <View style={styles.scanTypeContainer}>
                {(['quick', 'common', 'full'] as const).map((type) => (
                    <Pressable
                        key={type}
                        style={[styles.scanTypeButton, scanType === type && styles.scanTypeButtonActive]}
                        onPress={() => setScanType(type)}
                    >
                        <Text style={[styles.scanTypeText, scanType === type && styles.scanTypeTextActive]}>
                            {type === 'quick' ? 'Snel' : type === 'common' ? 'Gangbaar' : 'Volledig'}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <Pressable
                style={[styles.scanButton, portScanner.isPending && styles.scanButtonDisabled]}
                onPress={handlePortScan}
                disabled={portScanner.isPending}
            >
                {portScanner.isPending ? (
                    <>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.scanButtonText}>Scannen...</Text>
                    </>
                ) : (
                    <>
                        <Ionicons name="scan" size={20} color="#ffffff" />
                        <Text style={styles.scanButtonText}>Start Scan</Text>
                    </>
                )}
            </Pressable>

            {portScanner.data && (
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>Port Scan Resultaten</Text>
                    <Text style={styles.resultSubtitle}>
                        Target: {portScanner.data.target} | Scan tijd: {portScanner.data.scanTime}ms
                    </Text>

                    <View style={styles.portSummary}>
                        <View style={[styles.portSummaryItem, { backgroundColor: colors.success + '20' }]}>
                            <Text style={[styles.portSummaryValue, { color: colors.success }]}>{portScanner.data.openPorts}</Text>
                            <Text style={styles.portSummaryLabel}>Open</Text>
                        </View>
                        <View style={[styles.portSummaryItem, { backgroundColor: colors.error + '20' }]}>
                            <Text style={[styles.portSummaryValue, { color: colors.error }]}>{portScanner.data.closedPorts}</Text>
                            <Text style={styles.portSummaryLabel}>Gesloten</Text>
                        </View>
                        <View style={[styles.portSummaryItem, { backgroundColor: colors.warning + '20' }]}>
                            <Text style={[styles.portSummaryValue, { color: colors.warning }]}>{portScanner.data.filteredPorts}</Text>
                            <Text style={styles.portSummaryLabel}>Gefilterd</Text>
                        </View>
                    </View>

                    {portScanner.data.ports.filter(p => p.status === 'open').length > 0 && (
                        <>
                            <Text style={styles.openPortsTitle}>Open Poorten</Text>
                            {portScanner.data.ports
                                .filter(p => p.status === 'open')
                                .map((port, index) => (
                                    <View key={index} style={styles.portItem}>
                                        <View style={styles.portNumber}>
                                            <Text style={styles.portNumberText}>{port.port}</Text>
                                        </View>
                                        <View style={styles.portDetails}>
                                            <Text style={styles.portService}>{port.service || getServiceName(port.port)}</Text>
                                            <Text style={styles.portProtocol}>{port.protocol.toUpperCase()}</Text>
                                        </View>
                                        <View style={[styles.portStatus, { backgroundColor: colors.success + '20' }]}>
                                            <Text style={[styles.portStatusText, { color: colors.success }]}>Open</Text>
                                        </View>
                                    </View>
                                ))}
                        </>
                    )}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Toolbox</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
                    <ToolTab type="myip" icon="wifi" label="Mijn IP" />
                    <ToolTab type="dns" icon="globe-outline" label="DNS" />
                    <ToolTab type="ip" icon="server-outline" label="IP Lookup" />
                    <ToolTab type="port" icon="git-network-outline" label="Port Scan" />
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {activeTool === 'myip' && renderMyIPSection()}
                {activeTool === 'dns' && renderDNSSection()}
                {activeTool === 'ip' && renderIPSection()}
                {activeTool === 'port' && renderPortSection()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.card,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
    },
    tabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        paddingBottom: 12,
    },
    toolTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.card,
        gap: 8,
    },
    toolTabActive: {
        backgroundColor: colors.primary + '20',
        borderColor: colors.primary,
        borderWidth: 1,
    },
    toolTabText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.muted,
    },
    toolTabTextActive: {
        color: colors.primary,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.foreground,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: colors.muted,
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: colors.foreground,
        marginLeft: 12,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        height: 50,
        borderRadius: 12,
        gap: 8,
    },
    scanButtonDisabled: {
        opacity: 0.7,
    },
    scanButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    scanTypeContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
    },
    scanTypeButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    scanTypeButtonActive: {
        backgroundColor: colors.primary + '20',
        borderColor: colors.primary,
    },
    scanTypeText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.muted,
    },
    scanTypeTextActive: {
        color: colors.primary,
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.muted,
    },
    errorContainer: {
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.muted,
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    resultCard: {
        marginTop: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
    resultSubtitle: {
        fontSize: 12,
        color: colors.muted,
        marginTop: 4,
        marginBottom: 16,
    },
    ipHighlight: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    ipLabel: {
        fontSize: 12,
        color: colors.muted,
        marginBottom: 4,
    },
    ipValue: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 16,
    },
    infoGrid: {
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: colors.muted,
        width: 80,
    },
    infoValue: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: colors.foreground,
    },
    securitySection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    securityTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 12,
    },
    securityGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    securityBadge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    securityBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dnsRecord: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    dnsRecordType: {
        width: 50,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: colors.primary + '20',
        borderRadius: 4,
        alignItems: 'center',
        marginRight: 12,
    },
    dnsRecordTypeText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
    },
    dnsRecordContent: {
        flex: 1,
    },
    dnsRecordValue: {
        fontSize: 13,
        color: colors.foreground,
        fontFamily: 'SpaceMono',
    },
    dnsRecordTTL: {
        fontSize: 11,
        color: colors.muted,
        marginTop: 4,
    },
    portSummary: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    portSummaryItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    portSummaryValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    portSummaryLabel: {
        fontSize: 12,
        color: colors.muted,
        marginTop: 2,
    },
    openPortsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 12,
    },
    portItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    portNumber: {
        width: 60,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: colors.card,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        marginRight: 12,
    },
    portNumberText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.foreground,
    },
    portDetails: {
        flex: 1,
    },
    portService: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.foreground,
    },
    portProtocol: {
        fontSize: 11,
        color: colors.muted,
        marginTop: 2,
    },
    portStatus: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    portStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

import { useOrganizationContext } from '@/context/OrganizationContext';
import { useOrganizations, useSyncOrganizations } from '@/hooks/useOrganizations';
import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function OrganizationSwitcher({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const insets = useSafeAreaInsets();
    const { data: organizations, isLoading } = useOrganizations();
    const { activeOrganizationId, setActiveOrganizationId } = useOrganizationContext();
    const { mutate: syncOrgs, isPending: isSyncing } = useSyncOrganizations();

    const handleSelect = (id: string | null) => {
        setActiveOrganizationId(id);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <Pressable style={styles.dismissArea} onPress={onClose} />
                <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <View style={styles.grabberContainer}>
                        <View style={styles.grabber} />
                    </View>

                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Wissel Organisatie</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={20} color={colors.muted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.orgList}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.sectionLabel}>Jouw Account</Text>
                        <TouchableOpacity
                            style={[
                                styles.orgItem,
                                !activeOrganizationId && styles.orgItemActive
                            ]}
                            onPress={() => handleSelect(null)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.orgIcon, { backgroundColor: !activeOrganizationId ? colors.primary : colors.border }]}>
                                <Ionicons
                                    name="person"
                                    size={18}
                                    color={!activeOrganizationId ? '#fff' : colors.muted}
                                />
                            </View>
                            <View style={styles.orgInfo}>
                                <Text style={styles.orgName}>Persoonlijk</Text>
                                <Text style={styles.orgSlug}>Prive omgeving</Text>
                            </View>
                            {!activeOrganizationId && (
                                <Ionicons name="checkmark" size={20} color={colors.primary} />
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Organisaties</Text>
                        {isLoading ? (
                            <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
                        ) : (
                            organizations?.map((org) => (
                                <TouchableOpacity
                                    key={org.id}
                                    style={[
                                        styles.orgItem,
                                        activeOrganizationId === org.id && styles.orgItemActive
                                    ]}
                                    onPress={() => handleSelect(org.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.orgIcon, { backgroundColor: activeOrganizationId === org.id ? colors.primary : colors.border }]}>
                                        <Ionicons
                                            name="business"
                                            size={18}
                                            color={activeOrganizationId === org.id ? '#fff' : colors.muted}
                                        />
                                    </View>
                                    <View style={styles.orgInfo}>
                                        <Text style={styles.orgName}>{org.name}</Text>
                                        <Text style={styles.orgSlug}>{org.slug}</Text>
                                    </View>
                                    {activeOrganizationId === org.id && (
                                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))
                        )}

                        <TouchableOpacity
                            style={styles.syncButton}
                            onPress={() => syncOrgs(true)}
                            disabled={isSyncing}
                        >
                            {isSyncing ? (
                                <ActivityIndicator size="small" color={colors.muted} style={{ marginRight: 8 }} />
                            ) : (
                                <Ionicons name="refresh" size={16} color={colors.muted} style={{ marginRight: 8 }} />
                            )}
                            <Text style={styles.syncButtonText}>
                                {isSyncing ? 'Synchroniseren...' : 'Synchroniseer lijst'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 20,
            },
        }),
    },
    grabberContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    grabber: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
    },
    closeButton: {
        padding: 4,
        backgroundColor: colors.card,
        borderRadius: 16,
    },
    orgList: {
        padding: 20,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    orgItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    orgItemActive: {
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}05`,
    },
    orgIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orgInfo: {
        flex: 1,
        marginLeft: 12,
    },
    orgName: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.foreground,
    },
    orgSlug: {
        fontSize: 12,
        color: colors.muted,
        marginTop: 1,
    },
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        marginTop: 24,
        borderRadius: 12,
        // backgroundColor: colors.card,
        // borderWidth: 1,
        // borderColor: colors.border,
        // borderStyle: 'dashed',
    },
    syncButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.muted,
    },
});

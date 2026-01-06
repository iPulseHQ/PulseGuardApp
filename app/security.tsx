import { colors } from '@/lib/theme/colors';
import { useClerk } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SecurityScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { client } = useClerk();

    const SecurityItem = ({ icon, title, subtitle, onPress }: {
        icon: keyof typeof Ionicons.glyphMap,
        title: string,
        subtitle: string,
        onPress: () => void
    }) => (
        <Pressable style={styles.item} onPress={onPress}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={24} color={colors.primary} />
            </View>
            <View style={styles.content}>
                <Text style={styles.itemTitle}>{title}</Text>
                <Text style={styles.itemSubtitle}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Beveiliging</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Login & Toegang</Text>
                    <View style={styles.card}>
                        <SecurityItem
                            icon="key-outline"
                            title="Wachtwoord"
                            subtitle="Wijzig je wachtwoord om je account veilig te houden"
                            onPress={() => { }}
                        />
                        <SecurityItem
                            icon="shield-checkmark-outline"
                            title="Twee-factor authenticatie"
                            subtitle="Voeg een extra beveiligingslaag toe"
                            onPress={() => { }}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Beveiliging</Text>
                    <View style={styles.card}>
                        <SecurityItem
                            icon="finger-print-outline"
                            title="Biometrische Login"
                            subtitle="Gebruik Face ID of Touch ID om snel in te loggen"
                            onPress={() => { }}
                        />
                        <SecurityItem
                            icon="lock-closed-outline"
                            title="Automatisch Slot"
                            subtitle="Vergrendel de app na 5 minuten inactiviteit"
                            onPress={() => { }}
                        />
                    </View>
                </View>
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
    scrollContent: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: `${colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
    itemSubtitle: {
        fontSize: 13,
        color: colors.muted,
        marginTop: 2,
    },
});

import { useAcknowledgeIncident, useIncidents, useResolveIncident } from '@/hooks/useIncidents';
import { colors } from '@/lib/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Incident {
  id: string;
  uuid: string;
  type: string;
  title?: string;
  message: string;
  errorMessage?: string;
  createdAt: string;
  detectedAt?: string;
  resolvedAt: string | null;
  acknowledgedAt: string | null;
  status?: string;
  severity?: string;
  domain: {
    id: string;
    name: string;
    domainName?: string;
    url: string;
  };
}

type FilterType = 'all' | 'active' | 'resolved';

export default function IncidentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('active');

  const { data: incidents = [], isLoading, isRefetching, refetch } = useIncidents(filter);
  const { mutate: acknowledgeIncident } = useAcknowledgeIncident();
  const { mutate: resolveIncident } = useResolveIncident();

  const getIncidentIcon = (type: string) => {
    if (type.includes('ssl') || type.includes('certificate')) return 'shield-outline';
    if (type.includes('timeout') || type.includes('down')) return 'cloud-offline-outline';
    if (type.includes('slow') || type.includes('performance')) return 'speedometer-outline';
    return 'warning-outline';
  };

  const getIncidentColor = (type: string) => {
    if (type.includes('ssl') || type.includes('certificate')) return colors.chart4;
    if (type.includes('timeout') || type.includes('down')) return colors.error;
    if (type.includes('slow') || type.includes('performance')) return colors.warning;
    return colors.error;
  };

  const FilterButton = ({ type, label }: { type: FilterType; label: string }) => (
    <Pressable
      style={[styles.filterButton, filter === type && styles.filterButtonActive]}
      onPress={() => setFilter(type)}
    >
      <Text style={[styles.filterButtonText, filter === type && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );

  const renderIncidentItem = ({ item }: { item: Incident }) => {
    const isResolved = !!item.resolvedAt;
    const isAcknowledged = !!item.acknowledgedAt;

    return (
      <Pressable
        style={styles.incidentCard}
        onPress={() => router.push(`/incident/${item.uuid}` as any)}
      >
        <View style={styles.incidentHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${getIncidentColor(item.type)}15` }]}>
            <Ionicons
              name={getIncidentIcon(item.type) as any}
              size={24}
              color={getIncidentColor(item.type)}
            />
          </View>
          <View style={styles.incidentInfo}>
            <Text style={styles.incidentDomain}>{item.domain?.name || 'Onbekend'}</Text>
            <Text style={styles.incidentMessage} numberOfLines={2}>
              {item.message}
            </Text>
          </View>
        </View>

        <View style={styles.incidentMeta}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text style={styles.timeText}>
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: nl })}
            </Text>
          </View>

          <View style={styles.statusBadges}>
            {isResolved ? (
              <View style={[styles.badge, styles.resolvedBadge]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.badgeText, { color: colors.success }]}>Opgelost</Text>
              </View>
            ) : isAcknowledged ? (
              <View style={[styles.badge, styles.acknowledgedBadge]}>
                <Ionicons name="eye" size={14} color={colors.warning} />
                <Text style={[styles.badgeText, { color: colors.warning }]}>Gezien</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.activeBadge]}>
                <Ionicons name="alert-circle" size={14} color={colors.error} />
                <Text style={[styles.badgeText, { color: colors.error }]}>Actief</Text>
              </View>
            )}
          </View>
        </View>

        {!isResolved && (
          <View style={styles.actionButtons}>
            {!isAcknowledged && (
              <Pressable
                style={[styles.actionButton, styles.acknowledgeButton]}
                onPress={() => acknowledgeIncident(item.uuid)}
              >
                <Ionicons name="eye-outline" size={18} color={colors.warning} />
                <Text style={[styles.actionButtonText, { color: colors.warning }]}>
                  Markeer als gezien
                </Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.actionButton, styles.resolveButton]}
              onPress={() => resolveIncident(item.uuid)}
            >
              <Ionicons name="checkmark-outline" size={18} color={colors.success} />
              <Text style={[styles.actionButtonText, { color: colors.success }]}>
                Oplossen
              </Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Incidenten laden...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Incidenten</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterButton type="active" label="Actief" />
        <FilterButton type="resolved" label="Opgelost" />
        <FilterButton type="all" label="Alles" />
      </View>

      {/* Incidents List */}
      <FlatList
        data={incidents}
        renderItem={renderIncidentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={filter === 'active' ? 'checkmark-done-circle' : 'document-text-outline'}
              size={64}
              color={colors.muted}
            />
            <Text style={styles.emptyTitle}>
              {filter === 'active' ? 'Geen actieve incidenten' : 'Geen incidenten'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'active'
                ? 'Al je domeinen draaien probleemloos'
                : 'Er zijn nog geen incidenten geregistreerd'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.foreground,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  incidentCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  incidentHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incidentInfo: {
    flex: 1,
  },
  incidentDomain: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  incidentMessage: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  incidentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.muted,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: colors.errorMuted,
  },
  acknowledgedBadge: {
    backgroundColor: colors.warningMuted,
  },
  resolvedBadge: {
    backgroundColor: colors.successMuted,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  acknowledgeButton: {
    backgroundColor: colors.warningMuted,
  },
  resolveButton: {
    backgroundColor: colors.successMuted,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
  },
});

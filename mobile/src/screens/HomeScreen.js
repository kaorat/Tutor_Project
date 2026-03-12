import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../components/Screen';
import ProfileCard from '../components/ProfileCard';
import GlassCard from '../components/GlassCard';
import StatusBanner from '../components/StatusBanner';
import palette from '../theme/palette';
import { useDataContext } from '../context/DataContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { overview, refreshOverview } = useDataContext();
  const { isOnline } = useConnectivity();
  const { user, logout } = useAuth();

  const onRefresh = useCallback(() => refreshOverview(), [refreshOverview]);

  useFocusEffect(useCallback(() => {
    refreshOverview();
  }, [refreshOverview]));

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      // swallow errors — auth context already exposed status
    }
  }, [logout]);

  const stats = [
    { label: 'Total Students', value: overview.data?.totalStudents ?? '—' },
    { label: 'Active Students', value: overview.data?.activeStudents ?? '—' },
    { label: 'Classes Today', value: overview.data?.todaySchedules ?? '—' },
    { label: 'Total Classes', value: overview.data?.totalClasses ?? '—' },
  ];

  const todayClasses = overview.data?.todayClasses ?? [];

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={(
          <RefreshControl refreshing={overview.loading} onRefresh={onRefresh} tintColor="#fff" />
        )}
      >
        {!isOnline && (
          <StatusBanner type="warning" message="Offline mode — showing cached dashboard data." />
        )}

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>Welcome back</Text>
            <Text style={styles.title}>{user?.name || 'Tutor'}</Text>
          </View>
          <View style={styles.actions}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{overview.updatedAt ? 'Synced' : 'Cached'}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={16} color="#0f172a" />
              <Text style={styles.logoutLabel}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ProfileCard name={user?.name || 'Tutor'} role={user?.role || 'Physics Tutor'} stats={stats} />

        <Text style={styles.sectionLabel}>Today’s Sessions</Text>
        {todayClasses.length === 0 && (
          <StatusBanner message="No sessions scheduled today." />
        )}

        <View style={styles.grid}>
          {todayClasses.map((session) => (
            <GlassCard key={session._id || session.topic} style={styles.tile}>
              <Text style={styles.tileLabel}>{session.classId?.name || 'Unnamed class'}</Text>
              <Text style={styles.tileValue}>{session.topic || 'N/A'}</Text>
              <Text style={styles.tileMeta}>{session.startTime} → {session.endTime}</Text>
            </GlassCard>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kicker: {
    color: palette.muted,
    fontSize: 14,
  },
  title: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  badgeText: {
    color: palette.text,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: palette.accent,
    marginLeft: 10,
  },
  logoutLabel: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  sectionLabel: {
    color: palette.muted,
    marginTop: 28,
    marginBottom: 12,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    padding: 16,
    marginBottom: 12,
  },
  tileLabel: {
    color: palette.muted,
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tileValue: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  tileMeta: {
    color: palette.muted,
    marginTop: 6,
    fontSize: 12,
  },
});

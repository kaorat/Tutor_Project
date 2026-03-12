import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';

import Screen from '../components/Screen';
import GlassCard from '../components/GlassCard';
import StatusBanner from '../components/StatusBanner';
import palette from '../theme/palette';
import { useDataContext } from '../context/DataContext';
import { useConnectivity } from '../context/ConnectivityContext';

export default function ReportsScreen() {
  const { reports, refreshReports } = useDataContext();
  const { isOnline } = useConnectivity();

  const students = reports.data?.data ?? [];

  const onRefresh = useCallback(() => refreshReports(), [refreshReports]);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={reports.loading} onRefresh={onRefresh} tintColor="#fff" />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {!isOnline && <StatusBanner type="warning" message="Offline — showing cached export." />}
        <Text style={styles.title}>Student export</Text>
        <Text style={styles.caption}>{students.length} records</Text>

        {students.length === 0 && <StatusBanner message="No export data available." />}

        {students.map((student) => (
          <GlassCard key={student._id} style={styles.card}>
            <Text style={styles.name}>{student.firstName} {student.lastName}</Text>
            <Text style={styles.meta}>Email: {student.email || 'n/a'}</Text>
            <Text style={styles.meta}>Grade: {student.grade || 'n/a'}</Text>
          </GlassCard>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: palette.text,
  },
  caption: {
    color: palette.muted,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    marginBottom: 14,
  },
  name: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
  },
  meta: {
    color: palette.muted,
    marginTop: 6,
  },
});

import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import Screen from '../components/Screen';
import GlassCard from '../components/GlassCard';
import StatusBanner from '../components/StatusBanner';
import palette from '../theme/palette';
import { useDataContext } from '../context/DataContext';
import { useConnectivity } from '../context/ConnectivityContext';

export default function StudentsScreen() {
  const { students, refreshStudents } = useDataContext();
  const { isOnline } = useConnectivity();

  const listData = students.data?.students ?? [];

  const onRefresh = useCallback(() => refreshStudents(), [refreshStudents]);

  return (
    <Screen>
      {!isOnline && <StatusBanner type="warning" message="Offline — showing cached roster." />}
      <FlatList
        data={listData}
        keyExtractor={(item) => item._id || item.studentId}
        ListEmptyComponent={<Text style={styles.empty}>No students found.</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={(
          <RefreshControl refreshing={students.loading} onRefresh={onRefresh} tintColor="#fff" />
        )}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
            <Text style={styles.meta}>ID: {item.studentId || '—'}</Text>
            <Text style={styles.meta}>Status: {item.status || 'n/a'}</Text>
          </GlassCard>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
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
  empty: {
    color: palette.muted,
    textAlign: 'center',
    marginTop: 40,
  },
});

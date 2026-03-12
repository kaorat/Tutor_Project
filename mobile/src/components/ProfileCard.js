import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import GlassCard from './GlassCard';
import palette from '../theme/palette';

export default function ProfileCard({ name, role, stats }) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={42} color={palette.text} />
        </View>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.role}>{role}</Text>
        <View style={styles.statRow}>
          {stats.map((item) => (
            <View key={item.label} style={styles.statItem}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: palette.accent,
    padding: 3,
    marginRight: 16,
  },
  avatar: {
    flex: 1,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  meta: {
    flex: 1,
  },
  name: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '600',
  },
  role: {
    color: palette.muted,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    color: palette.muted,
    fontSize: 12,
  },
});

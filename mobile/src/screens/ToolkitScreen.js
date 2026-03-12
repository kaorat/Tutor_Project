import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/Screen';
import GlassCard from '../components/GlassCard';
import palette from '../theme/palette';

const toolkitItems = [
  {
    title: 'Personal Link Hub',
    description: 'Quickly launch your teaching profiles and shareable links.',
    target: 'LinkHub',
  },
  {
    title: 'Lesson Energy Optimizer',
    description: 'Plan warm-ups, practice, and review time instantly.',
    target: 'LessonPlanner',
  },
  {
    title: 'Physics Resource Explorer',
    description: 'Browse Open Library works and favorite helpful books.',
    target: 'ResourceExplorer',
  },
  {
    title: 'Signal Dashboard',
    description: 'Monitor crypto sentiment + Bangkok weather with caching.',
    target: 'SignalDashboard',
  },
  {
    title: 'Task Sync Lab',
    description: 'Capture tutor todos offline and auto-sync them later.',
    target: 'TaskSync',
  },
];

export default function ToolkitScreen() {
  const navigation = useNavigation();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Function 7 Playground</Text>
        <Text style={styles.title}>Tutor Toolkit</Text>
        <Text style={styles.subtitle}>
          Explore experimental utilities designed to satisfy F7.1–F7.5 requirements inside the PhysicTutor
          mobile experience.
        </Text>

        {toolkitItems.map((item) => (
          <TouchableOpacity key={item.title} activeOpacity={0.8} onPress={() => navigation.navigate(item.target)}>
            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <Text style={styles.cardCta}>Open</Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  kicker: {
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: 6,
  },
  subtitle: {
    color: palette.muted,
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  cardTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
  },
  cardDescription: {
    color: palette.muted,
    marginTop: 6,
    lineHeight: 20,
  },
  cardCta: {
    color: palette.accent,
    marginTop: 12,
    fontWeight: '600',
  },
});

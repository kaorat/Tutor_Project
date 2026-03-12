import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import Screen from '../components/Screen';
import palette from '../theme/palette';

const segments = [
  { label: 'Warm-up Drills', ratio: 0.2 },
  { label: 'Core Practice', ratio: 0.6 },
  { label: 'Guided Review', ratio: 0.2 },
];

const SegmentRow = ({ label, value }) => (
  <View style={styles.segmentRow}>
    <Text style={styles.segmentLabel}>{label}</Text>
    <Text style={styles.segmentValue}>{value} min</Text>
  </View>
);

export default function LessonPlannerScreen() {
  const [minutes, setMinutes] = useState('45');

  const breakdown = useMemo(() => {
    const parsed = parseFloat(minutes);
    const total = Number.isFinite(parsed) ? parsed : 0;
    if (!total) {
      return segments.map((segment) => ({ ...segment, minutes: 0 }));
    }
    return segments.map((segment) => ({
      ...segment,
      minutes: Math.max(0, Math.round(total * segment.ratio)),
    }));
  }, [minutes]);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>Function 7.2</Text>
          <Text style={styles.title}>Lesson Energy Optimizer</Text>
          <Text style={styles.subtitle}>
            Enter total lesson minutes to instantly split focus across the recommended warm-up, core practice,
            and reflection windows.
          </Text>

          <View style={styles.inputSurface}>
            <Text style={styles.inputLabel}>Lesson Length (minutes)</Text>
            <TextInput
              style={styles.input}
              value={minutes}
              onChangeText={setMinutes}
              placeholder="e.g. 60"
              placeholderTextColor="rgba(226,232,240,0.6)"
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>

          <View style={styles.glassCard}>
            {breakdown.map((segment) => (
              <SegmentRow key={segment.label} label={segment.label} value={segment.minutes} />
            ))}
            <Text style={styles.tip}>
              Tip: Sessions over 90 minutes? Inject a hydration break after the core block to keep energy up.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  kicker: {
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    color: palette.muted,
    marginTop: 8,
    marginBottom: 24,
  },
  inputSurface: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  inputLabel: {
    color: palette.muted,
    marginBottom: 6,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: palette.text,
    fontSize: 18,
  },
  glassCard: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  segmentLabel: {
    color: palette.muted,
    fontSize: 16,
  },
  segmentValue: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
  },
  tip: {
    color: palette.muted,
    marginTop: 16,
    lineHeight: 20,
  },
});

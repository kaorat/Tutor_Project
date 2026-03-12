import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import Screen from '../components/Screen';
import GlassCard from '../components/GlassCard';
import PendingQueueBanner from '../components/PendingQueueBanner';
import StatusBanner from '../components/StatusBanner';
import palette from '../theme/palette';
import { useDataContext } from '../context/DataContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { useSyncQueue } from '../context/SyncContext';

export default function AttendanceScreen() {
  const { attendance, refreshAttendance, students } = useDataContext();
  const { isOnline } = useConnectivity();
  const { pendingQueue, enqueue, processing, lastSync } = useSyncQueue();

  const [form, setForm] = useState({ classId: '', studentId: '', status: 'present', note: '' });
  const [localMessage, setLocalMessage] = useState(null);

  const summary = attendance.data?.summary;
  const attendanceSessions = attendance.data?.attendances ?? [];
  const roster = students?.data?.students ?? [];
  const statusOptions = ['present', 'absent', 'late', 'excused'];

  const classOptions = useMemo(() => {
    const entries = new Map();
    attendanceSessions.forEach((session) => {
      const id = session.classId?._id;
      const name = session.classId?.name;
      if (id && name && !entries.has(id)) {
        entries.set(id, name);
      }
    });
    return Array.from(entries.entries()).map(([value, label]) => ({ value, label }));
  }, [attendanceSessions]);

  const classStudentMap = useMemo(() => {
    const map = new Map();
    attendanceSessions.forEach((session) => {
      const clsId = session.classId?._id;
      if (!clsId) return;
      if (!map.has(clsId)) {
        map.set(clsId, new Map());
      }
      session.records?.forEach((record) => {
        const student = record.student;
        if (!student?._id) return;
        const label = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed student';
        map.get(clsId).set(student._id, label);
      });
    });
    const normalized = {};
    map.forEach((valueMap, clsId) => {
      normalized[clsId] = Array.from(valueMap.entries()).map(([id, label]) => ({ id, label }));
    });
    return normalized;
  }, [attendanceSessions]);

  const filteredRoster = useMemo(() => {
    if (form.classId && classStudentMap[form.classId]?.length) {
      return classStudentMap[form.classId];
    }
    return roster.map((student) => ({
      id: student._id,
      label: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed student',
    }));
  }, [classStudentMap, form.classId, roster]);

  const onRefresh = useCallback(() => refreshAttendance(), [refreshAttendance]);

  const handleSubmit = async () => {
    if (!form.classId) {
      setLocalMessage('Select a class before queuing.');
      return;
    }
    if (!form.studentId) {
      setLocalMessage('Select a student before queuing.');
      return;
    }
    setLocalMessage('Queued for sync');
    await enqueue({
      endpoint: '/reports/mobile-sync',
      method: 'post',
      payload: {
        type: 'attendance-update',
        payload: form,
        queuedAt: new Date().toISOString(),
      },
    });
    setForm({ classId: '', studentId: '', status: 'present', note: '' });
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={attendance.loading} onRefresh={onRefresh} tintColor="#fff" />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {!isOnline && <StatusBanner type="warning" message="Offline — attendance summary cached." />}
        <PendingQueueBanner count={pendingQueue.length} />
        {lastSync && (
          <Text style={styles.lastSync}>Last sync: {new Date(lastSync).toLocaleTimeString()}</Text>
        )}

        {summary ? (
          <View style={styles.summaryRow}>
            <GlassCard style={styles.summaryCard}>
              <Text style={styles.metricValue}>{summary.totalPresent}</Text>
              <Text style={styles.metricLabel}>Present</Text>
            </GlassCard>
            <GlassCard style={styles.summaryCard}>
              <Text style={styles.metricValue}>{summary.totalAbsent}</Text>
              <Text style={styles.metricLabel}>Absent</Text>
            </GlassCard>
            <GlassCard style={styles.summaryCard}>
              <Text style={styles.metricValue}>{summary.totalLate}</Text>
              <Text style={styles.metricLabel}>Late</Text>
            </GlassCard>
          </View>
        ) : (
          <StatusBanner message="No attendance summary available." />
        )}

        <Text style={styles.sectionTitle}>Quick attendance note</Text>
        <GlassCard style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Class</Text>
            <View style={styles.pickerSurface}>
              <Picker
                selectedValue={form.classId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, classId: value, studentId: '' }))}
                dropdownIconColor={palette.text}
                style={styles.picker}
              >
                <Picker.Item label={classOptions.length ? 'Choose a class…' : 'No classes available'} value="" color="rgba(248,250,252,0.6)" />
                {classOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} color={palette.text} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Select Student</Text>
            <View style={styles.pickerSurface}>
              <Picker
                selectedValue={form.studentId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, studentId: value }))}
                dropdownIconColor={palette.text}
                style={styles.picker}
              >
                <Picker.Item
                  label={filteredRoster.length ? 'Choose a student…' : form.classId ? 'No students in class' : 'No students available'}
                  value=""
                  color="rgba(248,250,252,0.6)"
                />
                {filteredRoster.map((student) => (
                  <Picker.Item key={student.id} label={student.label} value={student.id} color={palette.text} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Status</Text>
            <View style={styles.pickerSurface}>
              <Picker
                selectedValue={form.status}
                onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                dropdownIconColor={palette.text}
                style={styles.picker}
              >
                {statusOptions.map((option) => (
                  <Picker.Item key={option} label={option.charAt(0).toUpperCase() + option.slice(1)} value={option} color={palette.text} />
                ))}
              </Picker>
            </View>
          </View>

          <TextInput
            style={[styles.input, { height: 90 }]}
            placeholder="Optional note"
            placeholderTextColor="rgba(248, 250, 252, 0.5)"
            value={form.note}
            multiline
            onChangeText={(text) => setForm((prev) => ({ ...prev, note: text }))}
          />
          {localMessage && <Text style={styles.note}>{localMessage}</Text>}
          <TouchableOpacity
            style={[styles.button, (!form.classId || !filteredRoster.length) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={processing || !form.classId || !filteredRoster.length}
          >
            <Text style={styles.buttonText}>{processing ? 'Syncing…' : 'Queue Update'}</Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  lastSync: {
    color: palette.muted,
    marginBottom: 12,
  },
  summaryCard: {
    width: '31%',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700',
  },
  metricLabel: {
    color: palette.muted,
    marginTop: 6,
    fontSize: 12,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  formCard: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: palette.muted,
    marginBottom: 6,
    fontSize: 13,
  },
  pickerSurface: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 16,
    backgroundColor: '#020617',
  },
  picker: {
    color: palette.text,
    backgroundColor: '#020617',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.text,
    marginBottom: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  note: {
    color: palette.muted,
    marginBottom: 10,
  },
  button: {
    backgroundColor: palette.accent,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Screen from '../components/Screen';
import GlassCard from '../components/GlassCard';
import StatusBanner from '../components/StatusBanner';
import palette from '../theme/palette';
import apiClient from '../api/client';
import { useConnectivity } from '../context/ConnectivityContext';

const TASKS_KEY = '@physictutor:tasks';

export default function TaskSyncScreen() {
  const { isOnline } = useConnectivity();
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [syncing, setSyncing] = useState(false);
  const tasksRef = useRef(tasks);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    const hydrate = async () => {
      const cached = await AsyncStorage.getItem(TASKS_KEY);
      if (cached) {
        setTasks(JSON.parse(cached));
      }
    };
    hydrate();
  }, []);

  const persistTasks = useCallback(async (nextTasks) => {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(nextTasks));
  }, []);

  const addTask = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const newTask = {
      id: `${Date.now()}`,
      title: trimmed,
      status: 'pending',
      queuedAt: new Date().toISOString(),
    };
    const nextTasks = [newTask, ...tasksRef.current];
    setTasks(nextTasks);
    tasksRef.current = nextTasks;
    await persistTasks(nextTasks);
    setInput('');
  };

  const syncQueue = useCallback(async () => {
    if (!isOnline || syncing) return;
    const pending = tasksRef.current.filter((task) => task.status === 'pending');
    if (!pending.length) return;

    setSyncing(true);
    const updated = [...tasksRef.current];

    for (const task of pending) {
      try {
        await apiClient.post('/reports/mobile-sync', {
          type: 'task-sync',
          payload: { id: task.id, title: task.title },
        });
        const index = updated.findIndex((candidate) => candidate.id === task.id);
        if (index > -1) {
          updated[index] = { ...task, status: 'synced' };
        }
      } catch (error) {
        break;
      }
    }

    setTasks(updated);
    tasksRef.current = updated;
    await persistTasks(updated);
    setSyncing(false);
  }, [isOnline, persistTasks, syncing]);

  useEffect(() => {
    if (isOnline) {
      syncQueue();
    }
  }, [isOnline, syncQueue]);

  const renderItem = ({ item }) => (
    <GlassCard style={styles.taskCard}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskStatus}>{item.status === 'pending' ? 'Pending ⏳' : 'Synced ✅'}</Text>
    </GlassCard>
  );

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.kicker}>Function 7.5</Text>
        <Text style={styles.title}>Offline Task Sync Lab</Text>
        <Text style={styles.subtitle}>Capture todos anytime—once you come back online, we will push them upstream.</Text>

        <StatusBanner
          type={isOnline ? 'success' : 'warning'}
          message={isOnline ? 'Online — syncing enabled.' : 'Offline — new tasks will queue locally.'}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Add a task"
            placeholderTextColor="rgba(226,232,240,0.6)"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.addButton} onPress={addTask}>
            <Text style={styles.addButtonLabel}>Add</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.syncButton} onPress={syncQueue} disabled={!isOnline || syncing}>
          <Text style={styles.syncButtonLabel}>{syncing ? 'Syncing…' : 'Force Sync'}</Text>
        </TouchableOpacity>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>No tasks yet — add your next tutoring goal.</Text>}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  kicker: {
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
  },
  title: {
    color: palette.text,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    color: palette.muted,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: palette.text,
    marginRight: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
  },
  addButton: {
    backgroundColor: palette.accent,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  addButtonLabel: {
    color: '#0f172a',
    fontWeight: '700',
  },
  syncButton: {
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    marginBottom: 12,
  },
  syncButtonLabel: {
    color: palette.text,
    fontWeight: '600',
  },
  taskCard: {
    padding: 16,
    marginBottom: 12,
  },
  taskTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '600',
  },
  taskStatus: {
    color: palette.muted,
    marginTop: 6,
  },
  empty: {
    color: palette.muted,
    textAlign: 'center',
    marginTop: 24,
  },
});

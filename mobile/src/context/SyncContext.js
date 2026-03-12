import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import apiClient from '../api/client';
import { useConnectivity } from './ConnectivityContext';

const QUEUE_KEY = '@physictutor:pending-queue';

const SyncContext = createContext();

export function SyncProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const { isOnline } = useConnectivity();
  const processingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        setQueue(JSON.parse(stored));
      }
    })();
  }, []);

  const persistQueue = useCallback(async (nextQueueOrUpdater) => {
    let nextValue = [];
    setQueue(prev => {
      nextValue = typeof nextQueueOrUpdater === 'function' ? nextQueueOrUpdater(prev) : nextQueueOrUpdater;
      return nextValue;
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(nextValue));
    return nextValue;
  }, []);

  const enqueue = useCallback(async (item) => {
    const entry = {
      id: `${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
      ...item,
    };
    await persistQueue(prev => [...prev, entry]);
    return entry;
  }, [persistQueue]);

  const processQueue = useCallback(async () => {
    if (!isOnline || processingRef.current || queue.length === 0) return;
    processingRef.current = true;
    setProcessing(true);

    const remaining = [];
    let shouldStop = false;
    for (const item of queue) {
      if (shouldStop) {
        remaining.push(item);
        continue;
      }
      try {
        await apiClient.request({ method: item.method || 'post', url: item.endpoint, data: item.payload });
        setLastSync(new Date().toISOString());
      } catch (error) {
        remaining.push(item);
        shouldStop = true; // retry later starting from failed item
      }
    }

    if (remaining.length !== queue.length) {
      await persistQueue(remaining);
    }

    setProcessing(false);
    processingRef.current = false;
  }, [isOnline, persistQueue, queue]);

  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue();
    }
  }, [isOnline, queue, processQueue]);

  const value = {
    pendingQueue: queue,
    enqueue,
    processQueue,
    processing,
    lastSync,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export const useSyncQueue = () => useContext(SyncContext);

// F7.5: Offline sync queue store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import API from '../utils/api';

const useSyncStore = create(
  persist(
    (set, get) => ({
      queue: [],
      isOnline: navigator.onLine,
      isSyncing: false,
      cache: {},

      // F7.5: Add to sync queue
      addToQueue: (action) => {
        const queue = get().queue;
        // Duplicate prevention
        const isDuplicate = queue.some(
          q => q.method === action.method && q.url === action.url && JSON.stringify(q.data) === JSON.stringify(action.data)
        );
        if (!isDuplicate) {
          set({ queue: [...queue, { ...action, id: Date.now(), createdAt: new Date().toISOString() }] });
        }
      },

      // F7.4: Cache API response
      setCache: (key, data) => {
        set({ cache: { ...get().cache, [key]: { data, cachedAt: Date.now() } } });
      },

      getCache: (key, maxAge = 5 * 60 * 1000) => {
        const cached = get().cache[key];
        if (!cached) return null;
        if (Date.now() - cached.cachedAt > maxAge) return null;
        return cached.data;
      },

      setOnline: (status) => set({ isOnline: status }),

      // Process sync queue when back online
      processQueue: async () => {
        const { queue } = get();
        if (queue.length === 0 || get().isSyncing) return;

        set({ isSyncing: true });
        const failed = [];

        for (const action of queue) {
          try {
            await API({ method: action.method, url: action.url, data: action.data });
          } catch {
            failed.push(action);
          }
        }

        set({ queue: failed, isSyncing: false });
      },
    }),
    {
      name: 'sync-storage',
      partialize: (state) => ({ queue: state.queue, cache: state.cache }),
    }
  )
);

// Network status detection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setOnline(true);
    useSyncStore.getState().processQueue();
  });
  window.addEventListener('offline', () => {
    useSyncStore.getState().setOnline(false);
  });
}

export default useSyncStore;

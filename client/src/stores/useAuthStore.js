// F2.5: Zustand auth store with RBAC
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import API from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      login: async (email, password) => {
        const res = await API.post('/auth/login', { email, password });
        const { user } = res.data;
        set({ user, isAuthenticated: true });
        return res.data;
      },

      register: async (name, email, password, phone) => {
        const res = await API.post('/auth/register', { name, email, password, phone });
        const { user } = res.data;
        set({ user, isAuthenticated: true });
        return res.data;
      },

      logout: async () => {
        try { await API.post('/auth/logout'); } catch {}
        set({ user: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        try {
          set({ loading: true });
          const res = await API.get('/auth/me');
          set({ user: res.data, isAuthenticated: true, loading: false });
        } catch {
          set({ user: null, isAuthenticated: false, loading: false });
          localStorage.removeItem('token');
        }
      },

      updateProfile: async (data) => {
        const res = await API.put('/auth/profile', data);
        set({ user: res.data });
        return res.data;
      },

      changePassword: async (currentPassword, newPassword) => {
        const res = await API.put('/auth/password', { currentPassword, newPassword });
        return res.data;
      },

      // Computed: check role
      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'admin') return true; // admin hierarchy bypass
        return user.role === role;
      },

      // Admin tutor-switching
      viewingTutorId: null,
      viewingTutorName: null,
      setViewingTutor: (id, name) => set({ viewingTutorId: id, viewingTutorName: name }),
      clearViewingTutor: () => set({ viewingTutorId: null, viewingTutorName: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user, isAuthenticated: state.isAuthenticated,
        viewingTutorId: state.viewingTutorId, viewingTutorName: state.viewingTutorName,
      }),
    }
  )
);

export default useAuthStore;

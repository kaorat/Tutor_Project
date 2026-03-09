// F1.3 + F2.1: Theme store with dark/light mode and color picker
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set, get) => ({
      mode: 'dark',
      accentColor: '#007AFF',

      toggleMode: () => {
        const newMode = get().mode === 'dark' ? 'light' : 'dark';
        set({ mode: newMode });
        document.documentElement.setAttribute('data-theme', newMode);
      },

      setAccentColor: (color) => {
        set({ accentColor: color });
        document.documentElement.style.setProperty('--primary', color);
      },

      initTheme: () => {
        const { mode, accentColor } = get();
        document.documentElement.setAttribute('data-theme', mode);
        document.documentElement.style.setProperty('--primary', accentColor);
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

export default useThemeStore;

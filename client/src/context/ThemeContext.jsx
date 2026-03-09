// F2.1: Dark/Light Mode via Context API (wraps Zustand theme store)
import { createContext, useContext, useCallback } from 'react';
import useThemeStore from '../stores/useThemeStore';

const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }) {
  const { mode, toggleMode, accentColor, setAccentColor, initTheme } = useThemeStore();

  const toggle = useCallback(() => toggleMode(), [toggleMode]);
  const setColor = useCallback((color) => setAccentColor(color), [setAccentColor]);

  return (
    <ThemeContext.Provider value={{ mode, toggle, accentColor, setColor, initTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeContext;

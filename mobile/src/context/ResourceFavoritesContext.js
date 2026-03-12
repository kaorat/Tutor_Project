import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@physictutor:fav-resources';

const ResourceFavoritesContext = createContext();

export function ResourceFavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavoriteIds(parsed);
          }
        }
      } catch {
        // ignore malformed storage
      } finally {
        setHydrated(true);
      }
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds)).catch(() => {
      // ignore write errors
    });
  }, [favoriteIds, hydrated]);

  const isFavorite = useCallback((bookKey) => favoriteIds.includes(bookKey), [favoriteIds]);

  const toggleFavorite = useCallback((bookKey) => {
    setFavoriteIds((prev) => {
      if (prev.includes(bookKey)) {
        return prev.filter((key) => key !== bookKey);
      }
      return [...prev, bookKey];
    });
  }, []);

  const value = useMemo(() => ({
    favoriteIds,
    isFavorite,
    toggleFavorite,
  }), [favoriteIds, isFavorite, toggleFavorite]);

  return (
    <ResourceFavoritesContext.Provider value={value}>
      {children}
    </ResourceFavoritesContext.Provider>
  );
}

export function useResourceFavorites() {
  const context = useContext(ResourceFavoritesContext);
  if (!context) {
    throw new Error('useResourceFavorites must be used within a ResourceFavoritesProvider');
  }
  return context;
}

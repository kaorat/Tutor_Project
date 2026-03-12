import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import apiClient from '../api/client';

const AuthContext = createContext();
const AUTH_STORAGE_KEY = '@physictutor:auth-user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const persistUser = async (nextUser) => {
    if (nextUser) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/auth/me');
      setUser(data);
      await persistUser(data);
      return data;
    } catch (profileError) {
      setUser(null);
      await persistUser(null);
      throw profileError;
    }
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        setUser(JSON.parse(cached));
      }
      await fetchProfile();
    } catch {
      // Ignore boot errors — rely on cached user if available
    } finally {
      setInitializing(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email, password) => {
    setProcessing(true);
    setError(null);
    try {
      await apiClient.post('/auth/login', { email, password }, { withCredentials: true });
      await fetchProfile();
    } catch (loginError) {
      setError(loginError.message || 'Unable to log in');
      throw loginError;
    } finally {
      setProcessing(false);
    }
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore logout errors
    } finally {
      setUser(null);
      await persistUser(null);
    }
  }, []);

  const value = {
    user,
    initializing,
    processing,
    error,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refreshProfile: fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

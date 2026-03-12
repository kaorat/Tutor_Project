import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import apiClient from '../api/client';
import { useConnectivity } from './ConnectivityContext';
import { useAuth } from './AuthContext';

const CACHE_KEYS = {
  overview: '@physictutor:cache-overview',
  students: '@physictutor:cache-students',
  attendance: '@physictutor:cache-attendance',
  reports: '@physictutor:cache-reports',
};

const createSlice = () => ({ data: null, loading: false, error: null, updatedAt: null });
const buildInitialState = () => ({
  overview: createSlice(),
  students: createSlice(),
  attendance: createSlice(),
  reports: createSlice(),
});
const initialState = buildInitialState();

function reducer(state, action) {
  const { key } = action;
  switch (action.type) {
    case 'loading':
      return { ...state, [key]: { ...state[key], loading: true, error: null } };
    case 'success':
      return { ...state, [key]: { data: action.payload, loading: false, error: null, updatedAt: action.updatedAt } };
    case 'error':
      return { ...state, [key]: { ...state[key], loading: false, error: action.error } };
    case 'hydrate':
      return { ...state, [key]: { ...state[key], ...action.payload } };
    case 'reset':
      return buildInitialState();
    default:
      return state;
  }
}

const DataContext = createContext();

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isOnline } = useConnectivity();
  const { isAuthenticated } = useAuth();

  const hydrateFromStorage = useCallback(async () => {
    const entries = await AsyncStorage.multiGet(Object.values(CACHE_KEYS));
    entries.forEach(([storageKey, value]) => {
      if (!value) return;
      try {
        const parsed = JSON.parse(value);
        const key = Object.keys(CACHE_KEYS).find(k => CACHE_KEYS[k] === storageKey);
        if (key) {
          dispatch({ type: 'hydrate', key, payload: { data: parsed.data, updatedAt: parsed.updatedAt } });
        }
      } catch {
        // ignore parse errors
      }
    });
  }, []);

    useEffect(() => {
      hydrateFromStorage();
    }, [hydrateFromStorage]);

    useEffect(() => {
      if (isAuthenticated) {
        hydrateFromStorage();
      }
    }, [hydrateFromStorage, isAuthenticated]);

  const cacheAndDispatch = useCallback(async (key, data) => {
    const updatedAt = new Date().toISOString();
    dispatch({ type: 'success', key, payload: data, updatedAt });
    await AsyncStorage.setItem(CACHE_KEYS[key], JSON.stringify({ data, updatedAt }));
  }, []);

  const guardedFetch = useCallback(async (key, requestFn) => {
    if (!isOnline || !isAuthenticated) return null;
    dispatch({ type: 'loading', key });
    try {
      const data = await requestFn();
      await cacheAndDispatch(key, data);
      return data;
    } catch (error) {
      dispatch({ type: 'error', key, error: error.message || 'Failed to fetch data' });
      throw error;
    }
  }, [cacheAndDispatch, isAuthenticated, isOnline]);

  const refreshOverview = useCallback(() => guardedFetch('overview', async () => {
    const { data } = await apiClient.get('/reports/overview');
    return data;
  }), [guardedFetch]);

  const refreshStudents = useCallback(() => guardedFetch('students', async () => {
    const { data } = await apiClient.get('/students?limit=50');
    return data;
  }), [guardedFetch]);

  const refreshAttendance = useCallback(() => guardedFetch('attendance', async () => {
    const { data } = await apiClient.get('/reports/attendance-report?classId=_all');
    return data;
  }), [guardedFetch]);

  const refreshReports = useCallback(() => guardedFetch('reports', async () => {
    const { data } = await apiClient.get('/reports/export?type=students');
    return data;
  }), [guardedFetch]);

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: 'reset' });
      return;
    }
    if (!isOnline) return;
    refreshOverview();
    refreshStudents();
    refreshAttendance();
    refreshReports();
  }, [isAuthenticated, isOnline, refreshAttendance, refreshOverview, refreshReports, refreshStudents]);

  const value = {
    overview: state.overview,
    students: state.students,
    attendance: state.attendance,
    reports: state.reports,
    refreshOverview,
    refreshStudents,
    refreshAttendance,
    refreshReports,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export const useDataContext = () => useContext(DataContext);

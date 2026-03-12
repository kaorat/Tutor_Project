import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Screen from '../components/Screen';
import GlassCard from '../components/GlassCard';
import StatusBanner from '../components/StatusBanner';
import palette from '../theme/palette';
import { useConnectivity } from '../context/ConnectivityContext';

const CACHE_KEYS = {
  weather: '@physictutor:dash-weather',
  tip: '@physictutor:dash-tip',
};

const physicsTips = [
  'Use free-body diagrams first, equations second — it clarifies invisible forces.',
  'When teaching projectile motion, swap g for 1.62 m/s² to discuss lunar launches.',
  'Reinforce energy conservation by tracing units: Joules stay Joules across systems.',
  'Relate Faraday’s law to everyday tech: wireless charging pads are perfect examples.',
  'Challenge students to estimate drag with dimensional analysis before showing formulas.',
];

const fetchLocalTip = () => new Promise((resolve) => {
  setTimeout(() => {
    const tip = physicsTips[Math.floor(Math.random() * physicsTips.length)];
    resolve({
      tip,
      author: 'PhysicTutor Faculty',
      updated: new Date().toISOString(),
    });
  }, 350);
});

export default function SignalDashboardScreen() {
  const { isOnline } = useConnectivity();
  const [weather, setWeather] = useState({ data: null, error: null, loading: true });
  const [tip, setTip] = useState({ data: null, error: null, loading: true });
  const [hydrated, setHydrated] = useState(false);

  const hydrate = useCallback(async () => {
    const [[, weatherCache], [, tipCache]] = await AsyncStorage.multiGet([CACHE_KEYS.weather, CACHE_KEYS.tip]);
    if (weatherCache) setWeather((prev) => ({ ...prev, data: JSON.parse(weatherCache), loading: false }));
    if (tipCache) setTip((prev) => ({ ...prev, data: JSON.parse(tipCache), loading: false }));
    setHydrated(true);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const fetchFeeds = useCallback(async () => {
    setWeather((prev) => ({ ...prev, loading: true, error: null }));
    setTip((prev) => ({ ...prev, loading: true, error: null }));

    const requests = [
      fetch('https://api.open-meteo.com/v1/forecast?latitude=13.7563&longitude=100.5018&current=temperature_2m,relative_humidity_2m'),
      fetchLocalTip(),
    ];

    const [weatherResult, tipResult] = await Promise.allSettled(requests);

    if (weatherResult.status === 'fulfilled') {
      try {
        const json = await weatherResult.value.json();
        const payload = {
          temperature: json.current?.temperature_2m,
          humidity: json.current?.relative_humidity_2m,
          updated: json.current?.time,
        };
        setWeather({ data: payload, error: null, loading: false });
        await AsyncStorage.setItem(CACHE_KEYS.weather, JSON.stringify(payload));
      } catch (error) {
        setWeather({ data: null, error: 'Weather service unavailable', loading: false });
      }
    } else {
      setWeather({ data: null, error: 'Weather service unavailable', loading: false });
    }

    if (tipResult.status === 'fulfilled') {
      setTip({ data: tipResult.value, error: null, loading: false });
      await AsyncStorage.setItem(CACHE_KEYS.tip, JSON.stringify(tipResult.value));
    } else {
      setTip({ data: null, error: 'Tip service unavailable', loading: false });
    }
  }, []);

  useEffect(() => {
    if (isOnline) {
      fetchFeeds();
    }
  }, [fetchFeeds, isOnline]);

  const showGlobalSpinner = (!hydrated && (weather.loading || tip.loading))
    || (weather.loading && !weather.data)
    || (tip.loading && !tip.data);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Function 7.4</Text>
        <Text style={styles.title}>Signal Dashboard</Text>
        <Text style={styles.subtitle}>Pinned weather plus a tutoring-ready physics teaching tip.</Text>

        {!isOnline && (
          <StatusBanner type="warning" message="Offline Mode: Showing cached data where available." />
        )}

        {showGlobalSpinner && (
          <View style={styles.spinnerBlock}>
            <ActivityIndicator color={palette.accent} />
            <Text style={styles.loadingText}>Fetching signals…</Text>
          </View>
        )}

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Bangkok Weather</Text>
          {weather.error && <Text style={styles.error}>{weather.error}</Text>}
          {!weather.error && weather.data && (
            <>
              <Text style={styles.metric}>{weather.data.temperature ? `${weather.data.temperature}°C` : '—'}</Text>
              <Text style={styles.meta}>Humidity {weather.data.humidity ?? '—'}%</Text>
              <Text style={styles.meta}>Updated {weather.data.updated ? new Date(weather.data.updated).toLocaleTimeString() : 'recently'}</Text>
            </>
          )}
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Physics Teaching Tip</Text>
          {tip.error && <Text style={styles.error}>{tip.error}</Text>}
          {!tip.error && tip.data && (
            <>
              <Text style={styles.tipText}>{tip.data.tip}</Text>
              <Text style={styles.meta}>Source: {tip.data.author}</Text>
              <Text style={styles.meta}>Updated {tip.data.updated ? new Date(tip.data.updated).toLocaleTimeString() : 'recently'}</Text>
            </>
          )}
        </GlassCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
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
    marginTop: 6,
    marginBottom: 16,
  },
  spinnerBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: palette.muted,
    marginTop: 8,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  metric: {
    color: palette.text,
    fontSize: 32,
    fontWeight: '700',
  },
  meta: {
    color: palette.muted,
    marginTop: 6,
  },
  tipText: {
    color: palette.text,
    fontSize: 18,
    lineHeight: 24,
  },
  error: {
    color: '#f87171',
    marginTop: 8,
  },
});

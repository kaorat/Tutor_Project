import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';

import Screen from '../components/Screen';
import GlassCard from '../components/GlassCard';
import palette from '../theme/palette';
import { useResourceFavorites } from '../context/ResourceFavoritesContext';

const extractDescription = (payload) => {
  if (!payload) return 'No description available.';
  if (typeof payload === 'string') return payload;
  if (typeof payload.value === 'string') return payload.value;
  return 'No description available.';
};

export default function ResourceDetailScreen() {
  const route = useRoute();
  const { book } = route.params;
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useResourceFavorites();
  const favored = isFavorite(book.key);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://openlibrary.org${book.key}.json`);
        const json = await response.json();
        if (isMounted) {
          setDescription(extractDescription(json.description));
        }
      } catch (error) {
        if (isMounted) {
          setDescription('Unable to load description right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [book.key]);

  const handleFavoritePress = () => {
    toggleFavorite(book.key);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.kicker}>Physics Resource</Text>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.subtitle}>{book.authors?.[0]?.name || 'Unknown author'}</Text>

        <GlassCard style={styles.card}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={palette.accent} />
              <Text style={styles.loadingText}>Loading description…</Text>
            </View>
          ) : (
            <Text style={styles.description}>{description}</Text>
          )}
        </GlassCard>

        <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoritePress}>
          <Text style={styles.favoriteText}>{favored ? 'Remove Favorite' : 'Mark as Favorite'}</Text>
        </TouchableOpacity>
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
    marginTop: 6,
  },
  subtitle: {
    color: palette.muted,
    marginBottom: 16,
  },
  card: {
    padding: 18,
    minHeight: 160,
  },
  description: {
    color: palette.text,
    lineHeight: 22,
  },
  center: {
    alignItems: 'center',
  },
  loadingText: {
    color: palette.muted,
    marginTop: 8,
  },
  favoriteButton: {
    marginTop: 24,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: palette.accent,
  },
  favoriteText: {
    color: '#0f172a',
    fontWeight: '600',
  },
});

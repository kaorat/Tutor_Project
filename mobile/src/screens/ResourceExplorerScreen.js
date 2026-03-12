import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/Screen';
import GlassCard from '../components/GlassCard';
import palette from '../theme/palette';
import { useResourceFavorites } from '../context/ResourceFavoritesContext';

export default function ResourceExplorerScreen() {
  const navigation = useNavigation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isFavorite } = useResourceFavorites();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://openlibrary.org/subjects/physics.json?limit=20');
        const json = await response.json();
        const works = json.works || [];
        setBooks(works);
      } catch (err) {
        setError('Unable to fetch physics resources right now.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('ResourceDetail', { book: item })}>
      <GlassCard style={styles.card}>
        <Text style={styles.bookTitle}>
          {item.title}
          {isFavorite(item.key) ? ' (Favorite)' : ''}
        </Text>
        <Text style={styles.bookAuthor}>{item.authors?.[0]?.name || 'Unknown author'}</Text>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.kicker}>Function 7.3</Text>
        <Text style={styles.title}>Physics Resource Explorer</Text>
        <Text style={styles.subtitle}>Tap any book to read more details and mark it as a favorite reference.</Text>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={palette.accent} />
            <Text style={styles.loadingText}>Loading works…</Text>
          </View>
        )}

        {!loading && error && <Text style={styles.error}>{error}</Text>}

        {!loading && !error && (
          <FlatList
            data={books}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    marginTop: 8,
  },
  subtitle: {
    color: palette.muted,
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    padding: 18,
  },
  bookTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
  },
  bookAuthor: {
    color: palette.muted,
    marginTop: 4,
  },
  center: {
    alignItems: 'center',
    marginTop: 24,
  },
  loadingText: {
    color: palette.muted,
    marginTop: 8,
  },
  error: {
    color: '#f87171',
    marginTop: 16,
  },
});

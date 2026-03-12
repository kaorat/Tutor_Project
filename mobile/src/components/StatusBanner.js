import { View, Text, StyleSheet } from 'react-native';

import palette from '../theme/palette';

export default function StatusBanner({ message, type = 'info' }) {
  if (!message) return null;
  return (
    <View style={[styles.container, type === 'warning' && styles.warning]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    marginBottom: 16,
  },
  warning: {
    backgroundColor: 'rgba(244, 63, 94, 0.25)',
    borderColor: 'rgba(248, 113, 113, 0.5)',
  },
  text: {
    color: palette.text,
    fontSize: 14,
  },
});

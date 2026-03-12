import { View, Text, StyleSheet } from 'react-native';

import palette from '../theme/palette';

export default function PendingQueueBanner({ count }) {
  if (!count) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{count} pending update{count > 1 ? 's' : ''} will sync when online.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 77, 0.4)',
    marginBottom: 16,
  },
  text: {
    color: palette.text,
    fontSize: 13,
  },
});

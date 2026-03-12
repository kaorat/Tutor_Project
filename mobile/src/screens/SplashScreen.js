import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import palette from '../theme/palette';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={palette.accent} size="large" />
      <Text style={styles.text}>Syncing cockpit…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 16,
    color: palette.text,
    fontSize: 16,
  },
});

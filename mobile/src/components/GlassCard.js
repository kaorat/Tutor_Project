import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

export default function GlassCard({ children, style, intensity = 70 }) {
  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.glass, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
});

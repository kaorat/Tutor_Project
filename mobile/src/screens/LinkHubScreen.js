import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Screen from '../components/Screen';
import palette from '../theme/palette';

const linkButtons = [
  { label: 'Assignments', note: 'Share current homework pack' },
  { label: 'Lesson Slides', note: 'Physics deck on Drive' },
  { label: 'QA Hotline', note: 'Line OA for urgent support' },
];

const randomColor = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;

export default function LinkHubScreen() {
  const [borderColor, setBorderColor] = useState(palette.accent);

  const handlePress = (label) => {
    const color = randomColor();
    setBorderColor(color);
    Alert.alert('Launching link', `${label} ready to share.`);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.profileBlock}>
          <View style={[styles.avatarRing, { borderColor }]}> 
            <View style={styles.avatar}>
              <Ionicons name="person-circle-outline" size={72} color="rgba(248, 250, 252, 0.9)" />
            </View>
          </View>
          <Text style={styles.name}>Prof. Kaorat Thep</Text>
          <Text style={styles.role}>Lead Physics Tutor</Text>
        </View>

        <View style={styles.buttonGroup}>
          {linkButtons.map((btn) => (
            <Pressable
              key={btn.label}
              onPress={() => handlePress(btn.label)}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            >
              <Text style={styles.buttonLabel}>{btn.label}</Text>
              <Text style={styles.buttonNote}>{btn.note}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  profileBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    padding: 6,
    marginBottom: 16,
  },
  avatar: {
    flex: 1,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  name: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '700',
  },
  role: {
    color: palette.muted,
    marginTop: 4,
  },
  buttonGroup: {
    width: '100%',
  },
  button: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
    backgroundColor: '#020617',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonLabel: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
  },
  buttonNote: {
    color: palette.muted,
    marginTop: 4,
  },
});

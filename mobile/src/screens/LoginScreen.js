import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

import palette from '../theme/palette';
import { useAuth } from '../context/AuthContext';
import { useConnectivity } from '../context/ConnectivityContext';

export default function LoginScreen() {
  const { login, processing, error } = useAuth();
  const { isOnline } = useConnectivity();
  const [email, setEmail] = useState('tutor@example.com');
  const [password, setPassword] = useState('password123');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async () => {
    if (!email || !password) {
      setLocalError('Email and password are required');
      return;
    }
    setLocalError(null);
    try {
      await login(email.trim(), password);
    } catch (loginError) {
      setLocalError(loginError.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PhysicTutor Mobile</Text>
      <Text style={styles.subtitle}>Sign in to sync your tutor cockpit.</Text>

      {!isOnline && <Text style={styles.offline}>Connect to the internet to log in.</Text>}

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="rgba(248, 250, 252, 0.4)"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgba(248, 250, 252, 0.4)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {(localError || error) && <Text style={styles.error}>{localError || error}</Text>}
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={processing || !isOnline}>
          {processing ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.text,
  },
  subtitle: {
    color: palette.muted,
    marginTop: 6,
    marginBottom: 24,
  },
  offline: {
    color: '#fbbf24',
    marginBottom: 18,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: palette.text,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    marginBottom: 16,
  },
  button: {
    backgroundColor: palette.accent,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  error: {
    color: '#f87171',
    fontSize: 13,
  },
});

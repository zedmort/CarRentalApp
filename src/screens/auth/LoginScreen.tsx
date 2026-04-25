import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../services/supabase';
import { Button, Input, Divider } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Connexion échouée', error.message);
    // Navigation handled by auth state in _layout.tsx
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />

      {/* Decorative glow blob */}
      <View style={styles.glowBlob} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Logo area */}
          <View style={styles.logoArea}>
            <View style={styles.logoRing}>
              <Text style={styles.logoEmoji}>🚗</Text>
            </View>
            <Text style={styles.appName}>CarGo</Text>
            <Text style={styles.tagline}>وسيلتك بنقرة</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>
            <Text style={styles.cardSubtitle}>Bienvenue ! Connectez-vous pour continuer.</Text>

            <Input
              label="Email"
              placeholder="vous@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgot} onPress={() => router.push('/auth/forgot-password')}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <Button title="Se connecter" onPress={handleLogin} loading={loading} />

            <Divider label="ou" />

            <Button
              title="Créer un compte"
              onPress={() => router.push('/auth/register')}
              variant="secondary"
            />
          </View>

          <Text style={styles.legal}>
            En continuant, vous acceptez nos{' '}
            <Text style={{ color: Colors.primary }}>Conditions d'utilisation</Text>
            {' '}et notre{' '}
            <Text style={{ color: Colors.primary }}>Politique de confidentialité</Text>.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glowBlob: {
    position: 'absolute',
    top: -80,
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primary,
    opacity: 0.06,
  },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  logoArea: { alignItems: 'center', paddingTop: 80, paddingBottom: Spacing.xl },
  logoRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    borderWidth: 1.5, borderColor: Colors.primary + '50',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -1 },
  tagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.lg },
  forgot: { alignSelf: 'flex-end', marginBottom: Spacing.md, marginTop: -8 },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  legal: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.lg, lineHeight: 18 },
});

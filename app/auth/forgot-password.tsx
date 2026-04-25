import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { Button, Input } from '../../src/components/UI';
import { Colors, Spacing, Radius } from '../../src/constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) { Alert.alert('Erreur', 'Veuillez entrer votre email.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) Alert.alert('Erreur', error.message);
    else setSent(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: Spacing.lg }}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>

        {sent ? (
          <View style={styles.sentBox}>
            <Text style={{ fontSize: 56, marginBottom: Spacing.md }}>📧</Text>
            <Text style={styles.title}>Email envoyé !</Text>
            <Text style={styles.subtitle}>
              Vérifiez votre boîte mail et suivez le lien pour réinitialiser votre mot de passe.
            </Text>
            <Button title="Retour à la connexion" onPress={() => router.replace('/auth/login')} style={{ marginTop: Spacing.xl }} />
          </View>
        ) : (
          <>
            <Text style={styles.title}>Mot de passe oublié ?</Text>
            <Text style={styles.subtitle}>
              Entrez votre email et nous vous enverrons un lien de réinitialisation.
            </Text>
            <Input
              label="Email"
              placeholder="vous@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button title="Envoyer le lien" onPress={handleReset} loading={loading} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: Spacing.lg, paddingTop: 70 },
  back: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.xl },
  sentBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

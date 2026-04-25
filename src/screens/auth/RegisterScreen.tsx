import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../services/supabase';
import { Button, Input } from '../../components/UI';
import { WilayaPicker } from '../../components/WilayaPicker';
import { Colors, Spacing, Radius } from '../../constants/theme';

type Role = 'renter' | 'owner';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('renter');
  const [wilaya, setWilaya] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !phone || !email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, role, wilaya },
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    if (data.user) {
      // Profile is auto-created by trigger with metadata from signup
      Alert.alert(
        'Inscription réussie !',
        'Votre compte a été créé avec succès.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    }
  };

  const RoleCard = ({ r, label, emoji, desc }: { r: Role; label: string; emoji: string; desc: string }) => (
    <TouchableOpacity
      onPress={() => setRole(r)}
      activeOpacity={0.85}
      style={[styles.roleCard, role === r && styles.roleCardActive]}
    >
      {role === r && (
        <LinearGradient
          colors={[Colors.primary + '20', Colors.primary + '05']}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <Text style={styles.roleEmoji}>{emoji}</Text>
      <Text style={[styles.roleLabel, role === r && { color: Colors.primary }]}>{label}</Text>
      <Text style={styles.roleDesc}>{desc}</Text>
      {role === r && (
        <View style={styles.roleCheck}>
          <Text style={{ color: Colors.textInverse, fontSize: 10, fontWeight: '800' }}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez la communauté CarGo</Text>
          </View>

          {/* Role selection */}
          <Text style={styles.sectionLabel}>Je suis...</Text>
          <View style={styles.roleRow}>
            <RoleCard r="renter" label="Locataire" emoji="👤" desc="Je cherche une voiture" />
            <RoleCard r="owner" label="Propriétaire" emoji="🚗" desc="Je propose ma voiture" />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input label="Nom complet" placeholder="Mohamed Amari" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            <Input label="Téléphone" placeholder="06 12 34 56 78" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCapitalize="none" />
            <Input label="Email" placeholder="vous@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Mot de passe" placeholder="Min. 6 caractères" value={password} onChangeText={setPassword} secureTextEntry />
            <WilayaPicker label="Wilaya" value={wilaya} onChange={setWilaya} />
          </View>

          <Button title="Créer mon compte" onPress={handleRegister} loading={loading} />

          <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Déjà inscrit ? <Text style={{ color: Colors.primary }}>Se connecter</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { paddingTop: 60, paddingBottom: Spacing.lg },
  backBtn: { marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm, letterSpacing: 0.3 },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  roleCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  roleCardActive: { borderColor: Colors.primary },
  roleEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  roleLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  roleDesc: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  roleCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  form: { marginBottom: Spacing.md },
  loginLink: { alignItems: 'center', marginTop: Spacing.lg },
  loginText: { fontSize: 14, color: Colors.textSecondary },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, Badge } from '../components/UI';
import { Colors, Spacing, Radius } from '../constants/theme';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const [notifs, setNotifs] = useState(true);

  const handleSignOut = () => {
    Alert.alert('Se déconnecter ?', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: signOut },
    ]);
  };

  const MenuItem = ({
    emoji, label, subtitle, onPress, right, danger,
  }: { emoji: string; label: string; subtitle?: string; onPress?: () => void; right?: React.ReactNode; danger?: boolean }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} style={styles.menuItem}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Text style={styles.menuEmoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: Colors.danger }]}>{label}</Text>
        {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      {right ?? (onPress && <Text style={{ color: Colors.textMuted, fontSize: 16 }}>›</Text>)}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Profile hero */}
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <Text style={{ fontSize: 42 }}>👤</Text>
          </View>
          <Text style={styles.name}>{profile?.full_name ?? 'Utilisateur'}</Text>
          <Text style={styles.phone}>{profile?.phone ?? ''}</Text>
          <View style={styles.badgeRow}>
            <Badge
              label={profile?.role === 'owner' ? '🚗 Propriétaire' : '👤 Locataire'}
              color={profile?.role === 'owner' ? Colors.info : Colors.primary}
            />
            <Badge
              label={profile?.is_verified ? '✓ Vérifié' : '⏳ Non vérifié'}
              color={profile?.is_verified ? Colors.success : Colors.warning}
            />
          </View>
        </View>

        {/* Stats (owner) */}
        {profile?.role === 'owner' && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Locations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Note moyenne</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>1</Text>
              <Text style={styles.statLabel}>Voitures</Text>
            </View>
          </View>
        )}

        {/* Verification banner */}
        {!profile?.is_verified && (
          <TouchableOpacity onPress={() => router.push('/profile/verify')} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.warning + '30', Colors.warning + '10']} style={styles.verifyBanner}>
              <Text style={{ fontSize: 24 }}>🪪</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.verifyTitle}>Vérifiez votre identité</Text>
                <Text style={styles.verifySub}>Ajoutez votre CNI + permis pour accéder à toutes les fonctionnalités</Text>
              </View>
              <Text style={{ color: Colors.warning, fontSize: 18 }}>›</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Account section */}
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <Card style={styles.menuCard}>
          <MenuItem emoji="✏️" label="Modifier le profil" onPress={() => router.push('/profile/edit')} />
          <View style={styles.menuSep} />
          <MenuItem emoji="🪪" label="Documents d'identité" subtitle="CNI, Permis de conduire" onPress={() => router.push('/profile/verify')} />
          <View style={styles.menuSep} />
          <MenuItem emoji="📍" label="Ma wilaya" subtitle={profile?.wilaya ?? 'Non définie'} onPress={() => router.push('/profile/edit')} />
        </Card>

        {/* Owner section */}
        {profile?.role === 'owner' && (
          <>
            <Text style={styles.sectionTitle}>Mes voitures</Text>
            <Card style={styles.menuCard}>
              <MenuItem emoji="🚗" label="Mes annonces" onPress={() => router.push('/cars/my-cars')} />
              <View style={styles.menuSep} />
              <MenuItem emoji="➕" label="Ajouter une voiture" onPress={() => router.push('/cars/add')} />
              <View style={styles.menuSep} />
              <MenuItem emoji="💰" label="Revenus" onPress={() => router.push('/profile/earnings')} />
            </Card>
          </>
        )}

        {/* Settings */}
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <Card style={styles.menuCard}>
          <MenuItem
            emoji="🔔" label="Notifications"
            right={<Switch value={notifs} onValueChange={setNotifs} trackColor={{ true: Colors.primary, false: Colors.border }} thumbColor="#fff" />}
          />
          <View style={styles.menuSep} />
          <MenuItem emoji="🌐" label="Langue" subtitle="Français / العربية" onPress={() => {}} />
          <View style={styles.menuSep} />
          <MenuItem emoji="🔒" label="Confidentialité" onPress={() => {}} />
          <View style={styles.menuSep} />
          <MenuItem emoji="❓" label="Aide & Support" onPress={() => {}} />
          <View style={styles.menuSep} />
          <MenuItem emoji="⭐" label="Noter l'application" onPress={() => {}} />
        </Card>

        {/* Sign out */}
        <Card style={[styles.menuCard, { marginTop: Spacing.sm }]}>
          <MenuItem emoji="🚪" label="Se déconnecter" onPress={handleSignOut} danger />
        </Card>

        <Text style={styles.version}>CarGo v1.0.0 · وسيلتك بنقرة</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.md },
  hero: { alignItems: 'center', paddingTop: 80, paddingBottom: Spacing.lg },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.surfaceLight, borderWidth: 2, borderColor: Colors.primary + '50',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  name: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  phone: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.sm },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },
  verifyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.warning + '40',
  },
  verifyTitle: { fontSize: 14, fontWeight: '700', color: Colors.warning },
  verifySub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.sm, textTransform: 'uppercase' },
  menuCard: { padding: 0, overflow: 'hidden', marginBottom: Spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  menuIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: Colors.danger + '20' },
  menuEmoji: { fontSize: 16 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  menuSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  menuSep: { height: 1, backgroundColor: Colors.border, marginLeft: 60 },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: Spacing.sm },
});

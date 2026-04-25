import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, Radius, Shadow } from '../../src/constants/theme';

interface Verification {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  id_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  role?: string;
}

interface Stats {
  users: number;
  owners: number;
  cars: number;
  bookings: number;
  pending: number;
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [stats, setStats] = useState<Stats>({ users: 0, owners: 0, cars: 0, bookings: 0, pending: 0 });
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');

  const loadData = useCallback(async () => {
    try {
      const [
        { count: userCount },
        { count: ownerCount },
        { count: carCount },
        { count: bookingCount },
        { count: pendingCount },
        { data: verifData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'owner'),
        supabase.from('cars').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('identity_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase
          .from('identity_verifications')
          .select('id, user_id, full_name, phone, id_number, status, created_at')
          .order('created_at', { ascending: false }),
      ]);

      setStats({
        users: userCount ?? 0,
        owners: ownerCount ?? 0,
        cars: carCount ?? 0,
        bookings: bookingCount ?? 0,
        pending: pendingCount ?? 0,
      });
      setVerifications(verifData ?? []);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const filtered = tab === 'pending'
    ? verifications.filter(v => v.status === 'pending')
    : verifications;

  const statusColor = (s: string) =>
    s === 'approved' ? Colors.success : s === 'rejected' ? Colors.danger : Colors.warning;

  const statusLabel = (s: string) =>
    s === 'approved' ? 'Approuvé' : s === 'rejected' ? 'Rejeté' : 'En attente';

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>CarGo</Text>
          <Text style={styles.headerSub}>Panneau administrateur</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
          <MaterialCommunityIcons name="logout" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="account-group" label="Utilisateurs" value={stats.users} color={Colors.info} />
          <StatCard icon="car-key" label="Propriétaires" value={stats.owners} color={Colors.primary} />
          <StatCard icon="car-multiple" label="Voitures" value={stats.cars} color="#A78BFA" />
          <StatCard icon="calendar-check" label="Réservations" value={stats.bookings} color={Colors.success} />
        </View>

        {/* Pending badge */}
        {stats.pending > 0 && (
          <View style={styles.alertBanner}>
            <MaterialCommunityIcons name="bell-ring" size={18} color={Colors.warning} />
            <Text style={styles.alertText}>
              {stats.pending} demande{stats.pending > 1 ? 's' : ''} en attente de validation
            </Text>
          </View>
        )}

        {/* Verifications section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demandes d'identité</Text>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'pending' && styles.tabBtnActive]}
              onPress={() => setTab('pending')}
            >
              <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
                En attente ({stats.pending})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'all' && styles.tabBtnActive]}
              onPress={() => setTab('all')}
            >
              <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>
                Toutes ({verifications.length})
              </Text>
            </TouchableOpacity>
          </View>

          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="check-decagram" size={36} color={Colors.success} />
              <Text style={styles.emptyText}>Aucune demande en attente</Text>
            </View>
          ) : (
            filtered.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={styles.card}
                onPress={() => router.push(`/(admin)/verify/${v.id}`)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardAvatar, { backgroundColor: statusColor(v.status) + '20' }]}>
                  <MaterialCommunityIcons name="account" size={22} color={statusColor(v.status)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{v.full_name}</Text>
                  <Text style={styles.cardSub}>
                    {v.phone} · {new Date(v.created_at).toLocaleDateString('fr-DZ')}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(v.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor(v.status) }]}>
                    {statusLabel(v.status)}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <View style={[styles.statIconBox, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 56,
    paddingBottom: Spacing.md,
  },
  appName: { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  signOutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 6,
    ...Shadow.card,
  },
  statIconBox: {
    width: 40, height: 40, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.warning + '15',
    borderWidth: 1,
    borderColor: Colors.warning + '35',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  alertText: { fontSize: 13, color: Colors.warning, fontWeight: '600' },
  section: { paddingHorizontal: Spacing.md },
  sectionTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.md,
    gap: 4,
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: Radius.sm, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.textInverse },
  emptyBox: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 40, gap: Spacing.sm,
  },
  emptyText: { fontSize: 14, color: Colors.textMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  cardAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
});

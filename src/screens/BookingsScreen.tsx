import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { ScreenHeader } from '../components/UI';
import { Colors, Spacing, Radius, BOOKING_STATUS } from '../constants/theme';

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  created_at: string;
  renter_id: string;
  owner_id: string;
  cars: { brand: string; model: string; year: number; images: string[] };
  renter: { full_name: string; phone: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'En attente', color: Colors.warning, icon: 'clock-outline' },
  accepted: { label: 'Accepté', color: Colors.success, icon: 'check-circle-outline' },
  rejected: { label: 'Refusé', color: Colors.danger, icon: 'close-circle-outline' },
  active: { label: 'En cours', color: Colors.info, icon: 'car-clock' },
  completed: { label: 'Terminé', color: Colors.textMuted, icon: 'flag-checkered' },
  cancelled: { label: 'Annulé', color: Colors.danger, icon: 'cancel' },
};

export default function BookingsScreen() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  const fetchBookings = async () => {
    const isOwner = profile?.role === 'owner';
    const field = isOwner ? 'owner_id' : 'renter_id';

    const { data } = await supabase
      .from('bookings')
      .select('*, cars(brand, model, year, images), renter:profiles!bookings_renter_id_fkey(full_name, phone)')
      .eq(field, profile?.id)
      .order('created_at', { ascending: false });

    if (data) setBookings(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { if (profile) fetchBookings(); }, [profile]);

  const handleAccept = async (id: string) => {
    await supabase.from('bookings').update({ status: 'accepted' }).eq('id', id);
    fetchBookings();
    Alert.alert('✅ Réservation acceptée !', 'Le locataire a été notifié.');
  };

  const handleReject = async (id: string) => {
    Alert.alert('Refuser la réservation ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser', style: 'destructive',
        onPress: async () => {
          await supabase.from('bookings').update({ status: 'rejected' }).eq('id', id);
          fetchBookings();
        },
      },
    ]);
  };

  const filtered = tab === 'all' ? bookings : bookings.filter(b => {
    if (tab === 'pending') return b.status === 'pending';
    if (tab === 'active') return ['accepted', 'active'].includes(b.status);
    if (tab === 'completed') return ['completed', 'cancelled', 'rejected'].includes(b.status);
    return true;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' });
  const daysDiff = (a: string, b: string) => Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const status = STATUS_CONFIG[booking.status] ?? { label: booking.status, color: Colors.textMuted, icon: 'help-circle-outline' };
    const days = daysDiff(booking.start_date, booking.end_date);
    const isPending = booking.status === 'pending' && profile?.role === 'owner';

    return (
      <View style={[styles.bookingCard, { borderLeftColor: status.color }]}>
        {/* Car + status header */}
        <View style={styles.cardHeader}>
          <View style={[styles.carIconWrap, { backgroundColor: status.color + '18' }]}>
            <MaterialCommunityIcons name="car-outline" size={22} color={status.color} />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={styles.carName}>
              {booking.cars?.brand} {booking.cars?.model} {booking.cars?.year}
            </Text>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar-range-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.dateRange}>
                {'  '}{formatDate(booking.start_date)} → {formatDate(booking.end_date)}
              </Text>
              <View style={styles.daysPill}>
                <Text style={styles.daysText}>{days}j</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { borderColor: status.color + '50', backgroundColor: status.color + '15' }]}>
            <MaterialCommunityIcons name={status.icon as any} size={11} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Renter info (for owners) */}
        {profile?.role === 'owner' && booking.renter && (
          <View style={styles.renterRow}>
            <View style={styles.renterAvatar}>
              <MaterialCommunityIcons name="account" size={15} color={Colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.renterName}>{booking.renter.full_name}</Text>
              <Text style={styles.renterPhone}>{booking.renter.phone}</Text>
            </View>
            <View style={styles.callBtn}>
              <MaterialCommunityIcons name="phone" size={14} color={Colors.primary} />
            </View>
          </View>
        )}

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>{booking.total_price?.toLocaleString()} DA</Text>
        </View>

        {/* Owner actions */}
        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(booking.id)}>
              <MaterialCommunityIcons name="close" size={15} color={Colors.danger} />
              <Text style={styles.rejectBtnText}>Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(booking.id)} activeOpacity={0.85}>
              <LinearGradient colors={[Colors.success, '#27AE60']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.acceptGradient}>
                <MaterialCommunityIcons name="check" size={15} color="#fff" />
                <Text style={styles.acceptBtnText}>Accepter</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const tabs = [
    { key: 'all', label: 'Tout', icon: 'view-list-outline' },
    { key: 'pending', label: 'En attente', icon: 'clock-outline' },
    { key: 'active', label: 'Actif', icon: 'car-clock' },
    { key: 'completed', label: 'Terminé', icon: 'check-all' },
  ] as const;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />

      <ScreenHeader
        title="Réservations"
        subtitle={`${bookings.filter(b => b.status === 'pending').length} en attente`}
      />

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key as any)}
              style={[styles.tabChip, active && styles.tabChipActive]}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={t.icon as any}
                size={13}
                color={active ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} tintColor={Colors.primary} />}
      >
        {loading ? (
          <View style={styles.empty}>
            <Text style={{ color: Colors.textMuted, fontSize: 14 }}>Chargement...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Aucune réservation</Text>
            <Text style={styles.emptyText}>Vos réservations apparaîtront ici.</Text>
          </View>
        ) : (
          filtered.map(b => <BookingCard key={b.id} booking={b} />)
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabs: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.sm },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tabChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  // Card
  bookingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  carIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateRange: { fontSize: 12, color: Colors.textMuted },
  daysPill: {
    marginLeft: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  daysText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: Spacing.sm,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  renterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.md,
    padding: 10,
  },
  renterAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renterName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  renterPhone: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  callBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  priceLabel: { fontSize: 13, color: Colors.textSecondary },
  priceValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  rejectBtnText: { color: Colors.danger, fontWeight: '700', fontSize: 14 },
  acceptBtn: { flex: 2, borderRadius: Radius.md, overflow: 'hidden' },
  acceptGradient: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});

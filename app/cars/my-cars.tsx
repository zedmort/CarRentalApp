import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, Radius, Shadow, CAR_CATEGORIES } from '../../src/constants/theme';

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  wilaya: string;
  images: string[];
  category: string;
  with_driver: boolean;
  is_available: boolean;
  created_at: string;
}

export default function MyCarsScreen() {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyCars = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('cars')
      .select('id, brand, model, year, price_per_day, wilaya, images, category, with_driver, is_available, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setCars(data);
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { fetchMyCars(); }, [fetchMyCars]);

  const toggleAvailability = async (car: Car) => {
    const next = !car.is_available;
    const { error } = await supabase
      .from('cars')
      .update({ is_available: next })
      .eq('id', car.id);
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      setCars(prev => prev.map(c => c.id === car.id ? { ...c, is_available: next } : c));
    }
  };

  const confirmDelete = (carId: string) => {
    Alert.alert(
      'Supprimer l\'annonce',
      'Cette action est irréversible. Voulez-vous continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('cars').delete().eq('id', carId);
            if (error) Alert.alert('Erreur', error.message);
            else setCars(prev => prev.filter(c => c.id !== carId));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <LinearGradient colors={['#0A0A0F', 'transparent']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mes annonces</Text>
        <TouchableOpacity onPress={() => router.push('/cars/add')} style={styles.addBtn}>
          <MaterialCommunityIcons name="plus" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyCars(); }} tintColor={Colors.primary} />}
      >
        {loading ? (
          <View style={styles.empty}>
            <Text style={{ color: Colors.textMuted }}>Chargement...</Text>
          </View>
        ) : cars.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="car-plus-outline" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Aucune annonce</Text>
            <Text style={styles.emptyText}>Publiez votre première voiture pour commencer à louer.</Text>
            <TouchableOpacity onPress={() => router.push('/cars/add')} style={styles.ctaBtn}>
              <Text style={styles.ctaBtnText}>+ Ajouter une voiture</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cars.map(car => (
            <View key={car.id} style={styles.card}>
              <View style={styles.imageWrap}>
                {car.images?.[0] ? (
                  <Image source={{ uri: car.images[0] }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <MaterialCommunityIcons name="car-outline" size={40} color={Colors.textMuted} />
                  </View>
                )}
                <View style={[styles.statusBadge, car.is_available ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusText}>{car.is_available ? 'Disponible' : 'Indisponible'}</Text>
                </View>
              </View>

              <View style={styles.info}>
                <View style={styles.titleRow}>
                  <Text style={styles.carName}>{car.brand} {car.model}</Text>
                  <Text style={styles.catIcon}>
                    {CAR_CATEGORIES.find(c => c.id === car.category)?.icon ?? '🚗'}
                  </Text>
                </View>
                <Text style={styles.meta}>
                  {car.year} · {car.wilaya} · {car.price_per_day.toLocaleString()} DA/j
                </Text>
                {car.with_driver && (
                  <Text style={styles.driverTag}>👨‍✈️ Avec chauffeur</Text>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.toggleBtn]}
                    onPress={() => toggleAvailability(car)}
                  >
                    <MaterialCommunityIcons
                      name={car.is_available ? 'eye-off-outline' : 'eye-outline'}
                      size={16}
                      color={Colors.textPrimary}
                    />
                    <Text style={styles.actionText}>
                      {car.is_available ? 'Désactiver' : 'Activer'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => confirmDelete(car.id)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.danger} />
                    <Text style={[styles.actionText, { color: Colors.danger }]}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  list: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadow.card,
  },
  imageWrap: { height: 160, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  statusBadge: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusActive: { backgroundColor: Colors.success + 'CC' },
  statusInactive: { backgroundColor: Colors.danger + 'CC' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  info: { padding: Spacing.md, gap: 6 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  catIcon: { fontSize: 20 },
  meta: { fontSize: 13, color: Colors.textSecondary },
  driverTag: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: Radius.md,
    borderWidth: 1,
  },
  toggleBtn: { borderColor: Colors.border, backgroundColor: Colors.surfaceLight },
  deleteBtn: { borderColor: Colors.danger + '50', backgroundColor: Colors.danger + '10' },
  actionText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md, paddingHorizontal: Spacing.xl },
  ctaBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: 12,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
  },
  ctaBtnText: { fontSize: 14, fontWeight: '800', color: Colors.textInverse },
});

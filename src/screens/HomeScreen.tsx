import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, RefreshControl, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { CAR_CATEGORIES } from '../constants/theme';

interface Car {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  wilaya: string;
  images: string[];
  category: string;
  transmission: string;
  seats: number;
  is_available: boolean;
  profiles: { full_name: string; avatar_url: string | null };
}

export default function HomeScreen() {
  const { profile } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [filtered, setFiltered] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchCars = async () => {
    const { data } = await supabase
      .from('cars')
      .select('*, profiles(full_name, avatar_url)')
      .eq('is_available', true)
      .order('created_at', { ascending: false });
    if (data) { setCars(data); setFiltered(data); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchCars(); }, []);

  useEffect(() => {
    let result = cars;
    if (search) result = result.filter(c =>
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.model.toLowerCase().includes(search.toLowerCase()) ||
      c.wilaya.toLowerCase().includes(search.toLowerCase())
    );
    if (selectedCategory) result = result.filter(c => c.category === selectedCategory);
    setFiltered(result);
  }, [search, selectedCategory, cars]);

  const CarCard = ({ car }: { car: Car }) => (
    <TouchableOpacity
      style={styles.carCard}
      activeOpacity={0.92}
      onPress={() => router.push({ pathname: '/cars/[id]', params: { id: car.id } })}
    >
      {/* Image */}
      <View style={styles.carImageContainer}>
        {car.images?.[0] ? (
          <Image source={{ uri: car.images[0] }} style={styles.carImage} resizeMode="cover" />
        ) : (
          <View style={[styles.carImage, styles.carImagePlaceholder]}>
            <MaterialCommunityIcons name="car-outline" size={56} color={Colors.textMuted} />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(10,10,15,0.85)']} style={styles.carImageOverlay} />
        {/* Location */}
        <View style={styles.locationBadge}>
          <MaterialCommunityIcons name="map-marker" size={11} color={Colors.primary} />
          <Text style={styles.locationText}>{car.wilaya}</Text>
        </View>
        {/* Price on image */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeAmount}>{car.price_per_day.toLocaleString()}</Text>
          <Text style={styles.priceBadgeCurrency}> DA/j</Text>
        </View>
        {!car.is_available && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>Indisponible</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.carInfo}>
        <Text style={styles.carTitle}>{car.brand} {car.model}</Text>

        {/* Specs row */}
        <View style={styles.specsRow}>
          <View style={styles.specPill}>
            <MaterialCommunityIcons name="calendar-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.specText}>{car.year}</Text>
          </View>
          <View style={styles.specPill}>
            <MaterialCommunityIcons name="car-shift-pattern" size={11} color={Colors.textMuted} />
            <Text style={styles.specText}>{car.transmission}</Text>
          </View>
          <View style={styles.specPill}>
            <MaterialCommunityIcons name="account-group-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.specText}>{car.seats} pl.</Text>
          </View>
        </View>

        {/* Owner */}
        <View style={styles.ownerRow}>
          <View style={styles.ownerAvatar}>
            <Text style={styles.ownerInitial}>
              {car.profiles?.full_name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.ownerName}>{car.profiles?.full_name}</Text>
          <View style={styles.ratingPill}>
            <MaterialCommunityIcons name="star" size={11} color={Colors.warning} />
            <Text style={styles.ratingText}>4.8</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCars(); }} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <LinearGradient colors={['#0A0A0F', 'transparent']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Bonjour, {profile?.full_name?.split(' ')[0] ?? 'là'} 👋</Text>
              <Text style={styles.headerSub}>Trouvez votre prochaine voiture</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarBtn}>
              <MaterialCommunityIcons name="account-outline" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Chercher une voiture, wilaya..."
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            style={[styles.catChip, !selectedCategory && styles.catChipActive]}
          >
            <Text style={[styles.catLabel, !selectedCategory && styles.catLabelActive]}>Tout</Text>
          </TouchableOpacity>
          {CAR_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
            >
              <Text style={styles.catEmoji}>{cat.icon}</Text>
              <Text style={[styles.catLabel, selectedCategory === cat.id && styles.catLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results count */}
        <View style={styles.resultsRow}>
          <Text style={styles.resultsCount}>{filtered.length} voiture{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}</Text>
          {profile?.role === 'owner' && (
            <TouchableOpacity onPress={() => router.push('/cars/add')} style={styles.addCarBtn}>
              <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addCarGradient}>
                <MaterialCommunityIcons name="plus" size={14} color={Colors.textInverse} />
                <Text style={styles.addCarText}>Ajouter</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Car list */}
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={{ color: Colors.textMuted, fontSize: 14 }}>Chargement...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="car-off" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Aucune voiture disponible</Text>
            <Text style={styles.emptyText}>Revenez plus tard ou modifiez vos filtres.</Text>
          </View>
        ) : (
          <View style={styles.carList}>
            {filtered.map(car => <CarCard key={car.id} car={car} />)}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, height: 50,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  categories: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  catEmoji: { fontSize: 13 },
  catLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  catLabelActive: { color: Colors.primary },
  resultsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  resultsCount: { fontSize: 13, color: Colors.textMuted },
  addCarBtn: { borderRadius: Radius.full, overflow: 'hidden' },
  addCarGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addCarText: { fontSize: 13, fontWeight: '700', color: Colors.textInverse },
  carList: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  carCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadow.card,
  },
  carImageContainer: { height: 180, position: 'relative' },
  carImage: { width: '100%', height: '100%' },
  carImagePlaceholder: { backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  carImageOverlay: { ...StyleSheet.absoluteFillObject },
  locationBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(10,10,15,0.72)',
    borderRadius: Radius.full,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  locationText: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary },
  priceBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'baseline',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  priceBadgeAmount: { fontSize: 13, fontWeight: '800', color: Colors.textInverse },
  priceBadgeCurrency: { fontSize: 10, fontWeight: '600', color: Colors.textInverse + 'CC' },
  unavailableBadge: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: Colors.danger + 'CC', borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  unavailableText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  carInfo: { padding: Spacing.md, gap: 8 },
  carTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  specsRow: { flexDirection: 'row', gap: 6 },
  specPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  specText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  ownerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: 8,
  },
  ownerAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary + '25',
    borderWidth: 1, borderColor: Colors.primary + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  ownerInitial: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  ownerName: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.warning + '15',
    borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 3,
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: Colors.warning },
  emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});

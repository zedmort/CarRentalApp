import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, RefreshControl, TextInput, Modal, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Colors, Spacing, Radius, Shadow, CAR_CATEGORIES, DRIVER_OPTIONS, WILAYAS } from '../constants/theme';

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  wilaya: string;
  images: string[];
  category: string;
  transmission: string;
  fuel: string;
  seats: number;
  with_driver: boolean;
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
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const [driverFilter, setDriverFilter] = useState<'all' | 'with' | 'without'>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [wilayaModal, setWilayaModal] = useState(false);

  // Owner view: show MY cars tab
  const [ownerTab, setOwnerTab] = useState<'browse' | 'mine'>('browse');
  const [myCars, setMyCars] = useState<Car[]>([]);

  const fetchCars = useCallback(async () => {
    const { data } = await supabase
      .from('cars')
      .select('*, profiles(full_name, avatar_url)')
      .eq('is_available', true)
      .order('created_at', { ascending: false });
    if (data) { setCars(data); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const fetchMyCars = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('cars')
      .select('*, profiles(full_name, avatar_url)')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setMyCars(data);
  }, [profile?.id]);

  useEffect(() => { fetchCars(); }, [fetchCars]);
  useEffect(() => { if (profile?.role === 'owner') fetchMyCars(); }, [fetchMyCars, profile?.role]);

  useEffect(() => {
    let result = cars;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        c.wilaya.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) result = result.filter(c => c.category === selectedCategory);
    if (selectedWilaya) result = result.filter(c => c.wilaya === selectedWilaya);
    if (driverFilter === 'with') result = result.filter(c => c.with_driver === true);
    if (driverFilter === 'without') result = result.filter(c => c.with_driver === false);
    if (minPrice) result = result.filter(c => c.price_per_day >= parseFloat(minPrice));
    if (maxPrice) result = result.filter(c => c.price_per_day <= parseFloat(maxPrice));
    setFiltered(result);
  }, [search, selectedCategory, selectedWilaya, driverFilter, minPrice, maxPrice, cars]);

  const activeFiltersCount = [selectedCategory, selectedWilaya, driverFilter !== 'all', minPrice, maxPrice].filter(Boolean).length;

  const CarCard = ({ car, showStatus }: { car: Car; showStatus?: boolean }) => (
    <TouchableOpacity
      style={styles.carCard}
      activeOpacity={0.92}
      onPress={() => router.push({ pathname: '/cars/[id]', params: { id: car.id } })}
    >
      <View style={styles.carImageContainer}>
        {car.images?.[0] ? (
          <Image source={{ uri: car.images[0] }} style={styles.carImage} resizeMode="cover" />
        ) : (
          <View style={[styles.carImage, styles.carImagePlaceholder]}>
            <MaterialCommunityIcons name="car-outline" size={56} color={Colors.textMuted} />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(10,10,15,0.85)']} style={styles.carImageOverlay} />
        <View style={styles.locationBadge}>
          <MaterialCommunityIcons name="map-marker" size={11} color={Colors.primary} />
          <Text style={styles.locationText}>{car.wilaya}</Text>
        </View>
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeAmount}>{car.price_per_day.toLocaleString()}</Text>
          <Text style={styles.priceBadgeCurrency}> DA/j</Text>
        </View>
        {car.with_driver && (
          <View style={styles.driverBadge}>
            <Text style={styles.driverBadgeText}>👨‍✈️ Avec chauffeur</Text>
          </View>
        )}
        {showStatus && !car.is_available && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>Indisponible</Text>
          </View>
        )}
      </View>
      <View style={styles.carInfo}>
        <View style={styles.carTitleRow}>
          <Text style={styles.carTitle}>{car.brand} {car.model}</Text>
          <Text style={styles.catBadge}>
            {CAR_CATEGORIES.find(c => c.id === car.category)?.icon ?? '🚗'}
          </Text>
        </View>
        <View style={styles.specsRow}>
          <View style={styles.specPill}>
            <MaterialCommunityIcons name="calendar-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.specText}>{car.year}</Text>
          </View>
          <View style={styles.specPill}>
            <MaterialCommunityIcons name="car-shift-pattern" size={11} color={Colors.textMuted} />
            <Text style={styles.specText}>{car.transmission === 'automatic' ? 'Auto' : 'Manuel'}</Text>
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

  const isOwner = profile?.role === 'owner';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCars(); if (isOwner) fetchMyCars(); }} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <LinearGradient colors={['#0A0A0F', 'transparent']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Bonjour, {profile?.full_name?.split(' ')[0] ?? 'là'} 👋</Text>
              <Text style={styles.headerSub}>{isOwner ? 'Gérez vos annonces ou explorez' : 'Trouvez votre prochaine voiture'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarBtn}>
              <MaterialCommunityIcons name="account-outline" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Owner tabs */}
          {isOwner && (
            <View style={styles.tabRow}>
              <TouchableOpacity
                onPress={() => setOwnerTab('browse')}
                style={[styles.tab, ownerTab === 'browse' && styles.tabActive]}
              >
                <Text style={[styles.tabText, ownerTab === 'browse' && styles.tabTextActive]}>🔍 Explorer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setOwnerTab('mine')}
                style={[styles.tab, ownerTab === 'mine' && styles.tabActive]}
              >
                <Text style={[styles.tabText, ownerTab === 'mine' && styles.tabTextActive]}>🚗 Mes annonces {myCars.length > 0 ? `(${myCars.length})` : ''}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search bar — only for browse tab */}
          {ownerTab === 'browse' && (
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Marque, modèle ou wilaya..."
                  placeholderTextColor={Colors.textMuted}
                  style={styles.searchInput}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setShowFilters(!showFilters)}
                style={[styles.filterBtn, activeFiltersCount > 0 && styles.filterBtnActive]}
              >
                <MaterialCommunityIcons name="tune-variant" size={20} color={activeFiltersCount > 0 ? Colors.textInverse : Colors.textPrimary} />
                {activeFiltersCount > 0 && <Text style={styles.filterBadge}>{activeFiltersCount}</Text>}
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* ── MY CARS TAB (owner only) ── */}
        {ownerTab === 'mine' ? (
          <View style={{ paddingHorizontal: Spacing.md }}>
            <View style={styles.resultsRow}>
              <Text style={styles.resultsCount}>{myCars.length} annonce{myCars.length !== 1 ? 's' : ''}</Text>
              <TouchableOpacity onPress={() => router.push('/cars/add')} style={styles.addCarBtn}>
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addCarGradient}>
                  <MaterialCommunityIcons name="plus" size={14} color={Colors.textInverse} />
                  <Text style={styles.addCarText}>Ajouter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            {myCars.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <MaterialCommunityIcons name="car-plus-outline" size={40} color={Colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>Aucune annonce</Text>
                <Text style={styles.emptyText}>Publiez votre première voiture et commencez à louer.</Text>
                <TouchableOpacity onPress={() => router.push('/cars/add')} style={styles.ctaBtn}>
                  <Text style={styles.ctaBtnText}>+ Ajouter une voiture</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.carList}>
                {myCars.map(car => <CarCard key={car.id} car={car} showStatus />)}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* ── FILTER PANEL ── */}
            {showFilters && (
              <View style={styles.filterPanel}>
                {/* Wilaya */}
                <Text style={styles.filterLabel}>📍 Wilaya</Text>
                <TouchableOpacity style={styles.wilayaSelector} onPress={() => setWilayaModal(true)}>
                  <Text style={[styles.wilayaSelectorText, !selectedWilaya && { color: Colors.textMuted }]}>
                    {selectedWilaya ?? 'Toutes les wilayas'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
                {selectedWilaya && (
                  <TouchableOpacity onPress={() => setSelectedWilaya(null)} style={styles.clearBtn}>
                    <Text style={styles.clearBtnText}>Effacer wilaya</Text>
                  </TouchableOpacity>
                )}

                {/* Price range */}
                <Text style={[styles.filterLabel, { marginTop: Spacing.md }]}>💰 Prix / jour (DA)</Text>
                <View style={styles.priceRow}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    placeholderTextColor={Colors.textMuted}
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                  />
                  <Text style={{ color: Colors.textMuted, marginHorizontal: 8 }}>—</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    placeholderTextColor={Colors.textMuted}
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                  />
                </View>

                {/* Driver option */}
                <Text style={[styles.filterLabel, { marginTop: Spacing.md }]}>🚗 Type de service</Text>
                <View style={styles.chipRow}>
                  {DRIVER_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setDriverFilter(opt.id as any)}
                      style={[styles.filterChip, driverFilter === opt.id && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterChipText, driverFilter === opt.id && styles.filterChipTextActive]}>
                        {opt.icon} {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Reset */}
                {activeFiltersCount > 0 && (
                  <TouchableOpacity
                    onPress={() => { setSelectedWilaya(null); setMinPrice(''); setMaxPrice(''); setDriverFilter('all'); setSelectedCategory(null); }}
                    style={styles.resetBtn}
                  >
                    <Text style={styles.resetBtnText}>Réinitialiser tous les filtres</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

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
              {isOwner && (
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
                <Text style={styles.emptyTitle}>Aucune voiture trouvée</Text>
                <Text style={styles.emptyText}>Modifiez vos filtres ou revenez plus tard.</Text>
              </View>
            ) : (
              <View style={styles.carList}>
                {filtered.map(car => <CarCard key={car.id} car={car} />)}
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Wilaya picker modal */}
      <Modal visible={wilayaModal} transparent animationType="slide" onRequestClose={() => setWilayaModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir une wilaya</Text>
              <TouchableOpacity onPress={() => setWilayaModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={WILAYAS}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.wilayaItem, selectedWilaya === item && styles.wilayaItemActive]}
                  onPress={() => { setSelectedWilaya(item); setWilayaModal(false); }}
                >
                  <Text style={[styles.wilayaItemText, selectedWilaya === item && { color: Colors.primary }]}>{item}</Text>
                  {selectedWilaya === item && <MaterialCommunityIcons name="check" size={16} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: Radius.md, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  tabTextActive: { color: Colors.textInverse },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, height: 50,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  filterBtn: {
    width: 50, height: 50, borderRadius: Radius.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterBadge: {
    position: 'absolute', top: 6, right: 6, width: 16, height: 16,
    borderRadius: 8, backgroundColor: Colors.danger,
    fontSize: 10, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 16,
  },
  filterPanel: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  filterLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm, letterSpacing: 0.5 },
  wilayaSelector: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surfaceLight, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  wilayaSelectorText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  clearBtn: { marginTop: 6, alignSelf: 'flex-start' },
  clearBtnText: { fontSize: 12, color: Colors.danger, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  priceInput: {
    flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.primary },
  resetBtn: {
    marginTop: Spacing.md, alignItems: 'center',
    paddingVertical: 10, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.danger + '50',
    backgroundColor: Colors.danger + '10',
  },
  resetBtnText: { fontSize: 13, fontWeight: '700', color: Colors.danger },
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
  addCarGradient: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8 },
  addCarText: { fontSize: 13, fontWeight: '700', color: Colors.textInverse },
  carList: { paddingHorizontal: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.md },
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
    backgroundColor: 'rgba(10,10,15,0.75)', borderRadius: Radius.full,
    paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border,
  },
  locationText: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary },
  priceBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'baseline',
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  priceBadgeAmount: { fontSize: 13, fontWeight: '800', color: Colors.textInverse },
  priceBadgeCurrency: { fontSize: 10, fontWeight: '600', color: Colors.textInverse + 'CC' },
  driverBadge: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(10,10,15,0.85)', borderRadius: Radius.full,
    paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary + '40',
  },
  driverBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  unavailableBadge: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: Colors.danger + 'CC', borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  unavailableText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  carInfo: { padding: Spacing.md, gap: 8 },
  carTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  catBadge: { fontSize: 20 },
  specsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  specPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceLight, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border,
  },
  specText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  ownerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8,
  },
  ownerAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary + '25', borderWidth: 1, borderColor: Colors.primary + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  ownerInitial: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  ownerName: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.warning + '15', borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: Colors.warning },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md },
  ctaBtn: {
    marginTop: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: 12,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
  },
  ctaBtnText: { fontSize: 14, fontWeight: '800', color: Colors.textInverse },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  wilayaItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  wilayaItemActive: { backgroundColor: Colors.primary + '10' },
  wilayaItemText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
});

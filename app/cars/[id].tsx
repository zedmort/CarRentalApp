import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, Dimensions, Platform, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, Radius, Shadow } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  wilaya: string;
  description: string;
  images: string[];
  category: string;
  transmission: string;
  fuel: string;
  seats: number;
  is_available: boolean;
  owner_id: string;
  profiles: { full_name: string; phone: string; avatar_url: string | null; wilaya: string };
}

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, user } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchCar = async () => {
      const { data } = await supabase
        .from('cars')
        .select('*, profiles(full_name, phone, avatar_url, wilaya)')
        .eq('id', id)
        .single();
      if (data) setCar(data);
      setLoading(false);
    };
    fetchCar();
  }, [id]);

  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  const handleBook = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Dates manquantes', 'Veuillez choisir les dates de debut et de fin.');
      return;
    }
    const days = calcDays();
    if (days <= 0) {
      Alert.alert('Dates invalides', 'La date de fin doit etre apres la date de debut.');
      return;
    }
    setBookingLoading(true);
    const totalPrice = days * (car?.price_per_day ?? 0);
    const commission = totalPrice * 0.1;
    const { error } = await supabase.from('bookings').insert({
      car_id: car?.id,
      renter_id: user?.id,
      owner_id: car?.owner_id,
      start_date: startDate,
      end_date: endDate,
      total_price: totalPrice,
      commission,
      status: 'pending',
    });
    setBookingLoading(false);
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert(
        'Demande envoyee !',
        'Le proprietaire a ete notifie. Attendez sa reponse.',
        [{ text: 'Voir mes reservations', onPress: () => router.replace('/(tabs)/bookings') }],
      );
    }
  };

  if (loading || !car) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />
        <MaterialCommunityIcons name="car-clock" size={40} color={Colors.textMuted} />
        <Text style={{ color: Colors.textMuted, marginTop: 12 }}>Chargement...</Text>
      </View>
    );
  }

  const days = calcDays();
  const isOwner = user?.id === car.owner_id;
  const totalPrice = days * car.price_per_day;
  const commission = totalPrice * 0.1;
  const grandTotal = totalPrice + commission;

  const Spec = ({ icon, label, value }: { icon: MCIName; label: string; value: string }) => (
    <View style={styles.specItem}>
      <View style={styles.specIconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={Colors.primary} />
      </View>
      <Text style={styles.specValue}>{value}</Text>
      <Text style={styles.specLabel}>{label}</Text>
    </View>
  );

  const DateField = ({
    label, value, onChange, icon,
  }: { label: string; value: string; onChange: (v: string) => void; icon: MCIName }) => (
    <View style={styles.dateFieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.dateInputWrap}>
        <MaterialCommunityIcons name={icon} size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="AAAA-MM-JJ"
          placeholderTextColor={Colors.textMuted}
          style={styles.dateInputText}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.gallery}>
          {car.images?.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))
              }
            >
              {car.images.map((img, i) => (
                <Image key={i} source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.galleryImage, styles.galleryPlaceholder]}>
              <MaterialCommunityIcons name="car-outline" size={72} color={Colors.textMuted} />
            </View>
          )}
          <LinearGradient
            colors={['rgba(10,10,15,0.65)', 'transparent', 'rgba(10,10,15,0.5)']}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          {car.images?.length > 1 && (
            <View style={styles.dots}>
              {car.images.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
              ))}
            </View>
          )}
          <View
            style={[
              styles.availChip,
              { backgroundColor: car.is_available ? Colors.success + 'DD' : Colors.danger + 'DD' },
            ]}
          >
            <MaterialCommunityIcons
              name={car.is_available ? 'check-circle' : 'close-circle'}
              size={12}
              color="#fff"
            />
            <Text style={styles.availText}>
              {car.is_available ? 'Disponible' : 'Indisponible'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <View style={{ flex: 1 }}>
              <Text style={styles.carTitle}>{car.brand} {car.model}</Text>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.carMeta}>{car.wilaya}</Text>
                <Text style={styles.metaDot}>.</Text>
                <MaterialCommunityIcons name="calendar-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.carMeta}>{car.year}</Text>
              </View>
            </View>
            <View style={styles.priceChip}>
              <Text style={styles.priceChipAmount}>{car.price_per_day?.toLocaleString()}</Text>
              <Text style={styles.priceChipUnit}>DA/j</Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <MaterialCommunityIcons
                key={s}
                name={s <= 4 ? 'star' : 'star-half-full'}
                size={14}
                color={Colors.warning}
              />
            ))}
            <Text style={styles.ratingLabel}>4.8 - 24 avis</Text>
          </View>

          <View style={styles.specsCard}>
            <Spec
              icon="car-shift-pattern"
              label="Boite"
              value={car.transmission === 'manual' ? 'Manuelle' : 'Auto'}
            />
            <View style={styles.specDivider} />
            <Spec
              icon="gas-station"
              label="Carburant"
              value={car.fuel === 'diesel' ? 'Diesel' : car.fuel === 'electrique' ? 'Electrique' : 'Essence'}
            />
            <View style={styles.specDivider} />
            <Spec icon="account-group-outline" label="Places" value={String(car.seats)} />
            <View style={styles.specDivider} />
            <Spec icon="tag-outline" label="Categorie" value={car.category} />
          </View>

          {car.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>A propos</Text>
              <Text style={styles.descText}>{car.description}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proprietaire</Text>
            <View style={styles.ownerRow}>
              <View style={styles.ownerAvatar}>
                <Text style={styles.ownerInitial}>
                  {car.profiles?.full_name?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerName}>{car.profiles?.full_name}</Text>
                <View style={styles.ownerLocRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.ownerLoc}>{car.profiles?.wilaya}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.ownerActionBtn}>
                <MaterialCommunityIcons name="phone" size={16} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ownerActionBtn, { marginLeft: 8 }]}>
                <MaterialCommunityIcons name="chat-outline" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {!isOwner && profile?.role !== 'owner' && car.is_available && (
            <View style={styles.section}>
              {!profile?.is_verified ? (
                <View style={styles.verifyBanner}>
                  <View style={[styles.verifyIconBox, { backgroundColor: Colors.warning + '20' }]}>
                    <MaterialCommunityIcons name="shield-account-outline" size={28} color={Colors.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verifyTitle}>Verification requise</Text>
                    <Text style={styles.verifySub}>Verifiez votre identite pour pouvoir reserver ce vehicule.</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/profile/verify')} style={styles.verifyBtn} activeOpacity={0.85}>
                    <Text style={styles.verifyBtnText}>Verifier</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Choisir les dates</Text>
                  <View style={styles.datesRow}>
                    <DateField label="Debut" value={startDate} onChange={setStartDate} icon="calendar-start" />
                    <View style={styles.dateArrow}>
                      <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.textMuted} />
                    </View>
                    <DateField label="Fin" value={endDate} onChange={setEndDate} icon="calendar-end" />
                  </View>
                  {days > 0 ? (
                    <View style={styles.breakdownCard}>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>
                          {car.price_per_day?.toLocaleString()} DA x {days} jour{days > 1 ? 's' : ''}
                        </Text>
                        <Text style={styles.breakdownValue}>{totalPrice.toLocaleString()} DA</Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Frais de service (10%)</Text>
                        <Text style={styles.breakdownValue}>{commission.toLocaleString()} DA</Text>
                      </View>
                      <View style={styles.breakdownDivider} />
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownTotal}>Total</Text>
                        <Text style={styles.breakdownTotalValue}>{grandTotal.toLocaleString()} DA</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.dateHintBox}>
                      <MaterialCommunityIcons name="information-outline" size={15} color={Colors.info} />
                      <Text style={styles.dateHintText}>Entrez les dates au format AAAA-MM-JJ</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {!isOwner && profile?.role !== 'owner' && car.is_available && profile?.is_verified && (
        <View style={styles.footer}>
          <View style={styles.footerPriceBlock}>
            <Text style={styles.footerPrice}>{car.price_per_day?.toLocaleString()} DA</Text>
            <Text style={styles.footerPriceUnit}>/jour</Text>
          </View>
          <TouchableOpacity
            style={[styles.ctaBtn, (days === 0 || bookingLoading) && styles.ctaBtnDisabled]}
            onPress={handleBook}
            disabled={days === 0 || bookingLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={days > 0 ? [Colors.primary, Colors.primaryDark] : [Colors.border, Colors.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <MaterialCommunityIcons
                name="calendar-check"
                size={18}
                color={days > 0 ? Colors.textInverse : Colors.textMuted}
              />
              <Text style={[styles.ctaText, days === 0 && { color: Colors.textMuted }]}>
                {bookingLoading ? 'Envoi...' : days > 0 ? 'Reserver ' + grandTotal.toLocaleString() + ' DA' : 'Choisir les dates'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gallery: { height: 300, position: 'relative' },
  galleryImage: { width, height: 300 },
  galleryPlaceholder: { backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 44,
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10,10,15,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: Colors.primary, width: 20, borderRadius: 3 },
  availChip: {
    position: 'absolute',
    bottom: 14,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  availText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  content: { padding: Spacing.md },
  titleBlock: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  carTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  carMeta: { fontSize: 13, color: Colors.textMuted },
  metaDot: { color: Colors.border, marginHorizontal: 2 },
  priceChip: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    ...Shadow.glow,
  },
  priceChipAmount: { fontSize: 18, fontWeight: '900', color: Colors.textInverse },
  priceChipUnit: { fontSize: 10, fontWeight: '600', color: Colors.textInverse + 'AA', marginTop: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: Spacing.md },
  ratingLabel: { fontSize: 13, color: Colors.textSecondary, marginLeft: 4 },
  specsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  specItem: { flex: 1, alignItems: 'center', gap: 5 },
  specIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specValue: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  specLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  specDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  descText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInitial: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  ownerName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  ownerLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  ownerLoc: { fontSize: 12, color: Colors.textMuted },
  ownerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary + '18',
    borderWidth: 1,
    borderColor: Colors.primary + '35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  dateFieldWrap: { flex: 1 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  dateInputText: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  dateArrow: { width: 32, alignItems: 'center', marginTop: 22 },
  breakdownCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 10,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 13, color: Colors.textSecondary },
  breakdownValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  breakdownDivider: { height: 1, backgroundColor: Colors.border },
  breakdownTotal: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  breakdownTotalValue: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  dateHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.info + '12',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.info + '30',
    padding: 10,
  },
  dateHintText: { fontSize: 12, color: Colors.info, flex: 1 },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.warning + '12',
    borderWidth: 1,
    borderColor: Colors.warning + '35',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  verifyIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  verifySub: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  verifyBtn: {
    backgroundColor: Colors.warning,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  verifyBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
    gap: Spacing.md,
    ...Shadow.card,
  },
  footerPriceBlock: { alignItems: 'flex-start' },
  footerPrice: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  footerPriceUnit: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  ctaBtn: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaGradient: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontSize: 15, fontWeight: '800', color: Colors.textInverse, letterSpacing: 0.2 },
});

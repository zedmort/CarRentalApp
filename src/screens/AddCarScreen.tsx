import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button, Input, Card } from '../components/UI';
import { WilayaPicker } from '../components/WilayaPicker';
import { Colors, Spacing, Radius, CAR_CATEGORIES } from '../constants/theme';

export default function AddCarScreen() {
  const { user } = useAuth();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [description, setDescription] = useState('');
  const [seats, setSeats] = useState('5');
  const [transmission, setTransmission] = useState<'manual' | 'automatic'>('manual');
  const [fuel, setFuel] = useState<'essence' | 'diesel' | 'electrique'>('essence');
  const [category, setCategory] = useState('economy');
  const [withDriver, setWithDriver] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (images.length >= 5) { Alert.alert('Maximum 5 photos'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri).slice(0, 5 - images.length);
      setImages([...images, ...uris]);
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const uri of images) {
      const ext = uri.split('.').pop() ?? 'jpg';
      const fileName = `${user?.id}/${Date.now()}.${ext}`;
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const { error } = await supabase.storage.from('car-images').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('car-images').getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!brand || !model || !year || !pricePerDay || !wilaya) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    const imageUrls = images.length > 0 ? await uploadImages() : [];

    const { error } = await supabase.from('cars').insert({
      owner_id: user?.id,
      brand, model,
      year: parseInt(year),
      price_per_day: parseFloat(pricePerDay),
      wilaya, description,
      seats: parseInt(seats),
      transmission, fuel, category,
      with_driver: withDriver,
      images: imageUrls,
      is_available: true,
      is_verified: true,
    });

    setLoading(false);
    if (error) Alert.alert('Erreur', error.message);
    else {
      Alert.alert('Succès !', 'Votre voiture a été ajoutée avec succès.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  const SelectChip = ({ value, current, onSelect, label }: any) => (
    <TouchableOpacity
      onPress={() => onSelect(value)}
      style={[styles.chip, current === value && styles.chipActive]}
    >
      <Text style={[styles.chipText, current === value && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Retour</Text></TouchableOpacity>
            <Text style={styles.title}>Ajouter une voiture</Text>
            <Text style={styles.subtitle}>Remplissez les informations de votre véhicule</Text>
          </View>

          {/* Photo upload */}
          <Card style={styles.photoCard}>
            <Text style={styles.sectionLabel}>Photos du véhicule ({images.length}/5)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
              {images.map((uri, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.removePhoto}
                    onPress={() => setImages(images.filter((_, idx) => idx !== i))}
                  >
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                  <Text style={{ fontSize: 28, color: Colors.textMuted }}>+</Text>
                  <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>Ajouter</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Card>

          {/* Basic info */}
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>Informations de base</Text>
            <Input label="Marque *" placeholder="Ex: Toyota" value={brand} onChangeText={setBrand} autoCapitalize="words" />
            <Input label="Modèle *" placeholder="Ex: Corolla" value={model} onChangeText={setModel} autoCapitalize="words" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input label="Année *" placeholder="2020" value={year} onChangeText={setYear} keyboardType="numeric" />
              </View>
              <View style={{ width: Spacing.md }} />
              <View style={{ flex: 1 }}>
                <Input label="Places *" placeholder="5" value={seats} onChangeText={setSeats} keyboardType="numeric" />
              </View>
            </View>
            <WilayaPicker label="Wilaya *" value={wilaya} onChange={setWilaya} />
          </Card>
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>Catégorie</Text>
            <View style={styles.chipRow}>
              {CAR_CATEGORIES.map(c => (
                <SelectChip key={c.id} value={c.id} current={category} onSelect={setCategory} label={`${c.icon} ${c.label}`} />
              ))}
            </View>
          </Card>

          {/* Specs */}
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>Transmission</Text>
            <View style={styles.chipRow}>
              <SelectChip value="manual" current={transmission} onSelect={setTransmission} label="Manuelle" />
              <SelectChip value="automatic" current={transmission} onSelect={setTransmission} label="Automatique" />
            </View>
            <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Carburant</Text>
            <View style={styles.chipRow}>
              <SelectChip value="essence" current={fuel} onSelect={setFuel} label="Essence" />
              <SelectChip value="diesel" current={fuel} onSelect={setFuel} label="Diesel" />
              <SelectChip value="electrique" current={fuel} onSelect={setFuel} label="Électrique" />
            </View>
          </Card>

          {/* Driver option */}
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>Type de service</Text>
            <View style={styles.chipRow}>
              <SelectChip value={false} current={withDriver} onSelect={setWithDriver} label="🔑 Sans chauffeur" />
              <SelectChip value={true} current={withDriver} onSelect={setWithDriver} label="👨‍✈️ Avec chauffeur" />
            </View>
          </Card>

          {/* Pricing */}
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>Tarif</Text>
            <Input label="Prix par jour (DA) *" placeholder="3500" value={pricePerDay} onChangeText={setPricePerDay} keyboardType="numeric" />
          </Card>

          {/* Description */}
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>Description (optionnel)</Text>
            <Input
              label="" placeholder="Décrivez votre voiture, les conditions de location..."
              value={description} onChangeText={setDescription}
              multiline numberOfLines={4}
            />
          </Card>

          <Button title="Publier l'annonce" onPress={handleSubmit} loading={loading} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingTop: 60 },
  header: { marginBottom: Spacing.lg },
  back: { color: Colors.primary, fontSize: 15, fontWeight: '600', marginBottom: Spacing.sm },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  section: { marginBottom: Spacing.md },
  photoCard: { marginBottom: Spacing.md },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm, letterSpacing: 0.3 },
  photoRow: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: 4 },
  photoThumb: { width: 80, height: 80, borderRadius: Radius.sm, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  removePhoto: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 80, height: 80, borderRadius: Radius.sm,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  row: { flexDirection: 'row' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
});

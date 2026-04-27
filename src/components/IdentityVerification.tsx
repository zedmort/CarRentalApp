import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase';
import { Button, Input } from './UI';
import { Colors, Spacing, Radius } from '../constants/theme';

interface IdentityVerificationProps {
  onVerificationSubmitted?: () => void;
  role?: 'renter' | 'owner' | 'admin';
}

export function IdentityVerificationModal({
  onVerificationSubmitted,
  role,
}: IdentityVerificationProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idImage, setIdImage] = useState<string | null>(null);
  const [licenseFront, setLicenseFront] = useState<string | null>(null);
  const [licenseBack, setLicenseBack] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async (type: 'id' | 'license_front' | 'license_back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      if (type === 'id') setIdImage(imageUri);
      else if (type === 'license_front') setLicenseFront(imageUri);
      else setLicenseBack(imageUri);
    }
  };

  const uploadFile = async (uri: string, type: string): Promise<string> => {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      throw new Error(`Session expirée. Veuillez vous reconnecter.`);
    }

    const fileName = `${user.id}/${type}_${Date.now()}.jpg`;

    // Read the file as ArrayBuffer — the only reliable method in React Native / Expo
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Impossible de lire le fichier (${type}).`);
    }
    const arrayBuffer = await response.arrayBuffer();

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      // Surface the exact Supabase error so it's easy to diagnose
      const msg = error.message ?? JSON.stringify(error);
      if (msg.includes('Bucket not found') || msg.includes('bucket')) {
        throw new Error(
          "Le bucket 'documents' n'existe pas dans Supabase Storage. Créez-le dans le dashboard Supabase."
        );
      }
      if (msg.includes('security') || msg.includes('policy') || msg.includes('403')) {
        throw new Error(
          "Permission refusée par Supabase Storage. Vérifiez les politiques RLS du bucket 'documents'."
        );
      }
      throw new Error(`Upload échoué (${type}): ${msg}`);
    }

    return data.path;
  };

  const handleSubmit = async () => {
    if (!fullName || !phone || !idImage || !licenseFront || !licenseBack) {
      Alert.alert('Données manquantes', 'Veuillez remplir tous les champs et ajouter les documents');
      return;
    }

    setLoading(true);
    try {
      const idPath = await uploadFile(idImage, 'id');
      const licenseFrontPath = await uploadFile(licenseFront, 'license_front');
      const licenseBackPath = await uploadFile(licenseBack, 'license_back');

      // Store verification request
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase.from('identity_verifications').insert({
        user_id: user.id,
        full_name: fullName,
        id_number: 'voir_document',
        phone,
        id_document: idPath,
        license_front: licenseFrontPath,
        license_back: licenseBackPath,
        status: 'pending',
      });

      if (error) throw error;

      Alert.alert(
        '✅ Documents soumis',
        'Votre demande a été envoyée à l\'administrateur. Vous serez notifié une fois approuvé.',
        [{ text: 'OK', onPress: () => onVerificationSubmitted?.() }]
      );
    } catch (err: any) {
      Alert.alert('Erreur lors de l\'envoi', err.message ?? 'Une erreur inattendue s\'est produite.');
    } finally {
    } finally {
      setLoading(false);
    }
  };

  const DocumentCard = ({
    label, image, onPress, icon
  }: {
    label: string; image: string | null; onPress: () => void; icon: string;
  }) => (
    <TouchableOpacity 
      style={[styles.docCard, image && styles.docCardFilled]}
      onPress={onPress}
    >
      {image ? (
        <>
          <Image source={{ uri: image }} style={styles.docImage} />
          <TouchableOpacity 
            style={styles.docEdit}
            onPress={() => setSelectedImage(image)}
          >
            <MaterialCommunityIcons name="eye" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <MaterialCommunityIcons name={icon} size={32} color={Colors.textMuted} />
          <Text style={styles.docLabel}>{label}</Text>
          <Text style={styles.docHint}>Appuyez pour ajouter</Text>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />

          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons name="shield-check" size={40} color={Colors.primary} />
            <Text style={styles.title}>Vérification d'identité</Text>
            <Text style={styles.subtitle}>
              {role === 'owner'
                ? 'Soumettez vos documents pour activer votre compte propriétaire'
                : 'Soumettez vos documents pour pouvoir réserver des véhicules'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              placeholder="Nom complet"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />
            <Input
              placeholder="Téléphone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />

            {/* Document Upload Section */}
            <Text style={styles.docSectionTitle}>Documents requis</Text>
            <View style={styles.docsGrid}>
              <DocumentCard
                label="Pièce d'identité"
                image={idImage}
                onPress={() => pickImage('id')}
                icon="card-account-details"
              />
              <DocumentCard
                label="Permis (Avant)"
                image={licenseFront}
                onPress={() => pickImage('license_front')}
                icon="license"
              />
              <DocumentCard
                label="Permis (Arrière)"
                image={licenseBack}
                onPress={() => pickImage('license_back')}
                icon="license"
              />
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                L'administrateur examinera vos documents et vous confirme l'activation du compte dans 24-48h
              </Text>
            </View>
          </View>

          <Button
            title={loading ? 'Envoi...' : 'Soumettre les documents'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Preview Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.previewModal}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          )}
          <TouchableOpacity
            style={styles.previewClose}
            onPress={() => setSelectedImage(null)}
          >
            <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.xl,
  },
  docSectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  docsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  docCard: {
    width: '31%',
    aspectRatio: 0.75,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  docCardFilled: {
    borderStyle: 'solid',
    borderColor: Colors.primary,
  },
  docImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
  },
  docEdit: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.background + 'CC',
    padding: 4,
    borderRadius: Radius.sm,
  },
  docLabel: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  docHint: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoText: {
    color: Colors.text,
    fontSize: 13,
    marginLeft: Spacing.md,
    flex: 1,
  },
  submitBtn: {
    marginBottom: Spacing.xl,
  },
  previewModal: {
    flex: 1,
    backgroundColor: '#000000CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    height: '80%',
    borderRadius: Radius.lg,
  },
  previewClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: Colors.surface + 'CC',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

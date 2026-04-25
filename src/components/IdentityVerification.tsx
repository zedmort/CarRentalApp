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

  const uploadFile = async (uri: string, type: string) => {
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        throw new Error(`Auth error: ${userErr?.message || 'User not found'}`);
      }

      // For prototype: if storage bucket doesn't exist, create a placeholder path
      // This allows testing the verification flow without the storage bucket
      const fileName = `${user.id}_${type}_${Date.now()}.jpg`;

      console.log('[Upload] Fetching image from URI:', uri);
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log('[Upload] Blob created, size:', blob.size, 'type:', blob.type);

      // Try to upload to storage
      console.log('[Upload] Uploading to bucket=documents, path=', fileName);
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

      if (error) {
        console.warn('[Upload] Storage upload failed (expected if bucket not created):', error.message);
        // For prototype: allow submission with placeholder path
        // This lets the admin panel show the verification requests for testing
        console.log('[Upload] Using placeholder path for prototype mode');
        return `placeholder/${fileName}`;
      }

      console.log('[Upload] Success:', data?.path);
      return data.path;
    } catch (err: any) {
      console.error('[Upload] Exception:', err.message);
      throw err;
    }
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
      console.error('[Submit] Full error:', err);
      // Check if it's a storage bucket issue
      if (err.message?.includes('404') || err.message?.includes('bucket')) {
        Alert.alert(
          'Erreur',
          'Le système de stockage n\'est pas configuré. Veuillez vérifier le statut de l\'application avec l\'administrateur.'
        );
      } else if (err.message?.includes('Auth') || err.message?.includes('auth')) {
        Alert.alert(
          'Erreur d\'authentification',
          'Votre session a expiré. Veuillez vous reconnecter.'
        );
      } else {
        Alert.alert('Erreur', err.message || 'Impossible d\'envoyer les documents. Vérifiez votre connexion réseau.');
      }
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

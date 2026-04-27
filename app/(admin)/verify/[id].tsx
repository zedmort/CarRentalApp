import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../src/services/supabase';
import { Colors, Spacing, Radius, Shadow } from '../../../src/constants/theme';

interface Verification {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  id_number: string;
  id_document: string;
  license_front: string;
  license_back: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

export default function VerifyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [verif, setVerif] = useState<Verification | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  useEffect(() => {
    loadVerification();
  }, [id]);

  const loadVerification = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      Alert.alert('Erreur', 'Impossible de charger la demande');
      router.back();
      return;
    }
    setVerif(data);

    // Get signed URLs for all 3 documents (works for both public and private buckets)
    const paths: Record<string, string> = {
      id_document: data.id_document,
      license_front: data.license_front,
      license_back: data.license_back,
    };
    const urls: Record<string, string> = {};
    await Promise.all(
      Object.entries(paths).map(async ([key, path]) => {
        if (!path || path.startsWith('placeholder/')) return;
        const { data: signedData, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(path, 60 * 60); // 1-hour expiry
        if (error) {
          console.warn(`[Admin] Cannot get signed URL for ${key}:`, error.message);
          return;
        }
        if (signedData?.signedUrl) urls[key] = signedData.signedUrl;
      })
    );
    setImageUrls(urls);
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!verif) return;
    Alert.alert(
      'Approuver ce dossier',
      `Valider la demande de ${verif.full_name} et activer son compte ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error: e1 } = await supabase
                .from('identity_verifications')
                .update({ status: 'approved' })
                .eq('id', verif.id);
              if (e1) throw e1;

              const { error: e2 } = await supabase
                .from('profiles')
                .update({ is_verified: true })
                .eq('id', verif.user_id);
              if (e2) throw e2;

              Alert.alert('Approuvé ✓', 'Le compte a été activé avec succès.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Erreur', err.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!verif || !rejectReason.trim()) return;
    setActionLoading(true);
    setRejectModal(false);
    try {
      const { error: e1 } = await supabase
        .from('identity_verifications')
        .update({ status: 'rejected', rejection_reason: rejectReason.trim() })
        .eq('id', verif.id);
      if (e1) throw e1;

      Alert.alert('Rejeté', 'Le dossier a été rejeté. L\'utilisateur en sera informé.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!verif) return null;

  const isPending = verif.status === 'pending';
  const statusColor = verif.status === 'approved' ? Colors.success : verif.status === 'rejected' ? Colors.danger : Colors.warning;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dossier de vérification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }}>
        {/* Status badge */}
        <View style={[styles.statusRow, { backgroundColor: statusColor + '15', borderColor: statusColor + '35' }]}>
          <MaterialCommunityIcons
            name={verif.status === 'approved' ? 'check-circle' : verif.status === 'rejected' ? 'close-circle' : 'clock-outline'}
            size={20}
            color={statusColor}
          />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {verif.status === 'approved' ? 'Approuvé' : verif.status === 'rejected' ? 'Rejeté' : 'En attente de validation'}
          </Text>
        </View>

        {/* User info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations personnelles</Text>
          <InfoRow icon="account" label="Nom complet" value={verif.full_name} />
          <InfoRow icon="phone" label="Téléphone" value={verif.phone} />
          <InfoRow icon="card-account-details" label="Numéro CNI" value={verif.id_number} />
          <InfoRow icon="calendar" label="Soumis le" value={new Date(verif.created_at).toLocaleString('fr-DZ')} />
        </View>

        {/* Documents */}
        <Text style={styles.sectionTitle}>Documents soumis</Text>

        <DocImage
          label="Carte nationale d'identité"
          icon="card-account-details-outline"
          url={imageUrls.id_document}
          rawPath={verif.id_document}
          onPress={() => setPreviewImg(imageUrls.id_document)}
        />
        <DocImage
          label="Permis de conduire (recto)"
          icon="card-text-outline"
          url={imageUrls.license_front}
          rawPath={verif.license_front}
          onPress={() => setPreviewImg(imageUrls.license_front)}
        />
        <DocImage
          label="Permis de conduire (verso)"
          icon="card-text-outline"
          url={imageUrls.license_back}
          rawPath={verif.license_back}
          onPress={() => setPreviewImg(imageUrls.license_back)}
        />

        {/* Rejection reason if rejected */}
        {verif.status === 'rejected' && verif.rejection_reason && (
          <View style={[styles.card, { borderColor: Colors.danger + '40', backgroundColor: Colors.danger + '08' }]}>
            <Text style={[styles.cardTitle, { color: Colors.danger }]}>Motif du rejet</Text>
            <Text style={styles.rejectReasonText}>{verif.rejection_reason}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action buttons — only for pending */}
      {isPending && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => setRejectModal(true)}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="close" size={18} color={Colors.danger} />
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Rejeter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={handleApprove}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ActivityIndicator color={Colors.textInverse} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={18} color={Colors.textInverse} />
                <Text style={[styles.actionBtnText, { color: Colors.textInverse }]}>Approuver</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Reject reason modal */}
      <Modal visible={rejectModal} transparent animationType="slide" onRequestClose={() => setRejectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Motif du rejet</Text>
            <Text style={styles.modalSub}>Indiquez la raison du refus (visible par l'utilisateur)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Documents illisibles, informations incorrectes..."
              placeholderTextColor={Colors.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectModal(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, !rejectReason.trim() && { opacity: 0.4 }]}
                onPress={handleReject}
                disabled={!rejectReason.trim()}
              >
                <Text style={styles.modalConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image preview modal */}
      <Modal visible={!!previewImg} transparent animationType="fade" onRequestClose={() => setPreviewImg(null)}>
        <TouchableOpacity style={styles.previewOverlay} activeOpacity={1} onPress={() => setPreviewImg(null)}>
          {previewImg && (
            <Image source={{ uri: previewImg }} style={styles.previewImage} resizeMode="contain" />
          )}
          <View style={styles.previewClose}>
            <MaterialCommunityIcons name="close" size={22} color="#fff" />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={16} color={Colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function DocImage({ label, icon, url, rawPath, onPress }: { label: string; icon: any; url?: string; rawPath?: string; onPress: () => void }) {
  const isPlaceholder = rawPath?.startsWith('placeholder/');
  return (
    <View style={styles.docCard}>
      <View style={styles.docHeader}>
        <MaterialCommunityIcons name={icon} size={16} color={Colors.primary} />
        <Text style={styles.docLabel}>{label}</Text>
      </View>
      {url ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <Image source={{ uri: url }} style={styles.docImage} resizeMode="cover" />
          <View style={styles.docTapHint}>
            <MaterialCommunityIcons name="magnify-plus-outline" size={16} color="#fff" />
            <Text style={styles.docTapText}>Appuyer pour agrandir</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.docPlaceholder}>
          <MaterialCommunityIcons
            name={isPlaceholder ? 'upload-off-outline' : 'image-off-outline'}
            size={28}
            color={isPlaceholder ? Colors.warning : Colors.textMuted}
          />
          <Text style={[styles.docPlaceholderText, isPlaceholder && { color: Colors.warning }]}>
            {isPlaceholder
              ? "Document non téléchargé (erreur lors de l'envoi)"
              : 'Document non disponible'}
          </Text>
        </View>
      )}
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
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
  },
  statusLabel: { fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1,
    borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md,
    gap: 10, ...Shadow.card,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13, color: Colors.textMuted, width: 110 },
  infoValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600', flex: 1 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.textPrimary,
    marginBottom: Spacing.sm, marginTop: Spacing.xs,
  },
  docCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1,
    borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.md, ...Shadow.card,
  },
  docHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: Spacing.md, paddingBottom: Spacing.sm,
  },
  docLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  docImage: { width: '100%', height: 200 },
  docTapHint: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  docTapText: { fontSize: 11, color: '#fff' },
  docPlaceholder: {
    height: 120, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  docPlaceholderText: { fontSize: 13, color: Colors.textMuted },
  rejectReasonText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: Spacing.sm,
    padding: Spacing.md, paddingBottom: 34,
    backgroundColor: Colors.background + 'F0',
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 52, borderRadius: Radius.lg,
  },
  rejectBtn: { backgroundColor: Colors.danger + '18', borderWidth: 1, borderColor: Colors.danger + '40' },
  approveBtn: { backgroundColor: Colors.success },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.surfaceLight, borderTopLeftRadius: Radius.xl * 2,
    borderTopRightRadius: Radius.xl * 2, padding: Spacing.lg, paddingBottom: 40, gap: Spacing.sm,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  modalSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  modalInput: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary,
    fontSize: 14, minHeight: 80,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  modalCancel: {
    flex: 1, height: 50, borderRadius: Radius.md,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  modalConfirm: {
    flex: 1, height: 50, borderRadius: Radius.md,
    backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center',
  },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  previewOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  previewImage: { width: '100%', height: '80%' },
  previewClose: {
    position: 'absolute', top: 56, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../src/services/supabase';
import { useAuth } from '../src/hooks/useAuth';
import { Colors, Spacing, Radius, Shadow } from '../src/constants/theme';

type VerifStatus = 'none' | 'pending' | 'rejected';

export default function PendingScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [status, setStatus] = useState<VerifStatus>('none');
  const [reason, setReason] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkVerification();
  }, []);

  const checkVerification = async () => {
    setChecking(true);
    const { data } = await supabase
      .from('identity_verifications')
      .select('status, rejection_reason')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setStatus(data.status === 'pending' ? 'pending' : data.status === 'rejected' ? 'rejected' : 'none');
      setReason(data.rejection_reason ?? '');
    } else {
      setStatus('none');
    }
    setChecking(false);
    await refreshProfile();
  };

  if (checking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const config = {
    none: {
      icon: 'shield-account-outline' as const,
      iconColor: Colors.warning,
      title: 'Verification requise',
      subtitle: 'Vous devez verifier votre identite avant d\'acceder a l\'application.',
      cta: 'Soumettre mes documents',
      ctaAction: () => router.push('/profile/verify'),
    },
    pending: {
      icon: 'clock-outline' as const,
      iconColor: Colors.info,
      title: 'Dossier en cours d\'examen',
      subtitle: 'Vos documents ont ete envoyes. L\'equipe CarGo les examine. Vous serez notifie des que votre compte sera active.',
      cta: 'Actualiser',
      ctaAction: checkVerification,
    },
    rejected: {
      icon: 'close-circle-outline' as const,
      iconColor: Colors.danger,
      title: 'Dossier rejete',
      subtitle: reason || 'Votre dossier a ete rejete. Veuillez soumettre de nouveaux documents.',
      cta: 'Soumettre a nouveau',
      ctaAction: () => router.push('/profile/verify'),
    },
  }[status];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>CarGo</Text>
        <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
          <MaterialCommunityIcons name="logout" size={18} color={Colors.textMuted} />
          <Text style={styles.signOutText}>Deconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconCircle, { borderColor: config.iconColor + '40', backgroundColor: config.iconColor + '15' }]}>
          <MaterialCommunityIcons name={config.icon} size={52} color={config.iconColor} />
        </View>

        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>

        {/* Steps for "none" status */}
        {status === 'none' && (
          <View style={styles.stepsCard}>
            {[
              { icon: 'card-account-details-outline', text: 'Carte nationale d\'identite (CNI)' },
              { icon: 'card-text-outline', text: 'Permis de conduire (recto + verso)' },
              { icon: 'account-check-outline', text: 'Validation par l\'equipe CarGo' },
            ].map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <MaterialCommunityIcons name={step.icon as any} size={18} color={Colors.primary} style={{ marginRight: 10 }} />
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pending status card */}
        {status === 'pending' && (
          <View style={[styles.stepsCard, { borderColor: Colors.info + '30', backgroundColor: Colors.info + '08' }]}>
            <View style={styles.step}>
              <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
              <Text style={[styles.stepText, { marginLeft: 10 }]}>Documents envoyes</Text>
            </View>
            <View style={styles.step}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.info} />
              <Text style={[styles.stepText, { marginLeft: 10 }]}>Examen en cours (24-48h)</Text>
            </View>
            <View style={styles.step}>
              <MaterialCommunityIcons name="circle-outline" size={20} color={Colors.textMuted} />
              <Text style={[styles.stepText, { color: Colors.textMuted, marginLeft: 10 }]}>Activation du compte</Text>
            </View>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity style={styles.cta} onPress={config.ctaAction} activeOpacity={0.85}>
          <LinearGradient
            colors={status === 'rejected' ? [Colors.danger, Colors.danger + 'CC'] : [Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={[styles.ctaText, status === 'rejected' && { color: '#fff' }]}>
              {config.cta}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 56,
    paddingBottom: Spacing.md,
  },
  appName: { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signOutText: { fontSize: 13, color: Colors.textMuted },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 60,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNumText: { fontSize: 12, fontWeight: '800', color: Colors.textInverse },
  stepText: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  cta: { width: '100%', borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  ctaGradient: { height: 54, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 16, fontWeight: '800', color: Colors.textInverse },
});

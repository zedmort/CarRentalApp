import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { IdentityVerificationModal } from '../../src/components/IdentityVerification';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, Radius } from '../../src/constants/theme';

export default function VerifyScreen() {
  const { profile } = useAuth();
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <IdentityVerificationModal
        role={profile?.role}
        onVerificationSubmitted={() => router.replace('/pending')}
      />
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
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
  },
  backArrow: { color: Colors.textPrimary, fontSize: 28, lineHeight: 32 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '../../src/constants/theme';
import { ScreenHeader } from '../../src/components/UI';

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0F0F1A']} style={StyleSheet.absoluteFillObject} />
      <ScreenHeader title="Messages" subtitle="Vos conversations" />
      <View style={styles.empty}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
        <Text style={styles.emptyTitle}>Aucun message</Text>
        <Text style={styles.emptyText}>
          Vos conversations avec les propriétaires et locataires apparaîtront ici.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});

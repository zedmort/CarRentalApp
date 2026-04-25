import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TextInput,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing, Shadow } from '../constants/theme';

// ─── PRIMARY BUTTON ──────────────────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const Button = ({
  title, onPress, loading, disabled, variant = 'primary', style, fullWidth = true,
}: ButtonProps) => {
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[fullWidth && { width: '100%' }, style]}
      >
        <LinearGradient
          colors={disabled ? ['#333', '#333'] : [Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryBtn}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textInverse} size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, { container: ViewStyle; text: TextStyle }> = {
    secondary: {
      container: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
      text: { color: Colors.textPrimary },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: { color: Colors.primary },
    },
    danger: {
      container: { backgroundColor: Colors.danger + '20', borderWidth: 1, borderColor: Colors.danger },
      text: { color: Colors.danger },
    },
  };

  const vs = variantStyles[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.baseBtn, vs.container, fullWidth && { width: '100%' }, style]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text.color} size="small" />
      ) : (
        <Text style={[styles.baseBtnText, vs.text]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// ─── INPUT FIELD ─────────────────────────────────────────────────────────────
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Input = ({
  label, placeholder, value, onChangeText, secureTextEntry,
  keyboardType = 'default', autoCapitalize = 'sentences',
  multiline, numberOfLines, error, icon, style,
}: InputProps) => (
  <View style={[styles.inputWrapper, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <View style={[styles.inputContainer, error ? styles.inputError : null, multiline ? styles.inputMultiline : null]}>
      {icon && <View style={styles.inputIcon}>{icon}</View>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[styles.input, icon ? { paddingLeft: 0 } : null, multiline ? { textAlignVertical: 'top' } : null]}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─── CARD ────────────────────────────────────────────────────────────────────
export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ─── BADGE ───────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
}
export const Badge = ({ label, color = Colors.primary }: BadgeProps) => (
  <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '50' }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
export const Divider = ({ label }: { label?: string }) => (
  <View style={styles.dividerRow}>
    <View style={styles.dividerLine} />
    {label && <Text style={styles.dividerLabel}>{label}</Text>}
    {label && <View style={styles.dividerLine} />}
  </View>
);

// ─── SCREEN HEADER ───────────────────────────────────────────────────────────
export const ScreenHeader = ({
  title, subtitle, right,
}: { title: string; subtitle?: string; right?: React.ReactNode }) => (
  <View style={styles.screenHeader}>
    <View style={{ flex: 1 }}>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  primaryBtn: {
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glow,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textInverse,
    letterSpacing: 0.3,
  },
  baseBtn: {
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputWrapper: { marginBottom: Spacing.md },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  inputMultiline: { alignItems: 'flex-start', paddingVertical: Spacing.sm },
  inputError: { borderColor: Colors.danger },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    height: 50,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  errorText: { fontSize: 12, color: Colors.danger, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: Spacing.sm,
    letterSpacing: 0.5,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  screenTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
});

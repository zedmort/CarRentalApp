export const Colors = {
  // Brand
  primary: '#E8FF47',        // Electric lime — the hero accent
  primaryDark: '#C4D900',
  secondary: '#1A1A2E',      // Deep navy
  surface: '#12121C',        // Card background
  surfaceLight: '#1E1E30',   // Elevated card
  border: '#2A2A40',
  borderLight: '#3A3A55',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9090B0',
  textMuted: '#555570',
  textInverse: '#0A0A0F',

  // Status
  success: '#2ECC71',
  warning: '#F39C12',
  danger: '#E74C3C',
  info: '#3498DB',

  // Background
  background: '#0A0A0F',
  backgroundSecondary: '#0F0F1A',
};

export const Typography = {
  // Using system fonts — replace with expo-font for custom fonts
  heading: {
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  body: {
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  label: {
    fontWeight: '600' as const,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: Colors.textMuted,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
};

export const USER_ROLES = {
  RENTER: 'renter',
  OWNER: 'owner',
} as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const CAR_CATEGORIES = [
  { id: 'luxury', label: 'Luxe', icon: '🏎️' },
  { id: 'economy', label: 'Économique', icon: '🚗' },
  { id: 'van', label: 'Fourgon', icon: '🚐' },
];

export const DRIVER_OPTIONS = [
  { id: 'all', label: 'Tous', icon: '🚗' },
  { id: 'with', label: 'Avec chauffeur', icon: '👨‍✈️' },
  { id: 'without', label: 'Sans chauffeur', icon: '🔑' },
];

export const WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna',
  'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira',
  'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou',
  'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda',
  'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine',
  'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla',
  'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 'Boumerdès',
  'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
  'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma',
  'Aïn Témouchent', 'Ghardaïa', 'Relizane',
];

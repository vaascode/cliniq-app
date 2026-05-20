import { Platform } from 'react-native';

export const colors = {
  background: '#F0FDF4',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#166534',
  primaryDark: '#14532D',
  primaryLight: '#D1FAE5',
  secondary: '#166534',
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  success: '#16A34A',
  error: '#DC2626',
  warning: '#D97706',
  border: '#DCFCE7',
  overlay: 'rgba(0,0,0,0.3)',
  cardHighlight: '#D1FAE5',
  tealGradientStart: '#166534',
  tealGradientEnd: '#14532D',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: Platform.OS === 'ios' ? 16 : 12,
  lg: Platform.OS === 'ios' ? 20 : 16,
  xl: Platform.OS === 'ios' ? 28 : 24,
  full: 999,
};

export const fontFamily = Platform.select({
  ios: 'Inter',
  android: 'Inter',
  web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}) || 'Inter';

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    fontFamily,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    fontFamily,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    fontFamily,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    fontFamily,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textPrimary,
    fontFamily,
  },
  bodySecondary: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    fontFamily,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    fontFamily,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    fontFamily,
  },
  button: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    fontFamily,
  },
};

export const shadows = Platform.select({
  ios: {
    card: {
      shadowColor: '#166534',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    elevated: {
      shadowColor: '#166534',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
  },
  android: {
    card: {
      elevation: 2,
    },
    elevated: {
      elevation: 4,
    },
  },
}) || { card: {}, elevated: {} };

import React from 'react';
import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { colors } from '../lib/theme';

interface PlatformCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accentColor?: string;
  accentSide?: 'left' | 'top' | 'none';
  highlighted?: boolean;
}

export function PlatformCard({
  children,
  style,
  accentColor,
  accentSide = 'none',
  highlighted = false,
}: PlatformCardProps) {
  const isIOS = Platform.OS === 'ios';

  const cardStyles: ViewStyle = {
    backgroundColor: highlighted ? colors.cardHighlight : colors.card,
    borderRadius: isIOS ? 16 : 12,
    padding: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: highlighted ? colors.primary : colors.border,
    ...(isIOS
      ? {
          shadowColor: '#166534',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        }
      : { elevation: 2 }),
  };

  // Apply accent
  if (accentSide === 'left' && accentColor) {
    cardStyles.borderLeftWidth = 3;
    cardStyles.borderLeftColor = accentColor;
  }
  if (accentSide === 'top' && accentColor) {
    cardStyles.borderTopWidth = 3;
    cardStyles.borderTopColor = accentColor;
  }

  return <View style={[cardStyles, style]}>{children}</View>;
}

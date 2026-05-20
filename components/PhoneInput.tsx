import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, fontFamily } from '../lib/theme';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  hasError?: boolean;
}

export default function PhoneInput({ value, onChangeText, placeholder, hasError }: PhoneInputProps) {
  return (
    <View style={[styles.row, hasError && styles.rowError]}>
      <View style={styles.prefixBox}>
        <Text style={styles.prefixText}>+91</Text>
      </View>
      <View style={styles.divider} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType="phone-pad"
        placeholder={placeholder || '98765 43210'}
        placeholderTextColor={colors.textSecondary}
        maxLength={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    overflow: 'hidden',
  },
  rowError: {
    borderColor: '#EF4444',
  },
  prefixBox: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F0FDF4',
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily,
    color: colors.primary,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#D1FAE5',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily,
    color: colors.textPrimary,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { t, type TranslationKey } from '../../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { ArrowLeft } from '../../lib/icons';
import { PlatformCard } from '../../components/PlatformCard';
import { FadeInView } from '../../components/FadeInView';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PatientSettings() {
  const router = useRouter();
  const { language, setLanguage, setRole } = useApp();
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  const doLogout = async () => {
    await AsyncStorage.removeItem('cliniq_role');
    await AsyncStorage.removeItem('cliniq_patient');
    await AsyncStorage.removeItem('cliniq_auth_user');
    setRole(null);
    router.replace('/get-started');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const msg = language === 'hi' ? 'क्या आप लॉग आउट करना चाहते हैं?' : 'Are you sure you want to log out?';
      if (window.confirm(msg)) doLogout();
    } else {
      Alert.alert(
        language === 'hi' ? 'लॉग आउट' : 'Log Out',
        language === 'hi' ? 'क्या आप लॉग आउट करना चाहते हैं?' : 'Are you sure you want to log out?',
        [
          { text: t('cancel' as TranslationKey, language), style: 'cancel' },
          { text: language === 'hi' ? 'लॉग आउट' : 'Log Out', style: 'destructive', onPress: doLogout },
        ]
      );
    }
  };

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.primary} weight="bold" />
        </TouchableOpacity>

        <Text style={styles.header}>{t('settings', language)}</Text>

        {/* Language */}
        <PlatformCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language', language)}</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langPill, language === 'en' && styles.langPillActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langPillText, language === 'en' && styles.langPillTextActive]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langPill, language === 'hi' && styles.langPillActive]}
              onPress={() => setLanguage('hi')}
            >
              <Text style={[styles.langPillText, language === 'hi' && styles.langPillTextActive]}>
                हिंदी
              </Text>
            </TouchableOpacity>
          </View>
        </PlatformCard>

        {/* Notifications */}
        <PlatformCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications', language)}</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('pushNotifications', language)}</Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('soundAlerts', language)}</Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </PlatformCard>

        {/* About */}
        <PlatformCard style={styles.section}>
          <Text style={styles.sectionTitle}>{t('aboutCliniq', language)}</Text>
          <Text style={styles.aboutText}>{t('aboutDesc', language)}</Text>
          <Text style={styles.versionText}>{t('version', language)}</Text>
        </PlatformCard>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>
            {language === 'hi' ? 'लॉग आउट करें' : 'Log Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backBtn: {
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '600',
  },
  header: {
    ...typography.h2,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  langPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  langPillActive: {
    backgroundColor: colors.cardHighlight,
    borderColor: colors.primary,
  },
  langPillText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  langPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    ...typography.body,
    flex: 1,
  },
  aboutText: {
    ...typography.bodySecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  versionText: {
    ...typography.small,
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(244,67,54,0.08)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.2)',
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});

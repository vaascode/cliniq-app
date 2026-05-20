import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  BackHandler,
  Platform,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { t, type TranslationKey } from '../../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { getSymptomIcon, MapPin, Stethoscope, ChartBar, Users, Timer, LightbulbFilament, ArrowLeft } from '../../lib/icons';
import { Button } from '../../components/Button';
import { FadeInView } from '../../components/FadeInView';

export default function TokenScreen() {
  const router = useRouter();
  const { language, patientToken, hasConfirmedArrival } = useApp();

  // Override back gesture — go to find clinic (scan) instead of symptoms
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/patient/scan');
        return true;
      });
      return () => sub.remove();
    }, [router])
  );

  const [checkScale] = useState(new Animated.Value(0));
  const [checkOpacity] = useState(new Animated.Value(0));
  const [cardAnim] = useState(new Animated.Value(40));
  const [cardFade] = useState(new Animated.Value(0));
  const [btnAnim] = useState(new Animated.Value(30));
  const [btnFade] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.sequence([
      // 1. Check mark bounces in
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // 2. Card slides up
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(cardAnim, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
      // 3. Buttons slide up
      Animated.parallel([
        Animated.timing(btnFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(btnAnim, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  if (!patientToken) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>No token found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const symptomLabel = patientToken.symptom || t(patientToken.symptomKey as TranslationKey, language);

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Success Header ── */}
        <Animated.View
          style={[
            styles.successWrap,
            {
              opacity: checkOpacity,
              transform: [{ scale: checkScale }],
            },
          ]}
        >
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.successTitle}>{t('youreInQueue', language)}</Text>
          <Text style={styles.successSub}>
            {language === 'hi'
              ? 'आराम करें, हम आपको बता देंगे'
              : 'Relax, we\'ll notify you when it\'s time'}
          </Text>
        </Animated.View>

        {/* ── Hint Banner ── */}
        <Animated.View
          style={[
            styles.hintBanner,
            {
              opacity: checkOpacity,
              transform: [{ scale: checkScale }],
            },
          ]}
        >
          <LightbulbFilament size={16} color={colors.primary} weight="duotone" />
          <Text style={styles.hintText}>
            {language === 'hi'
              ? 'टोकन बन गया! क्लिनिक आएं और पहुँचने पर "मैं क्लिनिक पर हूँ" दबाएं।'
              : "Token generated! Come to clinic and tap 'I'm at the Clinic' when you arrive."}
          </Text>
        </Animated.View>

        {/* ── Token Card ── */}
        <Animated.View
          style={[
            styles.tokenCardWrap,
            {
              opacity: cardFade,
              transform: [{ translateY: cardAnim }],
            },
          ]}
        >
          <View style={styles.tokenCard}>
            {/* Token accent bar */}
            <View style={styles.tokenAccent} />

            {/* Token Number */}
            <View style={styles.tokenNumberWrap}>
              <Text style={styles.tokenLabel}>TOKEN</Text>
              <Text style={styles.tokenNumber}>#{patientToken.tokenNumber}</Text>
            </View>

            {/* Divider */}
            <View style={styles.tokenDivider} />

            {/* Info rows */}
            <View style={styles.tokenInfo}>
              <View style={styles.tokenRow}>
                <MapPin size={18} color={colors.primary} weight="duotone" />
                <View style={styles.tokenRowContent}>
                  <Text style={styles.tokenRowLabel}>{t('clinic', language)}</Text>
                  <Text style={styles.tokenRowValue}>{patientToken.clinicName}</Text>
                </View>
              </View>

              <View style={styles.tokenRow}>
                <Stethoscope size={18} color={colors.primary} weight="duotone" />
                <View style={styles.tokenRowContent}>
                  <Text style={styles.tokenRowLabel}>{t('doctor', language)}</Text>
                  <Text style={styles.tokenRowValue}>{patientToken.doctorName}</Text>
                </View>
              </View>

              <View style={styles.tokenRow}>
                {getSymptomIcon(patientToken.symptomKey, { size: 18, color: colors.primary, weight: 'duotone' })}
                <View style={styles.tokenRowContent}>
                  <Text style={styles.tokenRowLabel}>{t('concern', language)}</Text>
                  <Text style={styles.tokenRowValue}>{symptomLabel}</Text>
                </View>
              </View>

              {/* People ahead + wait — single row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statIconWrap}><Users size={16} color={colors.primary} weight="duotone" /></View>
                  <Text style={styles.statValue}>{patientToken.peopleAhead}</Text>
                  <Text style={styles.statLabel}>{language === 'hi' ? 'आगे' : 'ahead'}</Text>
                </View>
                <View style={styles.statDot} />
                <View style={styles.statItem}>
                  <View style={styles.statIconWrap}><Timer size={16} color={colors.primary} weight="duotone" /></View>
                  <Text style={styles.statValue}>~{patientToken.estimatedWait}</Text>
                  <Text style={styles.statLabel}>{t('mins', language)}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Action Buttons ── */}
        <Animated.View
          style={[
            styles.actionsWrap,
            {
              opacity: btnFade,
              transform: [{ translateY: btnAnim }],
            },
          ]}
        >
          {/* Primary: I'm at the Clinic */}
          {!hasConfirmedArrival ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/patient/confirm-arrival')}
            >
              <MapPin size={16} color="#FFFFFF" weight="fill" />
              <Text style={styles.primaryBtnText}>{t('imAtClinic', language)}</Text>
              <Text style={styles.primaryBtnArrow}>→</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.arrivedBadge}>
              <Text style={styles.arrivedIcon}>✓</Text>
              <Text style={styles.arrivedText}>{t('arrivalConfirmed', language)}</Text>
            </View>
          )}

          {/* Secondary row: Tracker + Generate Another */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/patient/tracker')}
            >
              <ChartBar size={16} color={colors.primary} weight="duotone" />
              <Text style={styles.secondaryBtnText}>
                {language === 'hi' ? 'लाइव ट्रैकर' : 'Live Tracker'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/patient/symptoms')}
            >
              <Text style={styles.secondaryBtnIcon}>＋</Text>
              <Text style={styles.secondaryBtnText}>
                {language === 'hi' ? 'और टोकन' : 'New Token'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Back to Home link */}
          <TouchableOpacity
            style={styles.backLink}
            activeOpacity={0.6}
            onPress={() => router.replace('/patient/scan')}
          >
            <ArrowLeft size={16} color={colors.primary} weight="bold" />
            <Text style={styles.backLinkText}>
              {language === 'hi' ? 'होम पर जाएं' : 'Back to Home'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl + 20,
  },

  /* ── Success Header ── */
  successWrap: {
    alignItems: 'center',
    marginBottom: spacing.xl + 4,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  checkMark: {
    fontSize: 34,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  successTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: 4,
  },
  successSub: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
  },

  /* ── Hint Banner ── */
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(22,101,52,0.06)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    marginBottom: spacing.lg,
    gap: 10,
  },
  hintIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.primary,
    fontWeight: '500',
  },

  /* ── Token Card ── */
  tokenCardWrap: {
    marginBottom: spacing.xl,
  },
  tokenCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tokenAccent: {
    height: 3,
    backgroundColor: colors.primary,
  },
  tokenNumberWrap: {
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 16,
  },
  tokenLabel: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  tokenNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  tokenDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
  tokenInfo: {
    padding: 20,
    gap: 14,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenRowIcon: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
  },
  tokenRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  tokenRowLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    minWidth: 50,
  },
  tokenRowValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },

  /* Stats row (people ahead + wait) */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statIconWrap: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },

  /* ── Actions ── */
  actionsWrap: {
    gap: 12,
  },

  /* Primary button */
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  primaryBtnIcon: {
    fontSize: 18,
  },
  primaryBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  primaryBtnArrow: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Arrived badge */
  arrivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76,175,80,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.3)',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  arrivedIcon: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '800',
  },
  arrivedText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '700',
  },

  /* Secondary buttons row */
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    gap: 6,
  },
  secondaryBtnIcon: {
    fontSize: 15,
  },
  secondaryBtnText: {
    fontSize: 13.5,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  /* Back link */
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    marginTop: 4,
  },
  backLinkText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

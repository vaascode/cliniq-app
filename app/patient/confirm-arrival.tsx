import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { t } from '../../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Button } from '../../components/Button';
import { FadeInView } from '../../components/FadeInView';
import { ArrowLeft } from '../../lib/icons';

type ScreenState = 'scanning' | 'confirming' | 'confirmed';

export default function ConfirmArrivalScreen() {
  const router = useRouter();
  const { language, patientToken, confirmArrival } = useApp();
  const [state, setState] = useState<ScreenState>('scanning');

  // Scan line animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  // Success animations
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  // Confirming spinner
  const spinAnim = useRef(new Animated.Value(0)).current;
  // Pulse ring on success
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (state === 'scanning') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [state]);

  useEffect(() => {
    if (state === 'confirming') {
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spin.start();
      // After brief delay, confirm
      const timer = setTimeout(() => {
        spin.stop();
        confirmArrival();
        setState('confirmed');
      }, 1800);
      return () => {
        spin.stop();
        clearTimeout(timer);
      };
    }
  }, [state]);

  useEffect(() => {
    if (state === 'confirmed') {
      // Success animation sequence
      Animated.sequence([
        // Check mark pops in
        Animated.parallel([
          Animated.spring(checkScale, {
            toValue: 1,
            tension: 80,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(checkOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Pulse ring
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.8,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        // Content fades in
        Animated.parallel([
          Animated.timing(contentFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(contentSlide, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [state]);

  const handleScanTap = () => {
    if (state !== 'scanning') return;
    setState('confirming');
  };

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 236],
  });

  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ── Scanning state ──
  if (state === 'scanning' || state === 'confirming') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.inner}>
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.primary} weight="bold" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>{t('scanClinicQrTitle' as any, language)}</Text>

          {/* Scanner frame */}
          <TouchableOpacity
            style={styles.scannerWrap}
            activeOpacity={0.9}
            onPress={handleScanTap}
            disabled={state === 'confirming'}
          >
            <View style={styles.scannerFrame}>
              {state === 'scanning' && (
                <Animated.View
                  style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
                />
              )}
              {state === 'confirming' && (
                <View style={styles.confirmingOverlay}>
                  <Animated.View style={{ transform: [{ rotate: spinRotate }] }}>
                    <View style={styles.spinner}>
                      <View style={styles.spinnerArc} />
                    </View>
                  </Animated.View>
                  <Text style={styles.confirmingText}>
                    {language === 'hi' ? 'पुष्टि हो रही है...' : 'Confirming...'}
                  </Text>
                </View>
              )}
              {/* Corner markers */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </TouchableOpacity>

          {/* Instructions */}
          <Text style={styles.instruction}>{t('pointCameraAtQr' as any, language)}</Text>
          <Text style={styles.note}>{t('scanConfirmNote' as any, language)}</Text>

          {state === 'scanning' && (
            <Text style={styles.tapHint}>{t('tapToSimulateScan' as any, language)}</Text>
          )}

          {/* Token badge at bottom */}
          {patientToken && (
            <View style={styles.tokenStrip}>
              <Text style={styles.tokenStripLabel}>TOKEN</Text>
              <Text style={styles.tokenStripNumber}>#{patientToken.tokenNumber}</Text>
              <Text style={styles.tokenStripClinic}>{patientToken.clinicName}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Confirmed state ──
  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.confirmedInner}>
        {/* Animated check */}
        <View style={styles.checkContainer}>
          {/* Pulse ring */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.checkCircle,
              {
                transform: [{ scale: checkScale }],
                opacity: checkOpacity,
              },
            ]}
          >
            <Text style={styles.checkMark}>✓</Text>
          </Animated.View>
        </View>

        {/* Success text */}
        <Animated.View
          style={[
            styles.confirmedContent,
            {
              opacity: contentFade,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          <Text style={styles.confirmedTitle}>{t('arrivalConfirmed' as any, language)}</Text>
          <Text style={styles.confirmedSubtitle}>{t('tokenNowActive' as any, language)}</Text>

          {/* Token preview */}
          {patientToken && (
            <View style={styles.confirmedTokenCard}>
              <View style={styles.confirmedTokenBadge}>
                <Text style={styles.confirmedTokenNumber}>#{patientToken.tokenNumber}</Text>
              </View>
              <View style={styles.confirmedArrivedPill}>
                <View style={styles.confirmedArrivedDot} />
                <Text style={styles.confirmedArrivedText}>
                  {t('arrived' as any, language)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.confirmedActions}>
            <Button
              title={`${t('viewLiveQueueStatus' as any, language)} →`}
              onPress={() => router.replace('/patient/tracker')}
              size="lg"
            />
            <TouchableOpacity
              style={styles.backToTokenBtn}
              onPress={() => router.back()}
            >
              <ArrowLeft size={16} color={colors.primary} weight="bold" />
              <Text style={styles.backToTokenText}>
                {language === 'hi' ? 'टोकन पर वापस जाएं' : 'Back to Token'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
    </FadeInView>
  );
}

const FRAME_SIZE = 260;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: 26,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: -2,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },

  // Scanner
  scannerWrap: {
    marginBottom: spacing.xl,
  },
  scannerFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    backgroundColor: 'rgba(22,101,52,0.04)',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },

  // Confirming overlay
  confirmingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    borderRadius: borderRadius.lg,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.primary,
    position: 'relative',
  },
  spinnerArc: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: colors.primary,
  },
  confirmingText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },

  // Instructions
  instruction: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  note: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  tapHint: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  // Token strip
  tokenStrip: {
    marginTop: 'auto',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  tokenStripLabel: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 2,
  },
  tokenStripNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  tokenStripClinic: {
    ...typography.caption,
    marginTop: 2,
  },

  // ── Confirmed ──
  confirmedInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  checkContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 44,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  confirmedContent: {
    alignItems: 'center',
    width: '100%',
  },
  confirmedTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  confirmedSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  confirmedTokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  confirmedTokenBadge: {
    backgroundColor: colors.cardHighlight,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  confirmedTokenNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  confirmedArrivedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  confirmedArrivedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  confirmedArrivedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  confirmedActions: {
    width: '100%',
    gap: spacing.md,
  },
  backToTokenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  backToTokenText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

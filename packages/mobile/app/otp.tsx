import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  BackHandler,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { useApp, type AuthUser } from '../lib/context/AppContext';
import { t, type TranslationKey } from '../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { DeviceMobile, CheckCircle, XCircle, ArrowLeft } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';

type ScreenStep = 'phone' | 'otp' | 'verifying' | 'success' | 'error';

export default function OTPScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { language, role, setAuthUser, doctorProfile, patientProfile } = useApp();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [step, setStep] = useState<ScreenStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [sending, setSending] = useState(false);
  const [shakeAnim] = useState(new Animated.Value(0));
  const [successScale] = useState(new Animated.Value(0));
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goBack = useCallback(() => {
    if (step === 'otp' || step === 'error') {
      setStep('phone');
      setOtp(['', '', '', '', '', '']);
      setTimer(30);
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/signin');
    }
  }, [step, navigation, router]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => handler.remove();
  }, [goBack]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [step, timer]);

  const maskedPhone = phone.length >= 10
    ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`
    : `+91 ${phone}`;

  const handleSendOTP = async () => {
    if (phone.length < 10) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setSending(true);
    // Mock send delay
    setTimeout(() => {
      setSending(false);
      setStep('otp');
      setTimer(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    }, 1200);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste — spread digits across boxes
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      otpRefs.current[nextIdx]?.focus();
      // Auto verify if all filled
      if (newOtp.every(d => d !== '')) {
        verifyOTP(newOtp);
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto verify when all filled
    if (value && newOtp.every(d => d !== '')) {
      verifyOTP(newOtp);
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (otpArr: string[]) => {
    const code = otpArr.join('');
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setStep('verifying');

    // Mock verification
    setTimeout(() => {
      // Accept any 6-digit code except 000000
      if (code === '000000') {
        setStep('error');
        // Shake animation
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start(() => {
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
        });
        // Reset OTP
        setTimeout(() => {
          setOtp(['', '', '', '', '', '']);
          setStep('otp');
          otpRefs.current[0]?.focus();
        }, 1500);
      } else {
        setStep('success');
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        Animated.spring(successScale, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }).start();

        // Navigate after success animation
        setTimeout(() => {
          const mockUser: AuthUser = {
            name: '',
            email: '',
            phone: `+91${phone}`,
            provider: 'phone',
          };
          setAuthUser(mockUser);

          if (role === 'doctor') {
            if (doctorProfile) {
              router.replace('/doctor/dashboard');
            } else {
              router.replace({
                pathname: '/doctor/registration',
                params: { authPhone: `+91${phone}` },
              });
            }
          } else {
            if (patientProfile) {
              router.replace('/patient/scan');
            } else {
              router.replace({
                pathname: '/patient/registration',
                params: { authPhone: `+91${phone}` },
              });
            }
          }
        }, 1200);
      }
    }, 1500);
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    otpRefs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Back */}
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <ArrowLeft size={22} color={colors.primary} weight="bold" />
            </TouchableOpacity>

            {/* Phone icon */}
            <View style={styles.iconContainer}>
              {step === 'success'
                ? <CheckCircle size={48} color={colors.success} weight="duotone" />
                : step === 'error'
                  ? <XCircle size={48} color={colors.error} weight="duotone" />
                  : <DeviceMobile size={48} color={colors.primary} weight="duotone" />}
            </View>

            {/* ── Phone Input Step ── */}
            {step === 'phone' && (
              <View style={styles.stepContent}>
                <Text style={styles.heading}>
                  {t('enterPhone' as TranslationKey, language)}
                </Text>
                <Text style={styles.subtext}>
                  {t('phoneSubtext' as TranslationKey, language)}
                </Text>

                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.flag}>🇮🇳</Text>
                    <Text style={styles.codeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="XXXXX XXXXX"
                    placeholderTextColor={colors.textSecondary}
                    value={phone}
                    onChangeText={(val) => setPhone(val.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="phone-pad"
                    inputMode="numeric"
                    maxLength={10}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.sendBtn, phone.length < 10 && styles.sendBtnDisabled]}
                  onPress={handleSendOTP}
                  disabled={phone.length < 10 || sending}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={styles.sendBtnText}>
                      {t('sendOTP' as TranslationKey, language)}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ── OTP Input Step ── */}
            {(step === 'otp' || step === 'error') && (
              <Animated.View
                style={[styles.stepContent, { transform: [{ translateX: shakeAnim }] }]}
              >
                <Text style={styles.heading}>
                  {t('enterOTP' as TranslationKey, language)}
                </Text>
                <Text style={styles.subtext}>
                  {t('otpSentTo' as TranslationKey, language)} {maskedPhone}
                </Text>

                {step === 'error' && (
                  <Text style={styles.errorText}>
                    {t('wrongOTP' as TranslationKey, language)}
                  </Text>
                )}

                {/* 6 digit boxes */}
                <View style={styles.otpRow}>
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(ref) => { otpRefs.current[i] = ref; }}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : {},
                        step === 'error' ? styles.otpBoxError : {},
                      ]}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(val, i)}
                      onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                      keyboardType="number-pad"
                      maxLength={6}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {/* Timer / Resend */}
                <View style={styles.timerRow}>
                  {timer > 0 ? (
                    <Text style={styles.timerText}>
                      {t('resendOTPIn' as TranslationKey, language)} {timer}
                      {t('seconds' as TranslationKey, language)}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResend}>
                      <Text style={styles.resendText}>
                        {t('resendOTP' as TranslationKey, language)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            )}

            {/* ── Verifying Step ── */}
            {step === 'verifying' && (
              <View style={styles.stepContent}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.heading, { marginTop: spacing.md }]}>
                  {t('verifying' as TranslationKey, language)}
                </Text>
              </View>
            )}

            {/* ── Success Step ── */}
            {step === 'success' && (
              <View style={styles.stepContent}>
                <Animated.View style={{ transform: [{ scale: successScale }] }}>
                  <View style={styles.successCircle}>
                    <Text style={styles.successCheck}>✓</Text>
                  </View>
                </Animated.View>
                <Text style={[styles.heading, { marginTop: spacing.lg, color: colors.success }]}>
                  {t('verified' as TranslationKey, language)}
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  backArrow: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '600',
  },

  // Icon
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconEmoji: {
    fontSize: 48,
  },

  // Steps
  stepContent: {
    alignItems: 'center',
  },
  heading: {
    ...typography.h2,
    fontSize: 26,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtext: {
    ...typography.bodySecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontSize: 15,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.md,
    marginTop: -spacing.md,
  },

  // Phone input
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.lg,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  flag: {
    fontSize: 18,
  },
  codeText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  // OTP boxes
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
    width: '100%',
    justifyContent: 'center',
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  otpBoxError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(220,38,38,0.06)',
  },

  // Timer
  timerRow: {
    alignItems: 'center',
  },
  timerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Success
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheck: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
});

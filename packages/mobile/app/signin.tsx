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
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { useApp, type AuthUser } from '../lib/context/AppContext';
import { t, type TranslationKey } from '../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { DeviceMobile, Envelope, ArrowLeft } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const patientImage = require('../assets/patient-signin.png');
const doctorImage = require('../assets/doctor-signin.png');

export default function SignInScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { language, role, setAuthUser, doctorProfile, patientProfile } = useApp();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [imageScale] = useState(new Animated.Value(0.92));
  const [imageOpacity] = useState(new Animated.Value(0));
  const [btnAnims] = useState([
    new Animated.Value(40),
    new Animated.Value(40),
    new Animated.Value(40),
    new Animated.Value(40),
  ]);
  const [btnOpacities] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  const [emailExpanded, setEmailExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState<string | null>(null);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const isDoctor = role === 'doctor';

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/role');
    }
  }, [navigation, router]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => handler.remove();
  }, [goBack]);

  useEffect(() => {
    // Fade in entire page
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();

    // Image entrance — scale up + fade
    Animated.parallel([
      Animated.spring(imageScale, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Buttons stagger in
    Animated.stagger(70, btnAnims.map((a, i) =>
      Animated.parallel([
        Animated.spring(a, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(btnOpacities[i], { toValue: 1, duration: 300, useNativeDriver: true }),
      ])
    )).start();
  }, []);

  const toggleEmailExpand = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    const expanding = !emailExpanded;
    setEmailExpanded(expanding);
    Animated.spring(expandAnim, {
      toValue: expanding ? 1 : 0,
      tension: 50,
      friction: 10,
      useNativeDriver: false,
    }).start();
  };

  const navigateAfterAuth = (user: AuthUser) => {
    setAuthUser(user);
    if (role === 'doctor') {
      if (doctorProfile) {
        router.replace('/doctor/dashboard');
      } else {
        router.replace({
          pathname: '/doctor/registration',
          params: { authName: user.name, authEmail: user.email, authPhoto: user.photo || '' },
        });
      }
    } else {
      if (patientProfile) {
        router.replace('/patient/scan');
      } else {
        router.replace({
          pathname: '/patient/registration',
          params: { authName: user.name, authEmail: user.email, authPhoto: user.photo || '' },
        });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setLoading('google');
    setTimeout(() => {
      const mockUser: AuthUser = {
        name: 'Rajesh Sharma',
        email: 'rajesh.sharma@gmail.com',
        photo: undefined,
        provider: 'google',
      };
      setLoading(null);
      navigateAfterAuth(mockUser);
    }, 1500);
  };

  const handleAppleSignIn = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setLoading('apple');
    setTimeout(() => {
      const mockUser: AuthUser = {
        name: 'Rajesh S.',
        email: 'rajesh@icloud.com',
        provider: 'apple',
      };
      setLoading(null);
      navigateAfterAuth(mockUser);
    }, 1500);
  };

  const handlePhoneAuth = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    router.push('/otp');
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setLoading('email');
    setTimeout(() => {
      const mockUser: AuthUser = {
        name: email.split('@')[0].replace(/[._]/g, ' '),
        email: email.trim(),
        provider: 'email',
      };
      setLoading(null);
      navigateAfterAuth(mockUser);
    }, 1500);
  };

  const expandHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 230],
  });

  const headerTitle = isDoctor
    ? (language === 'hi' ? 'डॉक्टर सिक्योर पोर्टल' : 'Doctor Secure Portal')
    : (language === 'hi' ? 'मरीज़ साइन-इन' : 'Patient Sign-In');

  const headerSubtitle = isDoctor
    ? (language === 'hi' ? 'अपने क्लिनिक को सुरक्षित रूप से एक्सेस करें' : 'Securely access your clinic dashboard')
    : (language === 'hi' ? 'अपनी कतार प्रबंधित करने के लिए साइन इन करें' : 'Sign in to manage your queue');

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* ── Hero image zone — edge to edge, blends into page ── */}
            <View style={styles.heroZone}>
              {/* Full-width image */}
              <Animated.View
                style={[
                  styles.heroWrap,
                  {
                    opacity: imageOpacity,
                    transform: [{ scale: imageScale }],
                  },
                ]}
              >
                <Image
                  source={isDoctor ? doctorImage : patientImage}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </Animated.View>

              {/* Gradient overlay at bottom of image to fade into white */}
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.85)', '#FFFFFF']}
                locations={[0, 0.3, 0.7, 1]}
                style={styles.heroBottomFade}
              />

              {/* Back button overlaid on top of image */}
              <SafeAreaView edges={['top']} style={styles.backSafeArea}>
                <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
                  <View style={styles.backCircle}>
                    <ArrowLeft size={20} color={colors.primary} weight="bold" />
                  </View>
                </TouchableOpacity>
              </SafeAreaView>
            </View>

            {/* ── Title + subtitle ── */}
            <View style={styles.textSection}>
              <Text style={styles.heading}>{headerTitle}</Text>
              <Text style={styles.subheading}>{headerSubtitle}</Text>
            </View>

            {/* ── Auth buttons — pill shaped ── */}
            <View style={styles.buttonsSection}>

              {/* Phone */}
              <Animated.View style={{ transform: [{ translateY: btnAnims[0] }], opacity: btnOpacities[0] }}>
                <TouchableOpacity
                  style={[styles.pillBtn, styles.phonePill]}
                  onPress={handlePhoneAuth}
                  activeOpacity={0.75}
                  disabled={loading !== null}
                >
                  <View style={styles.pillIconWrap}>
                    <DeviceMobile size={20} color={colors.primary} weight="fill" />
                  </View>
                  <Text style={[styles.pillText, styles.phoneText]}>
                    {language === 'hi' ? 'फ़ोन से लॉगिन करें' : 'Login with Phone'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Google */}
              <Animated.View style={{ transform: [{ translateY: btnAnims[1] }], opacity: btnOpacities[1] }}>
                <TouchableOpacity
                  style={[styles.pillBtn, styles.googlePill]}
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.75}
                  disabled={loading !== null}
                >
                  {loading === 'google' ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : (
                    <>
                      <View style={styles.pillIconWrap}>
                        <Text style={styles.googleG}>G</Text>
                      </View>
                      <Text style={styles.pillText}>
                        {language === 'hi' ? 'Google से लॉगिन करें' : 'Login with Google'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Apple */}
              <Animated.View style={{ transform: [{ translateY: btnAnims[2] }], opacity: btnOpacities[2] }}>
                <TouchableOpacity
                  style={[styles.pillBtn, styles.applePill]}
                  onPress={handleAppleSignIn}
                  activeOpacity={0.75}
                  disabled={loading !== null}
                >
                  {loading === 'apple' ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <View style={styles.pillIconWrap}>
                        <Text style={styles.appleIcon}></Text>
                      </View>
                      <Text style={[styles.pillText, styles.appleText]}>
                        {language === 'hi' ? 'Apple से लॉगिन करें' : 'Login with Apple'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* ── Or divider ── */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  {t('orDivider' as TranslationKey, language)}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email — pill, filled green */}
              <Animated.View style={{ transform: [{ translateY: btnAnims[3] }], opacity: btnOpacities[3] }}>
                <TouchableOpacity
                  style={[styles.pillBtn, styles.emailPill]}
                  onPress={toggleEmailExpand}
                  activeOpacity={0.75}
                  disabled={loading !== null}
                >
                  <View style={styles.pillIconWrap}>
                    <Envelope size={20} color="#FFFFFF" weight="fill" />
                  </View>
                  <Text style={[styles.pillText, styles.emailText]}>
                    {language === 'hi' ? 'ईमेल से लॉगिन करें' : 'Login with Email'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Email expanded form */}
              <Animated.View style={[styles.emailForm, { height: expandHeight, opacity: expandAnim }]}>
                <View style={styles.tabRow}>
                  <TouchableOpacity
                    style={[styles.tab, authTab === 'login' && styles.tabActive]}
                    onPress={() => setAuthTab('login')}
                  >
                    <Text style={[styles.tabText, authTab === 'login' && styles.tabTextActive]}>
                      {t('loginTab' as TranslationKey, language)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, authTab === 'signup' && styles.tabActive]}
                    onPress={() => setAuthTab('signup')}
                  >
                    <Text style={[styles.tabText, authTab === 'signup' && styles.tabTextActive]}>
                      {t('signUpTab' as TranslationKey, language)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder={t('emailPlaceholder' as TranslationKey, language)}
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder={t('passwordPlaceholder' as TranslationKey, language)}
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.showHideBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.showHideText}>
                      {showPassword
                        ? t('hidePassword' as TranslationKey, language)
                        : t('showPassword' as TranslationKey, language)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (!email.trim() || !password.trim()) && styles.submitBtnDisabled,
                  ]}
                  onPress={handleEmailAuth}
                  disabled={!email.trim() || !password.trim() || loading !== null}
                  activeOpacity={0.8}
                >
                  {loading === 'email' ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {t('submitAuth' as TranslationKey, language)}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const PILL_HEIGHT = 56;
const PILL_RADIUS = PILL_HEIGHT / 2;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },

  // ── Hero zone — image fills full width ──
  heroZone: {
    position: 'relative',
    width: SCREEN_WIDTH,
  },
  heroWrap: {
    width: SCREEN_WIDTH,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.92,
  },
  heroBottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    zIndex: 10,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }
      : { elevation: 3 }),
  },

  // ── Title / subtitle ──
  textSection: {
    paddingHorizontal: spacing.lg,
    marginTop: -16,
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Buttons section ──
  buttonsSection: {
    paddingHorizontal: 24,
    gap: 12,
  },

  // ── Pill buttons ──
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PILL_HEIGHT,
    borderRadius: PILL_RADIUS,
    paddingHorizontal: 20,
    gap: 12,
  },
  pillIconWrap: {
    width: 28,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Phone — outline green
  phonePill: {
    backgroundColor: 'rgba(22,101,52,0.04)',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  phoneText: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Google — light border
  googlePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  googleG: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },

  // Apple — solid black
  applePill: {
    backgroundColor: '#1A1A1A',
  },
  appleIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  appleText: {
    color: '#FFFFFF',
  },

  // Email — solid green
  emailPill: {
    backgroundColor: colors.primary,
  },
  emailText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginHorizontal: 14,
  },

  // ── Email form ──
  emailForm: {
    overflow: 'hidden',
    gap: 10,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 }
      : { elevation: 1 }),
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 70,
  },
  showHideBtn: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  showHideText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: PILL_RADIUS,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

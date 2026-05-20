import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  BackHandler,
  Platform,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { useRouter, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../lib/context/AppContext';
import { colors, spacing, borderRadius } from '../lib/theme';
import { Heart, Stethoscope, ArrowLeft } from '../lib/icons';
import * as Haptics from 'expo-haptics';
import type { Language } from '../lib/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const heroImage = require('../assets/role-hero.png');

export default function RoleScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { language, setLanguage, setRole } = useApp();
  const [langPickerVisible, setLangPickerVisible] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0.92)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const btn1Slide = useRef(new Animated.Value(50)).current;
  const btn1Opacity = useRef(new Animated.Value(0)).current;
  const btn2Slide = useRef(new Animated.Value(50)).current;
  const btn2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigation.canGoBack()) router.back();
      else router.replace('/get-started');
      return true;
    });
    return () => handler.remove();
  }, [navigation, router]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();

    Animated.parallel([
      Animated.spring(imageScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
      Animated.timing(imageOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    Animated.spring(titleSlide, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }).start();

    Animated.stagger(150, [
      Animated.parallel([
        Animated.spring(btn1Slide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(btn1Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(btn2Slide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(btn2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleSelectPatient = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    await setRole('patient');
    router.push('/signin' as any);
  };

  const handleSelectDoctor = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    await setRole('doctor');
    router.push('/signin' as any);
  };

  const goBack = () => {
    if (navigation.canGoBack()) router.back();
    else router.replace('/get-started');
  };

  return (
    <View style={styles.root}>
      {/* ── Language toggle pinned to top-right of safe area ── */}
      <SafeAreaView edges={['top']} style={styles.langSafeArea}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
          <View style={styles.backCircle}>
            <ArrowLeft size={20} color={colors.primary} weight="bold" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.langPill}
          activeOpacity={0.75}
          onPress={() => setLangPickerVisible(true)}
        >
          <Text style={styles.langPillText}>{language === 'hi' ? 'हिंदी' : 'English'}</Text>
          <Text style={styles.langPillChevron}>▾</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Language picker modal */}
      <Modal
        visible={langPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangPickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLangPickerVisible(false)}>
          <View style={styles.langDropdown}>
            <Text style={styles.langDropdownTitle}>Select Language</Text>
            {(['en', 'hi'] as Language[]).map((code) => (
              <TouchableOpacity
                key={code}
                style={[styles.langOption, language === code && styles.langOptionActive]}
                activeOpacity={0.7}
                onPress={async () => {
                  await setLanguage(code);
                  setLangPickerVisible(false);
                }}
              >
                <Text style={[styles.langOptionText, language === code && styles.langOptionTextActive]}>
                  {code === 'en' ? 'English' : 'हिंदी'}
                </Text>
                {language === code && <Text style={styles.langCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── Main content ── */}
      <View style={styles.content}>
        {/* Hero image with expo-image for fast loading */}
        <Animated.View
          style={[
            styles.heroWrap,
            {
              opacity: imageOpacity,
              transform: [{ scale: imageScale }],
            },
          ]}
        >
          <ExpoImage
            source={heroImage}
            style={styles.heroImage}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
            priority="high"
          />
        </Animated.View>

        {/* Title + subtitle */}
        <Animated.View
          style={[
            styles.textSection,
            { opacity: fadeAnim, transform: [{ translateY: titleSlide }] },
          ]}
        >
          <Text style={[styles.heading, language === 'hi' && styles.headingHi]}>
            {language === 'hi' ? 'Cliniq में आपका स्वागत है' : 'Welcome to Cliniq'}
          </Text>
          <Text style={styles.subheading}>
            {language === 'hi'
              ? 'शुरू करने के लिए अपनी भूमिका चुनें'
              : 'Choose how you want to get started'}
          </Text>
        </Animated.View>

        {/* Role buttons */}
        <View style={styles.buttonsSection}>
          <Animated.View style={{ transform: [{ translateY: btn1Slide }], opacity: btn1Opacity }}>
            <TouchableOpacity
              style={[styles.pillBtn, styles.patientPill]}
              activeOpacity={0.85}
              onPress={handleSelectPatient}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pillGradient}
              >
                <View style={styles.pillIconWrap}>
                  <Heart size={22} color="#FFFFFF" weight="duotone" />
                </View>
                <Text style={styles.patientPillText}>
                  {language === 'hi' ? 'मैं मरीज़ हूँ' : "I'm a Patient"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ translateY: btn2Slide }], opacity: btn2Opacity }}>
            <TouchableOpacity
              style={[styles.pillBtn, styles.doctorPill]}
              activeOpacity={0.85}
              onPress={handleSelectDoctor}
            >
              <View style={styles.pillIconWrap}>
                <Stethoscope size={22} color={colors.primary} weight="duotone" />
              </View>
              <Text style={styles.doctorPillText}>
                {language === 'hi' ? 'मैं डॉक्टर हूँ' : "I'm a Doctor"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* ── Footer pinned to bottom ── */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Text style={styles.footerLine1}>🔒 Secure & Encrypted</Text>
        <Text style={styles.footerLine2}>By continuing, you agree to our Terms & Privacy Policy</Text>
      </SafeAreaView>
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

  // ── Language toggle pinned top-right ──
  langSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
  },
  backBtn: {},
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }
      : { elevation: 3 }),
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(22, 101, 52, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }
      : { elevation: 3 }),
  },
  langPillText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.3 },
  langPillChevron: { fontSize: 10, color: colors.textSecondary, marginTop: 1 },

  // ── Language modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  langDropdown: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  langDropdownTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 14,
    paddingBottom: 6,
    paddingTop: 4,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  langOptionActive: {
    backgroundColor: 'rgba(22,101,52,0.08)',
  },
  langOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  langOptionTextActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  langCheck: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },

  // ── Main content ──
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 20,
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  heroImage: {
    width: SCREEN_WIDTH * 0.92,
    height: SCREEN_WIDTH * 0.75,
  },
  textSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: 28,
    alignItems: 'center',
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  headingHi: {
    fontSize: 24,
    letterSpacing: 0,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Buttons section ──
  buttonsSection: {
    paddingHorizontal: 24,
    gap: 14,
  },
  pillBtn: {
    borderRadius: PILL_RADIUS,
    overflow: 'hidden',
  },
  pillIconWrap: {
    width: 28,
    alignItems: 'center',
  },
  pillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: PILL_HEIGHT,
    paddingHorizontal: 24,
    gap: 10,
  },
  patientPill: {
    ...(Platform.OS === 'ios'
      ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16 }
      : { elevation: 8 }),
  },
  patientPillText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  doctorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: PILL_HEIGHT,
    paddingHorizontal: 24,
    gap: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  doctorPillText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },

  // ── Footer ──
  footer: {
    paddingBottom: 8,
    paddingTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  footerLine1: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  footerLine2: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

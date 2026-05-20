import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
  BackHandler,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../lib/theme';
import { MapPin, Bell, Lightning, ListBullets, ChartBar, Stethoscope, User, Heart, Scan, House } from 'phosphor-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_COUNT = 3;

/* ── Slide data for Doctor & Patient cards ── */
interface CardSlideData {
  id: string;
  title: string;
  subtitle: string;
  iconComp: React.ComponentType<any>;
  features: { iconComp: React.ComponentType<any>; text: string }[];
  accentColor: string;
  accentLight: string;
}

const CARD_SLIDES: CardSlideData[] = [
  {
    id: 'doctor',
    title: 'For Doctors',
    subtitle: 'Manage your OPD queue effortlessly',
    iconComp: Stethoscope,
    features: [
      { iconComp: ListBullets, text: 'See live queue with "Arrived" status' },
      { iconComp: Heart, text: 'One-tap "Next Patient" flow' },
      { iconComp: Bell, text: 'Voice notes during consultation' },
      { iconComp: ChartBar, text: 'Smart analytics & insights' },
    ],
    accentColor: '#166534',
    accentLight: 'rgba(22, 101, 52, 0.15)',
  },
  {
    id: 'patient',
    title: 'For Patients',
    subtitle: 'Skip the queue, not the doctor',
    iconComp: User,
    features: [
      { iconComp: House, text: 'Generate token from home' },
      { iconComp: Heart, text: 'Book for family members easily' },
      { iconComp: MapPin, text: 'Live queue tracking' },
      { iconComp: Scan, text: 'QR scan at clinic for instant arrival' },
    ],
    accentColor: colors.primary,
    accentLight: 'rgba(22, 101, 52, 0.15)',
  },
];

/* ── Gradient backgrounds per slide index ── */
const SLIDE_GRADIENTS: [string, string, string][] = [
  [colors.background, colors.background, colors.background],        // Slide 0: Hero — dark neutral
  [colors.background, '#E8F5E9', colors.background],          // Slide 1: Doctor — green
  [colors.background, '#E8F5E9', colors.background],          // Slide 2: Patient — green
];

const SLIDE_ACCENT_COLORS = [
  colors.primary,   // Hero
  '#166534',        // Doctor
  colors.primary,        // Patient
];

/* ── Hero slide features ── */
const HERO_FEATURES = [
  { iconComp: MapPin, title: 'Live Queue Tracking', desc: 'Know exactly when your turn is coming' },
  { iconComp: Bell, title: 'Smart Notifications', desc: 'Get alerts when your turn is near' },
  { iconComp: Stethoscope, title: 'Zero Wait Time', desc: 'Arrive at the clinic just in time' },
];

export default function GetStartedScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [logoAnim] = useState(new Animated.Value(0));
  const [btnAnim] = useState(new Animated.Value(40));

  // Block hardware back
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  // Entrance animations
  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
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

  const handleGetStarted = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    router.push('/role');
  };

  return (
    <View style={styles.container}>
      {/* ── Animated gradient backgrounds (crossfade) ── */}
      {SLIDE_GRADIENTS.map((gradColors, index) => {
        const opacity = scrollX.interpolate({
          inputRange: [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ],
          outputRange: [0, 1, 0],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={`bg-${index}`}
            style={[StyleSheet.absoluteFillObject, { opacity }]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={gradColors}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
        );
      })}

      {/* ── Floating ambient orbs ── */}
      {SLIDE_ACCENT_COLORS.map((color, index) => {
        const opacity = scrollX.interpolate({
          inputRange: [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ],
          outputRange: [0, 0.3, 0],
          extrapolate: 'clamp',
        });
        return (
          <React.Fragment key={`orb-${index}`}>
            <Animated.View
              pointerEvents="none"
              style={[styles.orb, styles.orbTopRight, { backgroundColor: color, opacity }]}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.orb, styles.orbBottomLeft, { backgroundColor: color, opacity }]}
            />
          </React.Fragment>
        );
      })}

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {/* ── Logo Header ── */}
        <Animated.View
          style={[
            styles.headerSection,
            {
              opacity: logoAnim,
              transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}
        >
          <View style={styles.logoRow}>
            <View style={styles.logo}>
              <View style={styles.crossVertical} />
              <View style={styles.crossHorizontal} />
              <View style={styles.clockDot} />
              <View style={styles.clockHand} />
            </View>
            <View>
              <Text style={styles.appName}>Cliniq</Text>
              <Text style={styles.appTagline}>Smarter waiting. Better care.</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Swipeable slides ── */}
        <Animated.View style={[styles.sliderSection, { opacity: fadeAnim }]}>
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="start"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveIndex(idx);
            }}
          >
            {/* Slide 0: Hero */}
            <View style={styles.slideContainer}>
              <HeroSlide scrollX={scrollX} />
            </View>

            {/* Slide 1: Doctor */}
            <View style={styles.slideContainer}>
              <CardSlide slide={CARD_SLIDES[0]} index={1} scrollX={scrollX} />
            </View>

            {/* Slide 2: Patient */}
            <View style={styles.slideContainer}>
              <CardSlide slide={CARD_SLIDES[1]} index={2} scrollX={scrollX} />
            </View>
          </Animated.ScrollView>
        </Animated.View>

        {/* ── Bottom: Dots + Button ── */}
        <Animated.View
          style={[
            styles.bottomSection,
            { opacity: fadeAnim, transform: [{ translateY: btnAnim }] },
          ]}
        >
          {/* Page dots */}
          <View style={styles.dotsRow}>
            {Array.from({ length: SLIDE_COUNT }).map((_, index) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [
                  (index - 1) * SCREEN_WIDTH,
                  index * SCREEN_WIDTH,
                  (index + 1) * SCREEN_WIDTH,
                ],
                outputRange: [8, 28, 8],
                extrapolate: 'clamp',
              });
              const dotOpacity = scrollX.interpolate({
                inputRange: [
                  (index - 1) * SCREEN_WIDTH,
                  index * SCREEN_WIDTH,
                  (index + 1) * SCREEN_WIDTH,
                ],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              const dotColor = scrollX.interpolate({
                inputRange: [0, SCREEN_WIDTH, SCREEN_WIDTH * 2],
                outputRange: [SLIDE_ACCENT_COLORS[0], SLIDE_ACCENT_COLORS[1], SLIDE_ACCENT_COLORS[2]],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    { width: dotWidth, opacity: dotOpacity, backgroundColor: dotColor },
                  ]}
                />
              );
            })}
          </View>

          {/* Get Started button */}
          <TouchableOpacity
            style={styles.getStartedBtn}
            activeOpacity={0.85}
            onPress={handleGetStarted}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.getStartedGradient}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Text style={styles.getStartedArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

/* ═══════════════════════════════════════════
   SLIDE 0: Hero — "Skip the Wait"
   ═══════════════════════════════════════════ */
function HeroSlide({ scrollX }: { scrollX: Animated.Value }) {
  const scale = scrollX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [0.88, 1, 0.88],
    extrapolate: 'clamp',
  });
  const opacity = scrollX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [0.4, 1, 0.4],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.heroOuter, { transform: [{ scale }], opacity }]}>
      {/* Main hero title */}
      <Text style={styles.heroTitle}>
        Skip the Wait.{'\n'}
        <Text style={styles.heroTitleAccent}>Not the Doctor.</Text>
      </Text>
      <Text style={styles.heroSubtitle}>
        Join your clinic queue from home, track your turn live, and arrive just in time.
      </Text>

      {/* Feature rows */}
      <View style={styles.heroFeatures}>
        {HERO_FEATURES.map((f, i) => (
          <View key={i} style={styles.heroFeatureRow}>
            <View style={styles.heroFeatureIconWrap}>
              <f.iconComp size={20} color={colors.primary} weight="duotone" />
            </View>
            <View style={styles.heroFeatureText}>
              <Text style={styles.heroFeatureTitle}>{f.title}</Text>
              <Text style={styles.heroFeatureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Swipe hint */}
      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>Swipe to explore</Text>
        <Text style={styles.swipeHintArrow}>→</Text>
      </View>
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════
   SLIDES 1–2: Glass Card (Doctor / Patient)
   ═══════════════════════════════════════════ */
function CardSlide({
  slide,
  index,
  scrollX,
}: {
  slide: CardSlideData;
  index: number;
  scrollX: Animated.Value;
}) {
  const cardScale = scrollX.interpolate({
    inputRange: [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ],
    outputRange: [0.88, 1, 0.88],
    extrapolate: 'clamp',
  });
  const cardOpacity = scrollX.interpolate({
    inputRange: [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ],
    outputRange: [0.4, 1, 0.4],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[styles.cardOuter, { transform: [{ scale: cardScale }], opacity: cardOpacity }]}
    >
      {/* Icon circle */}
      <View style={[styles.emojiCircle, { backgroundColor: slide.accentLight }]}>
        <slide.iconComp size={32} color={slide.accentColor} weight="duotone" />
      </View>

      {/* Title + subtitle */}
      <Text style={[styles.slideTitle, { color: slide.accentColor }]}>
        {slide.title}
      </Text>
      <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>

      {/* Divider */}
      <View style={[styles.cardDivider, { backgroundColor: `${slide.accentColor}20` }]} />

      {/* Features */}
      <View style={styles.featureList}>
        {slide.features.map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={[styles.featureIconWrap, { backgroundColor: slide.accentLight }]}>
              <feature.iconComp size={18} color={slide.accentColor} weight="duotone" />
            </View>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },

  /* ── Orbs ── */
  orb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } : {}),
  },
  orbTopRight: { top: -40, right: -60 },
  orbBottomLeft: { bottom: 60, left: -80 },

  /* ── Header ── */
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crossVertical: {
    position: 'absolute',
    width: 4.5,
    height: 20,
    backgroundColor: colors.surface,
    borderRadius: 2.5,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 20,
    height: 4.5,
    backgroundColor: colors.surface,
    borderRadius: 2.5,
  },
  clockDot: {
    position: 'absolute',
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: colors.surface,
    top: 9,
    right: 9,
  },
  clockHand: {
    position: 'absolute',
    width: 1.5,
    height: 7,
    backgroundColor: colors.surface,
    top: 7,
    right: 10,
    transform: [{ rotate: '45deg' }],
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },

  /* ── Slider ── */
  sliderSection: {
    flex: 1,
    justifyContent: 'center',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  /* ══════════════════════════════
     Hero Slide (Slide 0)
     ══════════════════════════════ */
  heroOuter: {
    width: '100%',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  heroTitleAccent: {
    color: colors.primary,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 23,
    marginBottom: spacing.xl + spacing.sm,
  },
  heroFeatures: {
    gap: 18,
    marginBottom: spacing.xl,
  },
  heroFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroFeatureIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFeatureIcon: {
    fontSize: 20,
  },
  heroFeatureText: {
    flex: 1,
  },
  heroFeatureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  heroFeatureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    opacity: 0.4,
  },
  swipeHintText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  swipeHintArrow: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },

  /* ══════════════════════════════
     Glass Card Slides (1 & 2)
     ══════════════════════════════ */
  cardOuter: {
    width: '100%',
  },
  glassCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.08,
  },
  cardContent: {
    padding: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emojiText: {
    fontSize: 32,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  slideSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 22,
  },
  cardDivider: {
    height: 1,
    marginVertical: spacing.lg,
  },
  featureList: {
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 18,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 20,
  },

  /* ── Bottom Section ── */
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg + 4,
    gap: spacing.md + 4,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  getStartedBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16 }
      : { elevation: 8 }),
  },
  getStartedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  getStartedArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

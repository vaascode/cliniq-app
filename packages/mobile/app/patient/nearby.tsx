import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../lib/context/AppContext';
import { t } from '../../lib/i18n';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { nearbyClinics } from '../../lib/mockData';
import { MapPin, ArrowClockwise, Clock, LightbulbFilament, ArrowLeft } from '../../lib/icons';
import * as Haptics from 'expo-haptics';

export default function NearbyScreen() {
  const router = useRouter();
  const { language } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(20)).current;
  const pillSlide = useRef(new Animated.Value(15)).current;
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const loadingPulse = useRef(new Animated.Value(0.3)).current;
  const cardAnims = useRef(nearbyClinics.map(() => ({
    slide: new Animated.Value(40),
    opacity: new Animated.Value(0),
  }))).current;

  // Back handler
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.back();
        return true;
      });
      return () => sub.remove();
    }, [router])
  );

  // Entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
    ]).start();

    // Loading pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingPulse, { toValue: 0.8, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(loadingPulse, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
      pulse.stop();
      loadingPulse.setValue(1);

      // Info pill
      Animated.parallel([
        Animated.spring(pillSlide, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
        Animated.timing(pillOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      // Stagger cards
      Animated.stagger(
        80,
        cardAnims.map((anim) =>
          Animated.parallel([
            Animated.spring(anim.slide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
            Animated.timing(anim.opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          ])
        )
      ).start();
    }, 1500);
  }, []);

  const handleRefresh = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setIsRefreshing(true);

    // Reset card animations
    cardAnims.forEach((anim) => {
      anim.slide.setValue(20);
      anim.opacity.setValue(0);
    });

    setTimeout(() => {
      setIsRefreshing(false);
      Animated.stagger(
        80,
        cardAnims.map((anim) =>
          Animated.parallel([
            Animated.spring(anim.slide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
            Animated.timing(anim.opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          ])
        )
      ).start();
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={[colors.background, '#E8F5E9', colors.background, colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Ambient orbs */}
      <View style={[styles.orb, styles.orbOrange]} />
      <View style={[styles.orb, styles.orbTeal]} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: headerSlide }] },
          ]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={22} color={colors.primary} weight="bold" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn} activeOpacity={0.7}>
              {isRefreshing
                ? <Clock size={16} color={colors.primary} weight="duotone" />
                : <ArrowClockwise size={16} color={colors.primary} weight="duotone" />
              }
              <Text style={styles.refreshText}>
                {language === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>
            {language === 'hi' ? 'आसपास की क्लिनिक' : 'Clinics Near You'}
          </Text>
          <View style={styles.locationRow}>
            <MapPin size={28} color={colors.primary} weight="duotone" />
            <Text style={styles.locationText}>Indore, MP</Text>
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info pill */}
          <Animated.View
            style={[
              styles.infoPill,
              { opacity: pillOpacity, transform: [{ translateY: pillSlide }] },
            ]}
          >
            <View style={styles.infoPillDot} />
            <Text style={styles.infoPillText}>
              {language === 'hi'
                ? '5 km के अंदर क्लिनिक दिखा रहे हैं'
                : 'Showing clinics within 5 km'}
            </Text>
          </Animated.View>

          {/* Loading skeleton */}
          {isLoading ? (
            <View style={styles.skeletonList}>
              {[0, 1, 2, 3].map((i) => (
                <Animated.View key={i} style={[styles.skeletonCard, { opacity: loadingPulse }]}>
                  <View style={styles.skeletonRow}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.skeletonLines}>
                      <View style={styles.skeletonLine1} />
                      <View style={styles.skeletonLine2} />
                    </View>
                  </View>
                  <View style={styles.skeletonBottom}>
                    <View style={styles.skeletonPill} />
                    <View style={styles.skeletonBtn} />
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            /* Clinic cards */
            <View style={styles.cardsList}>
              {nearbyClinics.map((clinic, idx) => (
                <Animated.View
                  key={clinic.id}
                  style={{
                    opacity: cardAnims[idx]?.opacity ?? 1,
                    transform: [{ translateY: cardAnims[idx]?.slide ?? 0 }],
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push(`/patient/clinic-detail?clinicId=${clinic.id}`)}
                    style={styles.clinicCard}
                  >
                    <LinearGradient
                      colors={[colors.surface, colors.background, colors.background]}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />

                    {/* Top section — avatar + name row + distance */}
                    <View style={styles.cardTop}>
                      {/* Avatar */}
                      <View style={[
                        styles.clinicAvatar,
                        { backgroundColor: getAvatarColor(idx) },
                      ]}>
                        <Text style={styles.clinicAvatarText}>
                          {clinic.clinicName.charAt(0)}
                        </Text>
                      </View>

                      {/* Info block — full width below avatar row */}
                      <View style={styles.clinicInfoBlock}>
                        <View style={styles.nameDistanceRow}>
                          <Text style={styles.clinicName} numberOfLines={2}>
                            {clinic.clinicName}
                          </Text>
                          {/* Distance badge */}
                          <View style={styles.distanceBadge}>
                            <MapPin size={12} color={colors.textSecondary} weight="regular" />
                            <Text style={styles.distanceText}>{clinic.distance}</Text>
                          </View>
                        </View>
                        <Text style={styles.doctorName} numberOfLines={1}>
                          {clinic.doctorName}
                        </Text>
                        <View style={styles.specialtyRow}>
                          <View style={[styles.specialtyDot, { backgroundColor: getAccentColor(idx) }]} />
                          <Text style={[styles.specialtyText, { color: getAccentColor(idx) }]}>
                            {clinic.specialty}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Address */}
                    <Text style={styles.addressText}>{clinic.address}</Text>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Bottom — rating + wait + select */}
                    <View style={styles.cardBottom}>
                      <View style={styles.metaRow}>
                        {/* Rating */}
                        <View style={styles.ratingChip}>
                          <Text style={styles.ratingStar}>★</Text>
                          <Text style={styles.ratingValue}>{clinic.rating}</Text>
                          <Text style={styles.ratingCount}>({clinic.reviews})</Text>
                        </View>

                        {/* Wait time */}
                        <View style={styles.waitChip}>
                          <Clock size={12} color={colors.primary} weight="duotone" />
                          <Text style={styles.waitText}>{clinic.waitTime}</Text>
                        </View>
                      </View>

                      {/* Arrow indicator */}
                      <Text style={styles.cardArrow}>›</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}

              {/* Footer note */}
              <View style={[styles.footerNote, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                <LightbulbFilament size={16} color={colors.primary} weight="duotone" />
                <Text style={styles.footerNoteText}>
                  {language === 'hi'
                    ? 'और क्लिनिक जल्द जोड़ी जाएंगी'
                    : 'More clinics are being added regularly'}
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getAvatarColor(idx: number): string {
  const palette = [
    'rgba(22,101,52,0.12)',
    'rgba(68,138,255,0.15)',
    'rgba(255,152,0,0.15)',
    'rgba(124,107,255,0.15)',
    'rgba(239,83,80,0.15)',
    'rgba(255,193,7,0.15)',
  ];
  return palette[idx % palette.length];
}

function getAccentColor(idx: number): string {
  const palette = [colors.primary, '#448AFF', '#FF9800', colors.primary, '#EF5350', '#FFC107'];
  return palette[idx % palette.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },

  /* Orbs */
  orb: {
    position: 'absolute',
    borderRadius: 200,
    ...(Platform.OS === 'web' ? { filter: 'blur(100px)' } : {}),
  },
  orbOrange: {
    width: 220,
    height: 220,
    backgroundColor: '#FF9800',
    opacity: 0.07,
    top: -40,
    right: -60,
  },
  orbTeal: {
    width: 240,
    height: 240,
    backgroundColor: colors.primary,
    opacity: 0.06,
    bottom: 100,
    left: -80,
  },

  /* Header */
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 26,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: -2,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },

  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  locationPin: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  /* Scroll */
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  /* Info pill */
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22,101,52,0.06)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: spacing.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(22,101,52,0.1)',
  },
  infoPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  infoPillText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },

  /* Skeleton */
  skeletonList: {
    gap: 14,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  skeletonAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
  },
  skeletonLines: {
    flex: 1,
    gap: 8,
  },
  skeletonLine1: {
    height: 14,
    width: '70%',
    borderRadius: 7,
    backgroundColor: colors.surface,
  },
  skeletonLine2: {
    height: 10,
    width: '50%',
    borderRadius: 5,
    backgroundColor: colors.surface,
  },
  skeletonBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonPill: {
    height: 24,
    width: 80,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  skeletonBtn: {
    height: 32,
    width: 100,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },

  /* Clinic cards */
  cardsList: {
    gap: 14,
  },
  clinicCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },

  /* Card top */
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  clinicAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  clinicAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  clinicInfoBlock: {
    flex: 1,
  },
  nameDistanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 2,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  doctorName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  specialtyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Distance */
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,152,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 3,
    flexShrink: 0,
  },
  distanceIcon: {
    fontSize: 11,
  },
  distanceText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '700',
  },

  /* Address */
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 10,
    marginLeft: 60,
  },

  /* Divider */
  cardDivider: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: 14,
  },

  /* Card bottom */
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,193,7,0.08)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ratingStar: {
    fontSize: 12,
    color: '#FFC107',
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFC107',
  },
  ratingCount: {
    fontSize: 10,
    color: 'rgba(255,193,7,0.55)',
    fontWeight: '500',
  },
  waitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(22,101,52,0.06)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  waitText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },

  /* Card arrow */
  cardArrow: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
    marginLeft: 4,
  },

  /* Footer */
  footerNote: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  footerNoteText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

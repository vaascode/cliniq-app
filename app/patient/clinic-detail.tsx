import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../lib/context/AppContext';
import { nearbyClinics, type NearbyClinic } from '../../lib/mockData';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import * as Haptics from 'expo-haptics';
import {
  Hospital,
  Star,
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
} from 'phosphor-react-native';

export default function ClinicDetailScreen() {
  const router = useRouter();
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const { language, setSelectedClinic } = useApp();

  const clinic = nearbyClinics.find((c) => c.id === clinicId);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(20)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.9)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(contentSlide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 150);

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(btnScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }, 350);
  }, []);

  const handleSelectClinic = async () => {
    if (!clinic) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setSelectedClinic({
      clinicName: clinic.clinicName,
      doctorName: clinic.doctorName,
      specialty: clinic.specialty,
      specialtyKey: clinic.specialtyKey,
    });
    router.push('/patient/symptoms');
  };

  const handleCall = () => {
    if (!clinic) return;
    Linking.openURL(`tel:${clinic.phone.replace(/\s/g, '')}`);
  };

  if (!clinic) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, '#E8F5E9', colors.background, colors.background]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <View style={styles.errorIconWrap}>
              <Hospital size={48} color={colors.textSecondary} weight="duotone" />
            </View>
            <Text style={styles.errorText}>
              {language === 'hi' ? 'क्लिनिक नहीं मिली' : 'Clinic not found'}
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
              <ArrowLeft size={16} color={colors.primary} weight="bold" />
              <Text style={styles.errorBtnText}>
                {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const accentColor = getAccentColor(clinic.specialtyKey);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#E8F5E9', colors.background, colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[styles.orb, styles.orbAccent, { backgroundColor: accentColor }]} />
      <View style={[styles.orb, styles.orbTeal]} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: headerSlide }] },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={colors.primary} weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {language === 'hi' ? 'क्लिनिक विवरण' : 'Clinic Details'}
          </Text>
          <TouchableOpacity onPress={handleCall} style={styles.callBtn} activeOpacity={0.7}>
            <Phone size={18} color={colors.primary} weight="duotone" />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: contentOpacity,
              transform: [{ translateY: contentSlide }],
            }}
          >
            {/* Hero Card */}
            <View style={styles.heroCard}>
              <LinearGradient
                colors={[colors.surface, colors.background, colors.background]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              <View style={styles.heroTop}>
                <View style={[styles.heroAvatar, { backgroundColor: `${accentColor}20` }]}>
                  <Text style={[styles.heroAvatarText, { color: accentColor }]}>
                    {clinic.doctorName.split(' ').pop()?.charAt(0) || 'D'}
                  </Text>
                </View>
                <View style={styles.heroInfo}>
                  <Text style={styles.heroDoctorName}>{clinic.doctorName}</Text>
                  <Text style={styles.heroClinicName}>{clinic.clinicName}</Text>
                  <View style={styles.specialtyRow}>
                    <View style={[styles.specialtyDot, { backgroundColor: accentColor }]} />
                    <Text style={[styles.specialtyText, { color: accentColor }]}>
                      {clinic.specialty}
                    </Text>
                    <Text style={styles.experienceText}>• {clinic.experience}</Text>
                  </View>
                </View>
              </View>

              {/* Quick Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statIconWrap}>
                    <Star size={16} color={colors.primary} weight="duotone" />
                  </View>
                  <Text style={styles.statValue}>{clinic.rating}</Text>
                  <Text style={styles.statLabel}>{clinic.reviews} {language === 'hi' ? 'रिव्यू' : 'reviews'}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.statIconWrap}>
                    <Clock size={16} color={colors.primary} weight="duotone" />
                  </View>
                  <Text style={styles.statValue}>{clinic.waitTime}</Text>
                  <Text style={styles.statLabel}>{language === 'hi' ? 'प्रतीक्षा' : 'wait time'}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.statIconWrap}>
                    <MapPin size={16} color={colors.primary} weight="duotone" />
                  </View>
                  <Text style={styles.statValue}>{clinic.distance}</Text>
                  <Text style={styles.statLabel}>{language === 'hi' ? 'दूरी' : 'away'}</Text>
                </View>
              </View>
            </View>

            {/* Consultation Fee */}
            <View style={styles.feeCard}>
              <LinearGradient
                colors={[colors.primaryLight, colors.background]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.feeRow}>
                <View>
                  <Text style={styles.feeLabel}>
                    {language === 'hi' ? 'परामर्श शुल्क' : 'Consultation Fee'}
                  </Text>
                  <Text style={styles.feeSub}>
                    {language === 'hi' ? 'प्रति विज़िट' : 'per visit'}
                  </Text>
                </View>
                <Text style={styles.feeAmount}>₹{clinic.consultFee}</Text>
              </View>
            </View>

            {/* Info Sections */}
            <View style={styles.sectionCard}>
              <LinearGradient
                colors={[colors.surface, colors.background, colors.background]}
                style={StyleSheet.absoluteFillObject}
              />

              <Text style={styles.sectionTitle}>
                {language === 'hi' ? 'डॉक्टर के बारे में' : 'About the Doctor'}
              </Text>
              <Text style={styles.aboutText}>{clinic.about}</Text>

              <View style={styles.sectionDivider} />

              <Text style={styles.sectionTitle}>
                {language === 'hi' ? 'क्लिनिक समय' : 'Clinic Timings'}
              </Text>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Clock size={16} color={colors.primary} weight="duotone" />
                </View>
                <Text style={styles.infoText}>{clinic.timings}</Text>
              </View>

              <View style={styles.sectionDivider} />

              <Text style={styles.sectionTitle}>
                {language === 'hi' ? 'पता' : 'Address'}
              </Text>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <MapPin size={16} color={colors.primary} weight="duotone" />
                </View>
                <Text style={styles.infoText}>{clinic.address}</Text>
              </View>

              <View style={styles.sectionDivider} />

              <Text style={styles.sectionTitle}>
                {language === 'hi' ? 'फ़ोन' : 'Phone'}
              </Text>
              <TouchableOpacity onPress={handleCall} activeOpacity={0.7}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Phone size={16} color={colors.primary} weight="duotone" />
                  </View>
                  <Text style={[styles.infoText, { color: colors.primary }]}>{clinic.phone}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Services */}
            <View style={styles.sectionCard}>
              <LinearGradient
                colors={[colors.surface, colors.background, colors.background]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.sectionTitle}>
                {language === 'hi' ? 'सेवाएं' : 'Services'}
              </Text>
              <View style={styles.servicesGrid}>
                {clinic.services.map((service, i) => (
                  <View key={i} style={[styles.serviceChip, { borderColor: `${accentColor}30` }]}>
                    <Text style={[styles.serviceText, { color: accentColor }]}>{service}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Live Status */}
            <View style={styles.sectionCard}>
              <LinearGradient
                colors={[colors.surface, colors.background, colors.background]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.sectionTitle}>
                {language === 'hi' ? 'आज की स्थिति' : "Today's Status"}
              </Text>
              <View style={styles.statusRow}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusNumber}>{clinic.patientsToday}</Text>
                  <Text style={styles.statusLabel}>
                    {language === 'hi' ? 'मरीज़ आज' : 'Patients today'}
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <View style={styles.openBadge}>
                    <View style={styles.openDot} />
                    <Text style={styles.openText}>
                      {language === 'hi' ? 'खुला है' : 'Open Now'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Sticky Bottom Button */}
      <Animated.View
        style={[
          styles.bottomBar,
          { opacity: btnOpacity, transform: [{ scale: btnScale }] },
        ]}
      >
        <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
          <TouchableOpacity onPress={handleSelectClinic} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.selectButton}
            >
              <Text style={styles.selectButtonText}>
                {language === 'hi' ? 'अपॉइंटमेंट बुक करें' : 'Book Appointment'}
              </Text>
              <Text style={styles.selectButtonArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

function getAccentColor(specialtyKey: string): string {
  const map: Record<string, string> = {
    cardiologist: '#EF5350',
    generalPhysician: '#448AFF',
    dentist: colors.primary,
    orthopedic: '#FF9800',
    ophthalmologist: colors.primary,
    dermatologist: '#EC407A',
  };
  return map[specialtyKey] || colors.primary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },

  orb: {
    position: 'absolute',
    borderRadius: 200,
    ...(Platform.OS === 'web' ? { filter: 'blur(100px)' } : {}),
  },
  orbAccent: {
    width: 250,
    height: 250,
    opacity: 0.06,
    top: -60,
    right: -80,
  },
  orbTeal: {
    width: 200,
    height: 200,
    backgroundColor: colors.primary,
    opacity: 0.05,
    bottom: 150,
    left: -60,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(22,101,52,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(22,101,52,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    fontSize: 28,
    fontWeight: '800',
  },
  heroInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  heroDoctorName: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  heroClinicName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  specialtyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  experienceText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statIconWrap: {
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },

  feeCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(22,101,52,0.1)',
    padding: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  feeSub: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  feeAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },

  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  aboutText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '400',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoIconWrap: {
    marginTop: 1,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.background,
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '600',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusItem: {},
  statusNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(22,101,52,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(22,101,52,0.12)',
  },
  openDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  openText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(240,253,244,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } : {}),
  },
  bottomSafe: {
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'web' ? 14 : 4,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  selectButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  selectButtonArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorIconWrap: {
    marginBottom: 4,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  errorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  errorBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});

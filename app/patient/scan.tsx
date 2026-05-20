import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  BackHandler,
  Alert,
  Platform,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../lib/context/AppContext';
import { getDefaultAvatar } from '../../lib/avatars';
import { t, type TranslationKey } from '../../lib/i18n';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { recentClinics, nearbyClinics } from '../../lib/mockData';
import * as Haptics from 'expo-haptics';
import { NeedHelpFAB } from '../../components/NeedHelpFAB';
import { MagnifyingGlass, MapPin, Gear, User, LightbulbFilament, Ticket } from '../../lib/icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ScanScreen() {
  const router = useRouter();
  const { language, setSelectedClinic, patientProfile } = useApp();

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning' as TranslationKey, language);
    if (hour < 17) return t('goodAfternoon' as TranslationKey, language);
    return t('goodEvening' as TranslationKey, language);
  }, [language]);

  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanFound, setScanFound] = useState(false);

  // Scanner animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scannerFade = useRef(new Animated.Value(0)).current;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const scanBtnScale = useRef(new Animated.Value(0.8)).current;
  const scanBtnOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const glowScale = useRef(new Animated.Value(0.9)).current;
  const card1Slide = useRef(new Animated.Value(30)).current;
  const card2Slide = useRef(new Animated.Value(30)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const recentSlide = useRef(new Animated.Value(20)).current;
  const recentOpacity = useRef(new Animated.Value(0)).current;

  // Back handler — exit app
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert(
          language === 'hi' ? 'बाहर निकलें' : 'Exit App',
          language === 'hi' ? 'क्या आप ऐप से बाहर निकलना चाहते हैं?' : 'Do you want to exit the app?',
          [
            { text: language === 'hi' ? 'नहीं' : 'No', style: 'cancel' },
            { text: language === 'hi' ? 'हाँ' : 'Yes', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true;
      });
      return () => sub.remove();
    }, [language])
  );

  // Entrance animations
  useEffect(() => {
    // Title + fade
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(titleSlide, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
    ]).start();

    // Central scan button
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(scanBtnScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(scanBtnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // Side cards
    Animated.sequence([
      Animated.delay(300),
      Animated.stagger(120, [
        Animated.parallel([
          Animated.spring(card1Slide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
          Animated.timing(card1Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(card2Slide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
          Animated.timing(card2Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    // Recent section
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.spring(recentSlide, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
        Animated.timing(recentOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowPulse, { toValue: 0.7, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 1.08, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowPulse, { toValue: 0.35, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 0.92, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const handleSelectClinic = (clinic: { clinicName: string; doctorName: string; specialty: string; specialtyKey?: string }) => {
    setSelectedClinic({
      clinicName: clinic.clinicName,
      doctorName: clinic.doctorName,
      specialty: clinic.specialty,
      specialtyKey: clinic.specialtyKey,
    });
    router.push('/patient/symptoms');
  };

  const handleScanPress = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setShowScanner(true);
    setScanFound(false);
    setScanProgress(0);

    // Fade in scanner
    Animated.timing(scannerFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Animate scan line
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    scanLoop.start();

    // Simulate scanning progress: detect QR after ~2.5s
    const progressTimer = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(progressTimer);
      setScanProgress(100);
      setScanFound(true);
      scanLoop.stop();
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}

      // After found animation, navigate
      setTimeout(() => {
        setShowScanner(false);
        scannerFade.setValue(0);
        scanLineAnim.setValue(0);
        handleSelectClinic(recentClinics[0]);
      }, 1200);
    }, 2500);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
    setScanFound(false);
    setScanProgress(0);
    scannerFade.setValue(0);
    scanLineAnim.setValue(0);
  };

  const handleSearchPress = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setShowSearch(true);
  };

  const handleNearbyPress = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setShowLocationPopup(true);
  };

  const handleAllowLocation = () => {
    setShowLocationPopup(false);
    router.push('/patient/nearby');
  };

  // Filter clinics for search
  const filteredClinics = searchText.trim()
    ? [...recentClinics, ...nearbyClinics].filter(
        (c) =>
          c.clinicName.toLowerCase().includes(searchText.toLowerCase()) ||
          c.doctorName.toLowerCase().includes(searchText.toLowerCase())
      )
    : recentClinics;

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
      <View style={[styles.orb, styles.orbTeal]} />
      <View style={[styles.orb, styles.orbPurple]} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top bar — pill chip + token + settings */}
          <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
            {/* Profile pill chip */}
            <TouchableOpacity
              onPress={() => router.push('/patient/profile')}
              activeOpacity={0.8}
              style={styles.profilePill}
            >
              <Image
                source={patientProfile?.profileImage ? { uri: patientProfile.profileImage } : getDefaultAvatar('patient', patientProfile?.gender || 'male')}
                style={styles.pillAvatar}
              />
              <View style={styles.pillTextWrap}>
                <Text style={styles.pillName} numberOfLines={1}>
                  {patientProfile?.name?.split(' ')[0] || 'Patient'}
                </Text>
                <Text style={styles.pillGreeting} numberOfLines={1}>{greeting}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.topActions}>
              <TouchableOpacity
                onPress={() => router.push('/patient/my-tokens')}
                style={styles.iconBtn}
                activeOpacity={0.7}
              >
                <Ticket size={22} color={colors.textPrimary} weight="duotone" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/patient/settings')} style={styles.iconBtn}>
                <Gear size={22} color={colors.textPrimary} weight="duotone" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View
            style={[
              styles.headerSection,
              { opacity: fadeAnim, transform: [{ translateY: titleSlide }] },
            ]}
          >
            <Text style={styles.title}>{t('findClinic', language)}</Text>
            <Text style={styles.subtitle}>
              {language === 'hi'
                ? 'QR स्कैन करें, खोजें या पास की क्लिनिक देखें'
                : 'Scan QR, search by name, or discover nearby'}
            </Text>
          </Animated.View>

          {/* ─── Central Scan Button (CRED style) ─── */}
          <Animated.View
            style={[
              styles.scanSection,
              {
                opacity: scanBtnOpacity,
                transform: [{ scale: scanBtnScale }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleScanPress}
              activeOpacity={0.85}
              style={styles.scanBtnOuter}
            >
              {/* Outer glow ring */}
              <Animated.View
                style={[
                  styles.glowRing3,
                  { opacity: glowPulse, transform: [{ scale: glowScale }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.glowRing2,
                  {
                    opacity: Animated.multiply(glowPulse, 1.3),
                    transform: [{ scale: Animated.multiply(glowScale, 0.92) }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.glowRing1,
                  {
                    opacity: Animated.multiply(glowPulse, 1.6),
                    transform: [{ scale: Animated.multiply(glowScale, 0.84) }],
                  },
                ]}
              />

              {/* Main button */}
              <View style={styles.scanBtnInner}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark, colors.primaryDark]}
                  style={styles.scanBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* QR icon made with views */}
                  <View style={styles.qrIcon}>
                    <View style={styles.qrRow}>
                      <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                      <View style={styles.qrBlock} />
                      <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                    </View>
                    <View style={styles.qrRow}>
                      <View style={styles.qrBlock} />
                      <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                      <View style={styles.qrBlock} />
                    </View>
                    <View style={styles.qrRow}>
                      <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                      <View style={styles.qrBlock} />
                      <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </TouchableOpacity>

            <Text style={styles.scanLabel}>{t('scanQRAtClinic', language)}</Text>
            <Text style={styles.scanHint}>
              {language === 'hi' ? 'क्लिनिक के QR कोड पर कैमरा पॉइंट करें' : 'Point camera at the clinic\'s QR code'}
            </Text>
          </Animated.View>

          {/* ─── Two Action Cards ─── */}
          <View style={styles.cardsRow}>
            {/* Search by Name */}
            <Animated.View
              style={[
                styles.cardWrap,
                { opacity: card1Opacity, transform: [{ translateY: card1Slide }] },
              ]}
            >
              <TouchableOpacity onPress={handleSearchPress} activeOpacity={0.85} style={{ flex: 1 }}>
                <View style={styles.actionCard}>
                  <LinearGradient
                    colors={['rgba(68, 138, 255, 0.12)', 'rgba(68, 138, 255, 0.02)', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={styles.actionCardGlow} />

                  <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(68,138,255,0.15)' }]}>
                    <MagnifyingGlass size={20} color={colors.primary} weight="duotone" />
                  </View>
                  <Text style={[styles.actionCardTitle, { color: colors.primary }]}>
                    {t('searchClinics', language)}
                  </Text>
                  <Text style={styles.actionCardSubtitle}>
                    {t('knowClinicName', language)}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Discover Nearby */}
            <Animated.View
              style={[
                styles.cardWrap,
                { opacity: card2Opacity, transform: [{ translateY: card2Slide }] },
              ]}
            >
              <TouchableOpacity onPress={handleNearbyPress} activeOpacity={0.85} style={{ flex: 1 }}>
                <View style={styles.actionCard}>
                  <LinearGradient
                    colors={['rgba(255, 152, 0, 0.12)', 'rgba(255, 152, 0, 0.02)', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={[styles.actionCardGlow, { backgroundColor: '#FF9800' }]} />

                  <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255,152,0,0.15)' }]}>
                    <MapPin size={20} color={colors.primary} weight="duotone" />
                  </View>
                  <Text style={[styles.actionCardTitle, { color: '#FF9800' }]}>
                    {t('nearbyClinics', language)}
                  </Text>
                  <Text style={styles.actionCardSubtitle}>
                    {t('findClinicsNearYou', language)}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ─── Recently Visited ─── */}
          <Animated.View
            style={[
              styles.recentSection,
              { opacity: recentOpacity, transform: [{ translateY: recentSlide }] },
            ]}
          >
            <Text style={styles.sectionTitle}>{t('recentlyVisited', language)}</Text>
            {recentClinics.map((clinic) => (
              <TouchableOpacity
                key={clinic.id}
                onPress={() => router.push(`/patient/clinic-detail?clinicId=${clinic.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.recentCard}>
                  <View style={styles.recentLeft}>
                    <Image
                      source={getDefaultAvatar('doctor', 'male')}
                      style={styles.recentAvatarImage}
                    />
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentClinicName}>{clinic.clinicName}</Text>
                      <Text style={styles.recentDoctorName}>{clinic.doctorName}</Text>
                    </View>
                  </View>
                  <View style={styles.recentBadge}>
                    <Text style={styles.recentBadgeText}>
                      {language === 'hi'
                        ? (clinic.specialtyKey === 'cardiologist' ? 'हृदय' : clinic.specialtyKey === 'dentist' ? 'दंत' : 'नेत्र')
                        : clinic.specialty}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ─── Search Modal ─── */}
      <Modal visible={showSearch} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[colors.surface, colors.background, colors.background]}
              style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('searchClinics', language)}</Text>
                <TouchableOpacity onPress={() => { setShowSearch(false); setSearchText(''); }} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Search input */}
              <View style={styles.searchBar}>
                <MagnifyingGlass size={18} color={colors.textSecondary} weight="regular" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('searchPlaceholder', language)}
                  placeholderTextColor={colors.textSecondary}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoFocus
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <Text style={styles.searchClear}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Results */}
              <ScrollView contentContainerStyle={styles.modalResults} showsVerticalScrollIndicator={false}>
                {filteredClinics.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MagnifyingGlass size={36} color={colors.textSecondary} weight="regular" />
                    <Text style={styles.emptyText}>
                      {language === 'hi' ? 'कोई क्लिनिक नहीं मिली' : 'No clinics found'}
                    </Text>
                  </View>
                ) : (
                  filteredClinics.map((clinic, idx) => (
                    <TouchableOpacity
                      key={clinic.id + idx}
                      onPress={() => {
                        setShowSearch(false);
                        setSearchText('');
                        router.push(`/patient/clinic-detail?clinicId=${clinic.id}`);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.searchResultCard}>
                        <View style={styles.searchResultLeft}>
                          <Image
                            source={getDefaultAvatar('doctor', 'male')}
                            style={styles.recentAvatarImage}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.recentClinicName}>{clinic.clinicName}</Text>
                            <Text style={styles.recentDoctorName}>{clinic.doctorName}</Text>
                          </View>
                        </View>
                        <Text style={styles.searchResultArrow}>›</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* ─── Location Permission Popup ─── */}
      <Modal visible={showLocationPopup} animationType="fade" transparent>
        <View style={styles.locationPopupOverlay}>
          <View style={styles.locationPopupCard}>
            <LinearGradient
              colors={[colors.surface, colors.surface, colors.background]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {/* Glow accent */}
            <View style={styles.locationPopupGlow} />

            {/* Icon */}
            <View style={styles.locationPopupIconWrap}>
              <LinearGradient
                colors={['rgba(255,152,0,0.2)', 'rgba(255,152,0,0.05)']}
                style={styles.locationPopupIconBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <MapPin size={28} color={colors.primary} weight="duotone" />
            </View>

            {/* Title */}
            <Text style={styles.locationPopupTitle}>
              {language === 'hi' ? 'पास की क्लिनिक खोजें' : 'Find Clinics Near You'}
            </Text>

            {/* Message */}
            <Text style={styles.locationPopupMsg}>
              {language === 'hi'
                ? 'CliniQ को आपके पास की क्लिनिक दिखाने के लिए आपकी लोकेशन चाहिए'
                : 'CliniQ needs your location to show nearby clinics and estimated distances'}
            </Text>

            {/* Buttons */}
            <TouchableOpacity onPress={handleAllowLocation} activeOpacity={0.85} style={styles.locationAllowBtnWrap}>
              <LinearGradient
                colors={['#FF9800', '#F57C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.locationAllowBtn}
              >
                <Text style={styles.locationAllowBtnText}>
                  {language === 'hi' ? 'लोकेशन अनुमति दें' : 'Allow Location'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowLocationPopup(false)}
              activeOpacity={0.7}
              style={styles.locationDenyBtn}
            >
              <Text style={styles.locationDenyBtnText}>
                {language === 'hi' ? 'अभी नहीं' : 'Not Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Need Help FAB (only on this screen) ─── */}
      <NeedHelpFAB />

      {/* ─── QR Scanner Modal ─── */}
      <Modal visible={showScanner} animationType="fade" transparent>
        <Animated.View style={[styles.scannerOverlay, { opacity: scannerFade }]}>
          <SafeAreaView style={styles.scannerSafeArea} edges={['top', 'bottom']}>
            {/* Close button */}
            <View style={styles.scannerTopBar}>
              <TouchableOpacity onPress={handleCloseScanner} style={styles.scannerCloseBtn}>
                <Text style={styles.scannerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Scanner title */}
            <View style={styles.scannerTitleWrap}>
              <Text style={styles.scannerTitle}>
                {scanFound
                  ? (language === 'hi' ? 'QR कोड मिला!' : 'QR Code Found!')
                  : (language === 'hi' ? 'QR कोड स्कैन करें' : 'Scan QR Code')}
              </Text>
              <Text style={styles.scannerHint}>
                {scanFound
                  ? (language === 'hi' ? 'क्लिनिक से कनेक्ट हो रहे हैं...' : 'Connecting to clinic...')
                  : (language === 'hi' ? 'QR कोड को फ्रेम में रखें' : 'Place the QR code inside the frame')}
              </Text>
            </View>

            {/* Viewfinder */}
            <View style={styles.viewfinderWrap}>
              <View style={[
                styles.viewfinder,
                scanFound && { borderColor: `${colors.primary}66` },
              ]}>
                {/* Scanner background (simulated camera) */}
                <LinearGradient
                  colors={['rgba(20,20,40,0.9)', 'rgba(10,15,30,0.95)', 'rgba(20,20,40,0.9)']}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Scan line */}
                {!scanFound && (
                  <Animated.View
                    style={[
                      styles.scannerLine,
                      {
                        transform: [{
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 220],
                          }),
                        }],
                      },
                    ]}
                  />
                )}

                {/* Corner markers */}
                <View style={[styles.vfCorner, styles.vfCornerTL, scanFound && styles.vfCornerFound]} />
                <View style={[styles.vfCorner, styles.vfCornerTR, scanFound && styles.vfCornerFound]} />
                <View style={[styles.vfCorner, styles.vfCornerBL, scanFound && styles.vfCornerFound]} />
                <View style={[styles.vfCorner, styles.vfCornerBR, scanFound && styles.vfCornerFound]} />

                {/* Found checkmark */}
                {scanFound && (
                  <View style={styles.scanFoundBadge}>
                    <Text style={styles.scanFoundIcon}>✓</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.scanProgressWrap}>
              <View style={styles.scanProgressBg}>
                <View style={[
                  styles.scanProgressFill,
                  { width: `${Math.min(scanProgress, 100)}%` },
                  scanFound && { backgroundColor: colors.primary },
                ]} />
              </View>
              <Text style={styles.scanProgressText}>
                {scanFound
                  ? (language === 'hi' ? 'Sharma Heart Clinic' : 'Sharma Heart Clinic')
                  : (language === 'hi' ? 'स्कैन कर रहे हैं...' : 'Scanning...')}
              </Text>
            </View>

            {/* Tip */}
            {!scanFound && (
              <View style={[styles.scanTipWrap, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                <LightbulbFilament size={16} color={colors.primary} weight="duotone" />
                <Text style={[styles.scanTipText, { flex: 1 }]}>
                  {language === 'hi'
                    ? 'क्लिनिक के रिसेप्शन पर QR कोड होता है'
                    : "QR code is usually at the clinic's reception desk"}
                </Text>
              </View>
            )}
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </View>
  );
}

const CARD_GAP = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  /* Orbs */
  orb: {
    position: 'absolute',
    borderRadius: 200,
    ...(Platform.OS === 'web' ? { filter: 'blur(100px)' } : {}),
  },
  orbTeal: {
    width: 260,
    height: 260,
    backgroundColor: colors.primary,
    opacity: 0.08,
    top: '20%',
    left: -80,
  },
  orbPurple: {
    width: 200,
    height: 200,
    backgroundColor: colors.primary,
    opacity: 0.06,
    top: -40,
    right: -60,
  },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingRight: 16,
    paddingLeft: 4,
    paddingVertical: 4,
    flex: 1,
    marginRight: spacing.sm,
    maxWidth: 200,
  },
  pillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover' as any,
    overflow: 'hidden',
    backgroundColor: '#F0F9FF',
  },
  pillTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  pillName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  pillGreeting: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnEmoji: {
    fontSize: 18,
  },

  /* Header */
  headerSection: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 20,
  },

  /* ─── Central Scan Button ─── */
  scanSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  scanBtnOuter: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing3: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(22,101,52,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(22,101,52,0.08)',
  },
  glowRing2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(22,101,52,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(22,101,52,0.12)',
  },
  glowRing1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
  },
  scanBtnInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 20 }
      : { elevation: 12 }),
  },
  scanBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* QR icon built with views */
  qrIcon: {
    width: 32,
    height: 32,
    gap: 3,
  },
  qrRow: {
    flexDirection: 'row',
    gap: 3,
    flex: 1,
  },
  qrBlock: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: colors.primaryLight,
  },
  qrBlockFilled: {
    backgroundColor: '#FFFFFF',
  },

  scanLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md + 4,
    letterSpacing: 0.2,
  },
  scanHint: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },

  /* ─── Two Action Cards ─── */
  cardsRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginTop: spacing.md,
  },
  cardWrap: {
    flex: 1,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#448AFF',
    opacity: 0.06,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionIconEmoji: {
    fontSize: 22,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },

  /* ─── Recently Visited ─── */
  recentSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  recentCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  recentAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(22,101,52,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentAvatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    resizeMode: 'cover',
    overflow: 'hidden',
  } as any,
  recentAvatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  recentInfo: {
    flex: 1,
  },
  recentClinicName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  recentDoctorName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  recentBadge: {
    backgroundColor: 'rgba(22,101,52,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentBadgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },

  /* ─── Modals ─── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    flex: 1,
    marginTop: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalResults: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  /* Search bar */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBarIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  searchClear: {
    fontSize: 14,
    color: colors.textSecondary,
    padding: 4,
  },

  /* Search result card */
  searchResultCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  searchResultArrow: {
    fontSize: 22,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: 8,
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  /* ─── Location Permission Popup ─── */
  locationPopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  locationPopupCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  locationPopupGlow: {
    position: 'absolute',
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FF9800',
    opacity: 0.06,
  },
  locationPopupIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  locationPopupIconBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
  },
  locationPopupIcon: {
    fontSize: 32,
  },
  locationPopupTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  locationPopupMsg: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  locationAllowBtnWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  locationAllowBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  locationAllowBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  locationDenyBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  locationDenyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  /* ─── QR Scanner Modal ─── */
  scannerOverlay: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scannerSafeArea: {
    flex: 1,
    alignItems: 'center',
  },
  scannerTopBar: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    alignItems: 'flex-end',
  },
  scannerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerCloseText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  scannerTitleWrap: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  scannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  scannerHint: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  /* Viewfinder */
  viewfinderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 260,
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  scannerLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    ...(Platform.OS === 'ios'
      ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 }
      : { elevation: 4 }),
  },

  /* Corner markers */
  vfCorner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: '#FFFFFF',
  },
  vfCornerTL: {
    top: 0, left: 0,
    borderTopWidth: 3, borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  vfCornerTR: {
    top: 0, right: 0,
    borderTopWidth: 3, borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  vfCornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: 3, borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  vfCornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: 3, borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  vfCornerFound: {
    borderColor: colors.primary,
  },

  /* Found state */
  scanFoundBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios'
      ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 16 }
      : { elevation: 10 }),
  },
  scanFoundIcon: {
    fontSize: 28,
    color: colors.textPrimary,
    fontWeight: '800',
  },

  /* Progress */
  scanProgressWrap: {
    width: 260,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  scanProgressBg: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  scanProgressFill: {
    height: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: 2,
  },
  scanProgressText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  /* Tip */
  scanTipWrap: {
    position: 'absolute',
    bottom: 60,
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
  },
  scanTipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  BackHandler,
  Image,
  Alert,
  ActionSheetIOS,
  Modal,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { getDefaultAvatar } from '../../lib/avatars';
import { t, type TranslationKey } from '../../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { User, Camera, MapPin, ArrowLeft } from '../../lib/icons';
import { Button } from '../../components/Button';
import { PlatformCard } from '../../components/PlatformCard';
import PhoneInput from '../../components/PhoneInput';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { api } from '../../lib/api';

const SPECIALTIES = [
  'generalPhysician',
  'cardiologist',
  'dermatologist',
  'orthopedic',
  'entSpecialist',
  'gynecologist',
  'pediatrician',
  'neurologist',
  'ophthalmologist',
  'dentist',
  'other',
] as const;

const DURATIONS = [5, 10, 15, 20, 30];
const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const ITEM_H = 48;
const VISIBLE = 5;
const HOURS_DATA = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES_DATA = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const REPEATS = 3; // triple the data for infinite illusion

// ─── Infinite Drum Column ────────────────────────────────────
function DrumColumn({
  data,
  selectedIndex,
  onSelect,
}: {
  data: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const len = data.length;
  // We render data 3x: [copy0][copy1][copy2]. Start in copy1.
  const midStart = len + selectedIndex; // index into tripled array
  const lastReal = useRef(selectedIndex); // real index 0..len-1
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrolling = useRef(false);

  // Build tripled array once
  const tripled = useRef([...data, ...data, ...data]).current;

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: midStart * ITEM_H, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, []);

  // Recenter silently to middle copy
  const recenter = (realIdx: number) => {
    const midY = (len + realIdx) * ITEM_H;
    scrollRef.current?.scrollTo({ y: midY, animated: false });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const tripledIdx = Math.round(y / ITEM_H);
    const realIdx = ((tripledIdx % len) + len) % len;

    if (realIdx !== lastReal.current) {
      lastReal.current = realIdx;
      onSelect(realIdx);
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync().catch(() => {});
      }
    }

    // Debounced snap + recenter
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      // Snap to exact position in middle copy
      const targetY = (len + realIdx) * ITEM_H;
      scrollRef.current?.scrollTo({ y: targetY, animated: false });
      isScrolling.current = false;
    }, 150);
  };

  const handleBeginDrag = () => {
    isScrolling.current = true;
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const tripledIdx = Math.round(y / ITEM_H);
    const realIdx = ((tripledIdx % len) + len) % len;
    lastReal.current = realIdx;
    onSelect(realIdx);
    // Snap + recenter to middle copy
    setTimeout(() => recenter(realIdx), 50);
    isScrolling.current = false;
  };

  const handleTap = (tripledIdx: number) => {
    const realIdx = ((tripledIdx % len) + len) % len;
    lastReal.current = realIdx;
    onSelect(realIdx);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    // Scroll to that position in middle copy
    const targetY = (len + realIdx) * ITEM_H;
    scrollRef.current?.scrollTo({ y: targetY, animated: true });
  };

  return (
    <View style={tpStyles.columnWrap}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={handleBeginDrag}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        nestedScrollEnabled
        style={tpStyles.drumScroll}
      >
        {tripled.map((item, i) => {
          const realI = ((i % len) + len) % len;
          const isSel = realI === lastReal.current;
          const isNear =
            (realI === (lastReal.current + 1) % len) ||
            (realI === (lastReal.current - 1 + len) % len);
          return (
            <TouchableOpacity
              key={`${i}`}
              activeOpacity={0.7}
              onPress={() => handleTap(i)}
              style={tpStyles.drumItem}
            >
              <Text
                style={[
                  tpStyles.drumText,
                  isNear && tpStyles.drumTextNear,
                  isSel && tpStyles.drumTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Time Picker Wheel (infinite scrollable drum) ────────────
function TimePickerWheel({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [h, m] = value.split(':');
  const hourIdx = HOURS_DATA.indexOf(h) >= 0 ? HOURS_DATA.indexOf(h) : 0;
  const minIdx = MINUTES_DATA.indexOf(m) >= 0 ? MINUTES_DATA.indexOf(m) : 0;

  return (
    <View style={tpStyles.container}>
      <View style={tpStyles.selectionBand} />
      <DrumColumn
        data={HOURS_DATA}
        selectedIndex={hourIdx}
        onSelect={(idx) => onChange(`${HOURS_DATA[idx]}:${m}`)}
      />
      <Text style={tpStyles.colon}>:</Text>
      <DrumColumn
        data={MINUTES_DATA}
        selectedIndex={minIdx}
        onSelect={(idx) => onChange(`${h}:${MINUTES_DATA[idx]}`)}
      />
    </View>
  );
}

const tpStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ITEM_H * VISIBLE,
    position: 'relative',
  },
  selectionBand: {
    position: 'absolute',
    top: ITEM_H * 2,
    height: ITEM_H,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,150,136,0.1)',
    borderRadius: borderRadius.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,150,136,0.2)',
  },
  columnWrap: {
    height: ITEM_H * VISIBLE,
    width: 80,
    overflow: 'hidden',
  },
  drumScroll: {
    height: ITEM_H * VISIBLE,
  },
  drumItem: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drumText: {
    fontSize: 18,
    color: 'rgba(150,150,150,0.4)',
    fontVariant: ['tabular-nums'],
    fontWeight: '400',
  },
  drumTextNear: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  drumTextSelected: {
    fontSize: 26,
    color: colors.primary,
    fontWeight: '700',
  },
  colon: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginHorizontal: 4,
  },
});

// ─── Main Component ──────────────────────────────────────────
export default function DoctorRegistration() {
  const router = useRouter();
  const navigation = useNavigation();
  const { language, setDoctorProfile, setRole } = useApp();

  const goBack = useCallback(() => {
    setRole(null);
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/role');
    }
  }, [navigation, router, setRole]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => backHandler.remove();
  }, [goBack]);

  const mainScrollRef = useRef<ScrollView>(null);
  const specialtyFieldY = useRef(0);

  const params = useLocalSearchParams<{ authName?: string; authEmail?: string; authPhoto?: string; authPhone?: string }>();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [name, setName] = useState(params.authName || '');
  const [clinicName, setClinicName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const [duration, setDuration] = useState(10);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>(params.authPhoto || undefined);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const [phone, setPhone] = useState(params.authPhone || '');

  // Optional fields
  const [workingDays, setWorkingDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
  const [maxPatients, setMaxPatients] = useState('');
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');

  // New fields
  const [locality, setLocality] = useState('');
  const [consultFee, setConsultFee] = useState('');


  // Time picker state
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | 'breakStart' | 'breakEnd'>('start');
  const [tempTime, setTempTime] = useState('09:00');

  const openTimePicker = (target: typeof timePickerTarget) => {
    const currentVal =
      target === 'start' ? startTime :
      target === 'end' ? endTime :
      target === 'breakStart' ? (breakStart || '13:00') :
      (breakEnd || '14:00');
    setTempTime(currentVal);
    setTimePickerTarget(target);
    setTimePickerVisible(true);
  };

  const confirmTimePicker = () => {
    if (timePickerTarget === 'start') setStartTime(tempTime);
    else if (timePickerTarget === 'end') setEndTime(tempTime);
    else if (timePickerTarget === 'breakStart') setBreakStart(tempTime);
    else setBreakEnd(tempTime);
    setTimePickerVisible(false);
  };

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
      }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === 'ios') {
      const options = [
        t('takePhoto' as TranslationKey, language),
        t('chooseFromGallery' as TranslationKey, language),
        ...(profileImage ? [t('removePhoto' as TranslationKey, language)] : []),
        t('cancel' as TranslationKey, language),
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: profileImage ? options.length - 2 : undefined },
        (idx) => {
          if (idx === 0) pickImage(true);
          else if (idx === 1) pickImage(false);
          else if (idx === 2 && profileImage) setProfileImage(undefined);
        }
      );
    } else {
      setShowImageSheet(true);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const isValid = name.trim() && clinicName.trim() && specialty && address.trim() && phone.trim().length >= 10;

  // Validation hint
  const getMissingHint = () => {
    const missing: string[] = [];
    if (!name.trim()) missing.push(language === 'hi' ? 'नाम' : 'Name');
    if (!clinicName.trim()) missing.push(language === 'hi' ? 'क्लिनिक का नाम' : 'Clinic Name');
    if (!specialty) missing.push(language === 'hi' ? 'विशेषज्ञता' : 'Specialty');
    if (phone.trim().length < 10) missing.push(language === 'hi' ? 'फ़ोन (10 अंक)' : 'Phone (10 digits)');
    if (!address.trim()) missing.push(language === 'hi' ? 'पता' : 'Address');
    return missing.length ? `${language === 'hi' ? 'भरें' : 'Fill'}: ${missing.join(', ')}` : '';
  };

  const handleCreate = async () => {
    if (!isValid) return;
    await setDoctorProfile({
      name: name.trim(),
      clinicName: clinicName.trim(),
      specialty: t(specialty as any, 'en'),
      specialtyKey: specialty,
      consultDuration: duration,
      workingHoursStart: startTime,
      workingHoursEnd: endTime,
      address: address.trim(),
      clinicId: `clinic-${Date.now()}`,
      profileImage,
      phone: phone.trim(),
      workingDays,
      ...(maxPatients ? { maxPatientsPerDay: parseInt(maxPatients) } : {}),
      ...(breakStart ? { breakTimeStart: breakStart } : {}),
      ...(breakEnd ? { breakTimeEnd: breakEnd } : {}),
      ...(locality ? { locality: locality.trim() } : {}),
      ...(consultFee ? { consultFee: parseInt(consultFee) } : {}),
    });
    router.replace('/doctor/dashboard');
  };

  const optTag = ` (${t('optionalLabel' as TranslationKey, language)})`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={mainScrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <ArrowLeft size={22} color={colors.primary} weight="bold" />
            </TouchableOpacity>

            <Text style={styles.header}>{t('setupClinic', language)}</Text>
            <Text style={styles.subheader}>{t('takesTwoMin', language)}</Text>

            {/* Profile Photo */}
            <View style={styles.photoSection}>
              <TouchableOpacity onPress={showImageOptions} activeOpacity={0.8}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={profileImage ? { uri: profileImage } : getDefaultAvatar('doctor', 'male')}
                    style={styles.avatarImage}
                  />
                  <View style={styles.cameraBadge}>
                    <Camera size={12} color="#FFFFFF" weight="fill" />
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={styles.photoHint}>
                {profileImage
                  ? t('changePhoto' as TranslationKey, language)
                  : t('addPhoto' as TranslationKey, language)}
              </Text>
            </View>

            {/* Full Name */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('fullName', language)}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('fullNamePlaceholder', language)}
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Clinic Name */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('clinicName', language)}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('clinicNamePlaceholder', language)}
                placeholderTextColor={colors.textSecondary}
                value={clinicName}
                onChangeText={setClinicName}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('doctorPhone' as TranslationKey, language)}</Text>
              <PhoneInput
                value={phone}
                onChangeText={setPhone}
                placeholder="98765 43210"
                hasError={phone.length > 0 && phone.length < 10}
              />
              {phone.length > 0 && phone.length < 10 && (
                <Text style={styles.errorHint}>
                  {language === 'hi' ? 'कम से कम 10 अंक डालें' : 'Enter at least 10 digits'}
                </Text>
              )}
            </View>

            {/* Specialty */}
            <View
              style={styles.field}
              onLayout={(e) => { specialtyFieldY.current = e.nativeEvent.layout.y; }}
            >
              <Text style={styles.label}>{t('specialty', language)}</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => {
                  const opening = !showSpecialtyPicker;
                  setShowSpecialtyPicker(opening);
                  if (opening) {
                    setTimeout(() => {
                      mainScrollRef.current?.scrollTo({ y: specialtyFieldY.current - 20, animated: true });
                    }, 100);
                  }
                }}
              >
                <Text style={specialty ? styles.inputText : styles.placeholderText}>
                  {specialty ? t(specialty as any, language) : (language === 'hi' ? 'विशेषज्ञता चुनें' : 'Select specialty')}
                </Text>
                <Text style={styles.chevron}>{showSpecialtyPicker ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showSpecialtyPicker && (
                <PlatformCard style={styles.pickerCard}>
                  <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled showsVerticalScrollIndicator>
                    {SPECIALTIES.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.pickerItem, specialty === s && styles.pickerItemSelected]}
                        onPress={() => {
                          setSpecialty(s);
                          setShowSpecialtyPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerText,
                            specialty === s && styles.pickerTextSelected,
                          ]}
                        >
                          {t(s as any, language)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </PlatformCard>
              )}
            </View>

            {/* Consultation Duration */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('consultDuration', language)}</Text>
              <View style={styles.segmentRow}>
                {DURATIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.segment, duration === d && styles.segmentActive]}
                    onPress={() => setDuration(d)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        duration === d && styles.segmentTextActive,
                      ]}
                    >
                      {d} {t('min', language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Working Hours — tap to open time picker */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('workingHours', language)}</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={styles.timeLabel}>{t('startTime', language)}</Text>
                  <TouchableOpacity style={[styles.input, styles.timeInput]} onPress={() => openTimePicker('start')}>
                    <Text style={styles.timeDisplayText}>{startTime}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.timeSeparator}>—</Text>
                <View style={styles.timeField}>
                  <Text style={styles.timeLabel}>{t('endTime', language)}</Text>
                  <TouchableOpacity style={[styles.input, styles.timeInput]} onPress={() => openTimePicker('end')}>
                    <Text style={styles.timeDisplayText}>{endTime}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ── Address Section ── */}
            <PlatformCard style={regStyles.sectionCard}>
              <View style={regStyles.sectionHeader}>
                <MapPin size={20} color={colors.primary} weight="duotone" />
                <Text style={regStyles.sectionTitle}>{language === 'hi' ? 'क्लिनिक का पता' : 'Clinic Address'}</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder={t('clinicAddressPlaceholder', language)}
                placeholderTextColor={colors.textSecondary}
                value={address}
                onChangeText={setAddress}
              />

              <Text style={[styles.label, { marginTop: spacing.md }]}>
                {language === 'hi' ? 'इलाका / लोकैलिटी' : 'Area / Locality'}
                <Text style={styles.optionalTag}>{optTag}</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder={language === 'hi' ? 'जैसे: कोरमंगला, आनंद विहार' : 'e.g. Koramangala, Anand Vihar'}
                placeholderTextColor={colors.textSecondary}
                value={locality}
                onChangeText={setLocality}
              />
            </PlatformCard>

            {/* ── Optional Fields ── */}

            {/* Working Days */}
            <View style={styles.field}>
              <Text style={styles.label}>
                {t('workingDays' as TranslationKey, language)}
                <Text style={styles.optionalTag}>{optTag}</Text>
              </Text>
              <View style={styles.daysRow}>
                {ALL_DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayChip, workingDays.includes(day) && styles.dayChipActive]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text style={[styles.dayChipText, workingDays.includes(day) && styles.dayChipTextActive]}>
                      {t(day as TranslationKey, language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Max Patients Per Day */}
            <View style={styles.field}>
              <Text style={styles.label}>
                {t('maxPatientsPerDay' as TranslationKey, language)}
                <Text style={styles.optionalTag}>{optTag}</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t('maxPatientsPlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
                value={maxPatients}
                onChangeText={setMaxPatients}
                keyboardType="numeric"
              />
            </View>

            {/* Break Time — tap to open time picker */}
            <View style={styles.field}>
              <Text style={styles.label}>
                {t('breakTime' as TranslationKey, language)}
                <Text style={styles.optionalTag}>{optTag}</Text>
              </Text>
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={styles.timeLabel}>{t('breakTimeStart' as TranslationKey, language)}</Text>
                  <TouchableOpacity style={[styles.input, styles.timeInput]} onPress={() => openTimePicker('breakStart')}>
                    <Text style={breakStart ? styles.timeDisplayText : styles.timePlaceholder}>
                      {breakStart || '13:00'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.timeSeparator}>—</Text>
                <View style={styles.timeField}>
                  <Text style={styles.timeLabel}>{t('breakTimeEnd' as TranslationKey, language)}</Text>
                  <TouchableOpacity style={[styles.input, styles.timeInput]} onPress={() => openTimePicker('breakEnd')}>
                    <Text style={breakEnd ? styles.timeDisplayText : styles.timePlaceholder}>
                      {breakEnd || '14:00'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Consultation Fee */}
            <View style={styles.field}>
              <Text style={styles.label}>
                {language === 'hi' ? 'परामर्श शुल्क (₹)' : 'Consultation Fee (₹)'}
                <Text style={styles.optionalTag}>{optTag}</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder={language === 'hi' ? 'जैसे: 500' : 'e.g. 500'}
                placeholderTextColor={colors.textSecondary}
                value={consultFee}
                onChangeText={setConsultFee}
                keyboardType="numeric"
              />
            </View>



            <View style={{ height: 20 }} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky bottom button */}
      <View style={styles.stickyBottom}>
        {!isValid && (
          <Text style={styles.validationHint}>{getMissingHint()}</Text>
        )}
        <Button
          title={t('createClinic', language)}
          onPress={handleCreate}
          size="lg"
          disabled={!isValid}
        />
      </View>

      {/* Time Picker Modal */}
      <Modal visible={timePickerVisible} transparent animationType="slide" onRequestClose={() => setTimePickerVisible(false)}>
        <Pressable style={sheetStyles.overlay} onPress={() => setTimePickerVisible(false)}>
          <Pressable style={sheetStyles.timeSheet} onPress={(e) => e.stopPropagation()}>
            <View style={sheetStyles.handle} />
            <Text style={sheetStyles.timeTitle}>
              {timePickerTarget === 'start' ? t('startTime', language) :
               timePickerTarget === 'end' ? t('endTime', language) :
               timePickerTarget === 'breakStart' ? t('breakTimeStart' as TranslationKey, language) :
               t('breakTimeEnd' as TranslationKey, language)}
            </Text>
            <View style={sheetStyles.pickerWrap}>
              <TimePickerWheel value={tempTime} onChange={setTempTime} />
            </View>
            <TouchableOpacity style={sheetStyles.doneBtn} onPress={confirmTimePicker}>
              <Text style={sheetStyles.doneBtnText}>{language === 'hi' ? 'ठीक है' : 'Done'}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Image picker bottom sheet */}
      <Modal visible={showImageSheet} transparent animationType="slide" onRequestClose={() => setShowImageSheet(false)}>
        <Pressable style={sheetStyles.overlay} onPress={() => setShowImageSheet(false)}>
          <Pressable style={sheetStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={sheetStyles.handle} />
            <TouchableOpacity style={sheetStyles.option} onPress={() => { setShowImageSheet(false); pickImage(true); }}>
              <Camera size={24} color={colors.primary} weight="duotone" />
              <Text style={sheetStyles.optionText}>{t('takePhoto' as TranslationKey, language)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sheetStyles.option} onPress={() => { setShowImageSheet(false); pickImage(false); }}>
              <Text style={sheetStyles.optionIcon}>🖼️</Text>
              <Text style={sheetStyles.optionText}>{t('chooseFromGallery' as TranslationKey, language)}</Text>
            </TouchableOpacity>
            {profileImage && (
              <TouchableOpacity style={sheetStyles.option} onPress={() => { setShowImageSheet(false); setProfileImage(undefined); }}>
                <Text style={sheetStyles.optionIcon}>🗑️</Text>
                <Text style={[sheetStyles.optionText, { color: colors.error }]}>{t('removePhoto' as TranslationKey, language)}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[sheetStyles.option, sheetStyles.cancelOption]} onPress={() => setShowImageSheet(false)}>
              <Text style={[sheetStyles.optionText, { textAlign: 'center', color: colors.textSecondary }]}>{t('cancel' as TranslationKey, language)}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingTop: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 },
  optionIcon: { fontSize: 20, marginRight: 16 },
  optionText: { fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  cancelOption: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4, justifyContent: 'center' },
  // Time picker sheet
  timeSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingTop: 8, alignItems: 'center' },
  timeTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, marginTop: 4 },
  pickerWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },

  doneBtn: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 48, borderRadius: borderRadius.md, marginTop: 12 },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
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
    marginBottom: spacing.xs,
  },
  subheader: {
    ...typography.bodySecondary,
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.sm,
    fontWeight: '600',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionalTag: {
    color: colors.textSecondary,
    fontWeight: '400',
    textTransform: 'none',
    fontSize: 11,
    letterSpacing: 0,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorHint: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  inputText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  pickerCard: {
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  pickerItemSelected: {
    backgroundColor: colors.cardHighlight,
  },
  pickerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  pickerTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  segment: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentActive: {
    backgroundColor: colors.cardHighlight,
    borderColor: colors.primary,
  },
  segmentText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    ...typography.small,
    marginBottom: spacing.xs,
  },
  timeInput: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplayText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  timePlaceholder: {
    color: colors.textSecondary,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
  timeSeparator: {
    color: colors.textSecondary,
    fontSize: 20,
    marginTop: 18,
  },
  stickyBottom: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  validationHint: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#F0F9FF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  } as any,
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  cameraBadgeText: {
    fontSize: 15,
  },
  photoHint: {
    ...typography.caption,
    marginTop: spacing.sm,
    color: colors.primary,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 44,
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: colors.cardHighlight,
    borderColor: colors.primary,
  },
  dayChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dayChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});

const regStyles = StyleSheet.create({
  sectionCard: {
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mapsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  autoFillBtn: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoFillBtnText: {
    fontSize: 20,
  },
  extractingRow: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
  },
  extractingText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  photoUpload: {
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    height: 100,
    marginTop: spacing.xs,
  },
  clinicPhotoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  photoPlaceholderIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoPlaceholderText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  verifyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: 'rgba(76,175,80,0.08)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.15)',
  },
  verifyNoteIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
    marginTop: 1,
  },
  verifyNoteText: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActionSheetIOS,
  Platform,
  Modal,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { getDefaultAvatar } from '../../lib/avatars';

import { t, type TranslationKey } from '../../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Camera, MapPin, Shield, Info, Hospital, Clock, CheckCircle, Warning, Star, Gear, Phone, Timer, ChartBar, Users, LightbulbFilament, ArrowRight, ArrowLeft } from '../../lib/icons';
import { Coffee, CurrencyInr, PencilSimpleLine } from 'phosphor-react-native';
import { PlatformCard } from '../../components/PlatformCard';
import { FadeInView } from '../../components/FadeInView';
import { Button } from '../../components/Button';
import PhoneInput from '../../components/PhoneInput';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { api } from '../../lib/api';

const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const ITEM_H = 48;
const VISIBLE = 5;
const HOURS_DATA = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES_DATA = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const REPEATS = 3;

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
  const midStart = len + selectedIndex;
  const lastReal = useRef(selectedIndex);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrolling = useRef(false);

  const tripled = useRef([...data, ...data, ...data]).current;

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: midStart * ITEM_H, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, []);

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

    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
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
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.primary,
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
    color: colors.border,
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

export default function DoctorProfile() {
  const router = useRouter();
  const { language, doctorProfile, setDoctorProfile, queue } = useApp();

  const profileScrollRef = useRef<ScrollView>(null);
  const editCardYPositions = useRef<Record<string, number>>({});
  const [pendingNudge, setPendingNudge] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const [name, setName] = useState(doctorProfile?.name || '');
  const [clinicName, setClinicName] = useState(doctorProfile?.clinicName || '');
  const [address, setAddress] = useState(doctorProfile?.address || '');
  const [consultDuration, setConsultDuration] = useState(
    String(doctorProfile?.consultDuration || 10)
  );
  const [localImage, setLocalImage] = useState<string | undefined>(doctorProfile?.profileImage);
  const [phone, setPhone] = useState(doctorProfile?.phone || '');
  const [maxPatients, setMaxPatients] = useState(
    doctorProfile?.maxPatientsPerDay ? String(doctorProfile.maxPatientsPerDay) : ''
  );
  const [breakStart, setBreakStart] = useState(doctorProfile?.breakTimeStart || '');
  const [breakEnd, setBreakEnd] = useState(doctorProfile?.breakTimeEnd || '');
  const [workingDays, setWorkingDays] = useState<string[]>(
    doctorProfile?.workingDays || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  );
  const [workStart, setWorkStart] = useState(doctorProfile?.workingHoursStart || '09:00');
  const [workEnd, setWorkEnd] = useState(doctorProfile?.workingHoursEnd || '17:00');

  // New fields
  const [mapsLink, setMapsLink] = useState(doctorProfile?.mapsLink || '');
  const [locality, setLocality] = useState(doctorProfile?.locality || '');
  const [consultFee, setConsultFee] = useState(doctorProfile?.consultFee ? String(doctorProfile.consultFee) : '');
  const [medicalRegNumber, setMedicalRegNumber] = useState(doctorProfile?.medicalRegNumber || '');
  const [clinicPhoto1, setClinicPhoto1] = useState<string | undefined>(doctorProfile?.clinicPhoto1);
  const [clinicPhoto2, setClinicPhoto2] = useState<string | undefined>(doctorProfile?.clinicPhoto2);
  const [extractingAddress, setExtractingAddress] = useState(false);

  const extractAddressFromMaps = async () => {
    if (!mapsLink.trim()) {
      if (Platform.OS === 'web') window.alert('Please paste a Google Maps link first');
      else Alert.alert('Missing Link', 'Please paste a Google Maps link first');
      return;
    }
    setExtractingAddress(true);
    try {
      const res = await api['extract-address'].$post({
        json: { mapsLink: mapsLink.trim() },
      });
      const data = await res.json() as any;
      if (data.error) {
        if (Platform.OS === 'web') window.alert(data.error);
        else Alert.alert('Error', data.error);
      } else {
        if (data.address) setAddress(data.address);
        if (data.clinicName && !clinicName.trim()) setClinicName(data.clinicName);
        if (data.locality) setLocality(data.locality);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') window.alert('Failed to extract. Please fill manually.');
      else Alert.alert('Error', 'Failed to extract. Please fill manually.');
    } finally {
      setExtractingAddress(false);
    }
  };

  const pickClinicPhoto = async (slot: 1 | 2, useCamera: boolean) => {
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
      }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7 });
      if (!result.canceled && result.assets[0]) {
        if (slot === 1) setClinicPhoto1(result.assets[0].uri);
        else setClinicPhoto2(result.assets[0].uri);
      }
    } catch (e) { console.error(e); }
  };

  // Time picker state
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | 'breakStart' | 'breakEnd'>('start');
  const [tempTime, setTempTime] = useState('09:00');

  const openTimePicker = (target: typeof timePickerTarget) => {
    const currentVal =
      target === 'start' ? workStart :
      target === 'end' ? workEnd :
      target === 'breakStart' ? (breakStart || '13:00') :
      (breakEnd || '14:00');
    setTempTime(currentVal);
    setTimePickerTarget(target);
    setTimePickerVisible(true);
  };

  const confirmTimePicker = () => {
    if (timePickerTarget === 'start') setWorkStart(tempTime);
    else if (timePickerTarget === 'end') setWorkEnd(tempTime);
    else if (timePickerTarget === 'breakStart') setBreakStart(tempTime);
    else setBreakEnd(tempTime);
    setTimePickerVisible(false);
  };

  // Scroll to field when nudge is tapped
  useEffect(() => {
    if (isEditing && pendingNudge) {
      const optionalNudges = ['addWorkingDays', 'addMaxPatients', 'addBreakTime'];
      const targetCard = optionalNudges.includes(pendingNudge) ? 'optional' : 'required';
      setTimeout(() => {
        const y = editCardYPositions.current[targetCard];
        if (y && profileScrollRef.current) {
          profileScrollRef.current.scrollTo({ y: y - 10, animated: true });
        }
        setPendingNudge(null);
      }, 200);
    }
  }, [isEditing, pendingNudge]);

  const waitingPatients = useMemo(() => queue.filter((p) => p.status === 'waiting'), [queue]);
  const seeingPatient = useMemo(() => queue.find((p) => p.status === 'seeing'), [queue]);
  const seenPatients = useMemo(() => queue.filter((p) => p.status === 'done'), [queue]);
  const allPatients = queue;
  const remaining = waitingPatients.length + (seeingPatient ? 1 : 0);

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Profile completion
  const completion = useMemo(() => {
    if (!doctorProfile) return { percent: 0, nudges: [] as string[] };
    const items: { filled: boolean; nudge: string }[] = [
      { filled: !!doctorProfile.name, nudge: 'fullName' },
      { filled: !!doctorProfile.clinicName, nudge: 'clinicName' },
      { filled: !!doctorProfile.address, nudge: 'clinicAddress' },
      { filled: !!doctorProfile.phone, nudge: 'addDoctorPhone' },
      { filled: !!doctorProfile.profileImage, nudge: 'addProfilePhoto' },
      { filled: !!doctorProfile.workingDays && doctorProfile.workingDays.length > 0, nudge: 'addWorkingDays' },
      { filled: !!doctorProfile.maxPatientsPerDay, nudge: 'addMaxPatients' },
      { filled: !!doctorProfile.breakTimeStart && !!doctorProfile.breakTimeEnd, nudge: 'addBreakTime' },
    ];
    const filled = items.filter((i) => i.filled).length;
    const percent = Math.round((filled / items.length) * 100);
    const nudges = items.filter((i) => !i.filled).map((i) => i.nudge);
    return { percent, nudges };
  }, [doctorProfile]);

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
        setLocalImage(result.assets[0].uri);
        if (doctorProfile) {
          setDoctorProfile({ ...doctorProfile, profileImage: result.assets[0].uri });
        }
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
        ...(localImage ? [t('removePhoto' as TranslationKey, language)] : []),
        t('cancel' as TranslationKey, language),
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: localImage ? options.length - 2 : undefined },
        (idx) => {
          if (idx === 0) pickImage(true);
          else if (idx === 1) pickImage(false);
          else if (idx === 2 && localImage) {
            setLocalImage(undefined);
            if (doctorProfile) setDoctorProfile({ ...doctorProfile, profileImage: undefined });
          }
        }
      );
    } else {
      setShowImageSheet(true);
    }
  };



  const handleSave = () => {
    if (!doctorProfile) return;
    setDoctorProfile({
      ...doctorProfile,
      name: name.trim() || doctorProfile.name,
      clinicName: clinicName.trim() || doctorProfile.clinicName,
      address: address.trim() || doctorProfile.address,
      consultDuration: parseInt(consultDuration) || doctorProfile.consultDuration,
      profileImage: localImage,
      phone: phone.trim() || doctorProfile.phone,
      workingHoursStart: workStart || doctorProfile.workingHoursStart,
      workingHoursEnd: workEnd || doctorProfile.workingHoursEnd,
      workingDays,
      ...(maxPatients ? { maxPatientsPerDay: parseInt(maxPatients) } : { maxPatientsPerDay: undefined }),
      ...(breakStart ? { breakTimeStart: breakStart } : { breakTimeStart: undefined }),
      ...(breakEnd ? { breakTimeEnd: breakEnd } : { breakTimeEnd: undefined }),
      ...(mapsLink ? { mapsLink: mapsLink.trim() } : { mapsLink: undefined }),
      ...(locality ? { locality: locality.trim() } : { locality: undefined }),
      ...(consultFee ? { consultFee: parseInt(consultFee) } : { consultFee: undefined }),
      ...(medicalRegNumber ? { medicalRegNumber: medicalRegNumber.trim() } : { medicalRegNumber: undefined }),
      clinicPhoto1,
      clinicPhoto2,
      verificationStatus: doctorProfile.verificationStatus || 'ready',
    });
    setIsEditing(false);
    if (Platform.OS === 'web') {
      window.alert(t('profileUpdated' as TranslationKey, language));
    } else {
      Alert.alert(t('profileUpdated' as TranslationKey, language));
    }
  };

  if (!doctorProfile) return null;

  const completionColor = colors.primary;

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView ref={profileScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.primary} weight="bold" />
          </TouchableOpacity>
          <View />
        </View>

        <Text style={styles.header}>{t('myProfile' as TranslationKey, language)}</Text>



        {/* Avatar & Name */}
        <PlatformCard style={styles.avatarCard} accentColor={colors.primary} accentSide="top">
          {/* Edit / Cancel pencil button in card corner */}
          <TouchableOpacity
            style={styles.cardEditBtn}
            onPress={() => {
              if (isEditing) {
                setName(doctorProfile.name);
                setClinicName(doctorProfile.clinicName);
                setAddress(doctorProfile.address);
                setConsultDuration(String(doctorProfile.consultDuration));
                setPhone(doctorProfile.phone);
                setLocalImage(doctorProfile.profileImage);
                setMaxPatients(doctorProfile.maxPatientsPerDay ? String(doctorProfile.maxPatientsPerDay) : '');
                setBreakStart(doctorProfile.breakTimeStart || '');
                setBreakEnd(doctorProfile.breakTimeEnd || '');
                setWorkingDays(doctorProfile.workingDays || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
                setWorkStart(doctorProfile.workingHoursStart);
                setWorkEnd(doctorProfile.workingHoursEnd);
                setMapsLink(doctorProfile.mapsLink || '');
                setLocality(doctorProfile.locality || '');
                setConsultFee(doctorProfile.consultFee ? String(doctorProfile.consultFee) : '');
                setMedicalRegNumber(doctorProfile.medicalRegNumber || '');
                setClinicPhoto1(doctorProfile.clinicPhoto1);
                setClinicPhoto2(doctorProfile.clinicPhoto2);
              }
              setIsEditing(!isEditing);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isEditing
              ? <Text style={styles.cardCancelText}>{language === 'hi' ? 'रद्द' : 'Cancel'}</Text>
              : <PencilSimpleLine size={20} color={colors.primary} weight="duotone" />
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={isEditing ? showImageOptions : undefined} activeOpacity={isEditing ? 0.8 : 1}>
            <View style={styles.avatarWrapper}>
              <Image
                source={localImage ? { uri: localImage } : getDefaultAvatar('doctor', 'male')}
                style={styles.avatarImage}
              />
              {isEditing && (
                <View style={styles.cameraBadge}>
                  <Camera size={12} color="#FFFFFF" weight="fill" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.doctorNameText}>{doctorProfile.name}</Text>
          <View style={styles.specialtyPill}>
            <Text style={styles.specialtyPillText}>
              {t(doctorProfile.specialtyKey as TranslationKey, language)}
            </Text>
          </View>
          <Text style={styles.clinicSubtitle}>{doctorProfile.clinicName}</Text>
        </PlatformCard>

        {/* Profile Completion Bar */}
        {completion.percent < 100 && (
          <PlatformCard style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionText}>
                {t('doctorProfileCompletion' as TranslationKey, language, { percent: completion.percent })}
              </Text>
              <Text style={[styles.completionPercent, { color: colors.primary }]}>{completion.percent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion.percent}%` as any, backgroundColor: colors.primary }]} />
            </View>
            {completion.nudges.length > 0 && (
              <View style={styles.nudgeList}>
                {completion.nudges.slice(0, 2).map((nudge, i) => (
                  <TouchableOpacity key={i} style={styles.nudgeItem} activeOpacity={0.6} onPress={() => {
                    setIsEditing(true);
                    setPendingNudge(nudge);
                  }}>
                    <LightbulbFilament size={16} color={colors.primary} weight="duotone" style={{ marginRight: spacing.sm }} />
                    <Text style={styles.nudgeText}>{t(nudge as TranslationKey, language)}</Text>
                    <ArrowRight size={14} color={colors.primary} weight="bold" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </PlatformCard>
        )}

        {completion.percent === 100 && (
          <View style={styles.completeBar}>
            <CheckCircle size={16} color={colors.success} weight="fill" /><Text style={styles.completeBarText}>{t('greatProfile' as TranslationKey, language)}</Text>
          </View>
        )}

        {/* Patients Remaining */}
        <PlatformCard style={styles.remainingCard}>
          <Text style={styles.sectionLabel}>{t('patientsRemaining' as TranslationKey, language)}</Text>
          <View style={styles.remainingRow}>
            <View style={styles.remainingStat}>
              <Text style={styles.remainingBig}>{remaining}</Text>
              <Text style={styles.remainingLabel}>{t('remainingCount' as TranslationKey, language)}</Text>
            </View>
            <View style={styles.remainingDivider} />
            <View style={styles.remainingStat}>
              <Text style={[styles.remainingBig, { color: colors.success }]}>{seenPatients.length}</Text>
              <Text style={styles.remainingLabel}>{t('seenCount' as TranslationKey, language)}</Text>
            </View>
            <View style={styles.remainingDivider} />
            <View style={styles.remainingStat}>
              <Text style={[styles.remainingBig, { color: colors.secondary }]}>{allPatients.length}</Text>
              <Text style={styles.remainingLabel}>{t('totalToday' as TranslationKey, language)}</Text>
            </View>
          </View>
        </PlatformCard>

        {/* Editable or Detail View */}
        {isEditing ? (
          <>
            {/* Required Card */}
            <View onLayout={(e) => { editCardYPositions.current.required = e.nativeEvent.layout.y; }}>
            <PlatformCard style={styles.editCard}>
              <View style={styles.editCardHeader}>
                <Text style={styles.sectionLabel}>{t('requiredFields' as TranslationKey, language)}</Text>
                <View style={styles.requiredBadge}><Star size={12} color="#F59E0B" weight="fill" /></View>
              </View>

              <Text style={styles.fieldLabel}>{t('fullName' as TranslationKey, language)}</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textSecondary} />

              <Text style={styles.fieldLabel}>{t('doctorPhone' as TranslationKey, language)}</Text>
              <PhoneInput
                value={phone}
                onChangeText={setPhone}
                placeholder="98765 43210"
                hasError={phone.length > 0 && phone.length < 10}
              />
              {phone.length > 0 && phone.length < 10 && (
                <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                  {language === 'hi' ? 'कम से कम 10 अंक डालें' : 'Enter at least 10 digits'}
                </Text>
              )}

              <Text style={styles.fieldLabel}>{t('clinicName' as TranslationKey, language)}</Text>
              <TextInput style={styles.input} value={clinicName} onChangeText={setClinicName} placeholderTextColor={colors.textSecondary} />

              <Text style={styles.fieldLabel}>{t('clinicAddress' as TranslationKey, language)}</Text>
              <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholderTextColor={colors.textSecondary} />

              <Text style={styles.fieldLabel}>{t('consultDuration' as TranslationKey, language)} ({t('min' as TranslationKey, language)})</Text>
              <TextInput style={styles.input} value={consultDuration} onChangeText={setConsultDuration} keyboardType="numeric" placeholderTextColor={colors.textSecondary} />

              <Text style={styles.fieldLabel}>{t('workingHours' as TranslationKey, language)}</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={styles.timeSubLabel}>{t('startTime' as TranslationKey, language)}</Text>
                  <TouchableOpacity style={[styles.input, styles.timeInput]} onPress={() => openTimePicker('start')}>
                    <Text style={styles.timeDisplayText}>{workStart}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.timeSep}>—</Text>
                <View style={styles.timeField}>
                  <Text style={styles.timeSubLabel}>{t('endTime' as TranslationKey, language)}</Text>
                  <TouchableOpacity style={[styles.input, styles.timeInput]} onPress={() => openTimePicker('end')}>
                    <Text style={styles.timeDisplayText}>{workEnd}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </PlatformCard>
            </View>

            {/* Optional Card */}
            <View onLayout={(e) => { editCardYPositions.current.optional = e.nativeEvent.layout.y; }}>
            <PlatformCard style={styles.editCard}>
              <View style={styles.editCardHeader}>
                <Text style={styles.sectionLabel}>{t('optionalFields' as TranslationKey, language)}</Text>
                <Text style={styles.optionalHint}>{t('completeLater' as TranslationKey, language)}</Text>
              </View>

              <Text style={styles.fieldLabel}>{t('workingDays' as TranslationKey, language)}</Text>
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

              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>{t('maxPatientsPerDay' as TranslationKey, language)}</Text>
              <TextInput style={styles.input} value={maxPatients} onChangeText={setMaxPatients} keyboardType="numeric" placeholder={t('maxPatientsPlaceholder' as TranslationKey, language)} placeholderTextColor={colors.textSecondary} />

              <Text style={styles.fieldLabel}>{t('breakTime' as TranslationKey, language)}</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={styles.timeSubLabel}>{t('breakTimeStart' as TranslationKey, language)}</Text>
                  <TouchableOpacity style={[styles.input, styles.timeInput]} onPress={() => openTimePicker('breakStart')}>
                    <Text style={breakStart ? styles.timeDisplayText : styles.timePlaceholder}>
                      {breakStart || '13:00'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.timeSep}>—</Text>
                <View style={styles.timeField}>
                  <Text style={styles.timeSubLabel}>{t('breakTimeEnd' as TranslationKey, language)}</Text>
                  <TouchableOpacity style={[styles.input, styles.timeInput]} onPress={() => openTimePicker('breakEnd')}>
                    <Text style={breakEnd ? styles.timeDisplayText : styles.timePlaceholder}>
                      {breakEnd || '14:00'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </PlatformCard>
            </View>

            {/* Google Maps Auto-Fill Card */}
            <PlatformCard style={{ ...styles.editCard, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <MapPin size={20} color={colors.primary} weight="duotone" style={{ marginRight: spacing.sm }} />
                <Text style={{ ...typography.h3, fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                  {language === 'hi' ? 'Google Maps से पता' : 'Address from Google Maps'}
                </Text>
              </View>

              <Text style={styles.fieldLabel}>{language === 'hi' ? 'Google Maps लिंक पेस्ट करें' : 'Paste Google Maps Link'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="https://maps.google.com/..."
                  placeholderTextColor={colors.textSecondary}
                  value={mapsLink}
                  onChangeText={setMapsLink}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={{ backgroundColor: colors.primary, width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', opacity: extractingAddress ? 0.6 : 1 }}
                  onPress={extractAddressFromMaps}
                  disabled={extractingAddress}
                >
                  <Text style={{ fontSize: 20 }}>{extractingAddress ? '...' : '🪄'}</Text>
                </TouchableOpacity>
              </View>
              {extractingAddress && (
                <View style={{ marginTop: spacing.sm, padding: spacing.xs, backgroundColor: colors.primaryLight, borderRadius: borderRadius.sm }}>
                  <Text style={{ ...typography.small, color: colors.primary, fontWeight: '500', textAlign: 'center' }}>
                    {language === 'hi' ? '📡 Google Maps से पता निकाल रहे हैं...' : '📡 Extracting address from Google Maps...'}
                  </Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>
                {language === 'hi' ? 'इलाका / लोकैलिटी' : 'Area / Locality'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={language === 'hi' ? 'जैसे: कोरमंगला' : 'e.g. Koramangala'}
                placeholderTextColor={colors.textSecondary}
                value={locality}
                onChangeText={setLocality}
              />

              <Text style={styles.fieldLabel}>{language === 'hi' ? 'परामर्श शुल्क (₹)' : 'Consultation Fee (₹)'}</Text>
              <TextInput
                style={styles.input}
                placeholder={language === 'hi' ? 'जैसे: 500' : 'e.g. 500'}
                placeholderTextColor={colors.textSecondary}
                value={consultFee}
                onChangeText={setConsultFee}
                keyboardType="numeric"
              />
            </PlatformCard>

            {/* Verification Card */}
            <PlatformCard style={{ ...styles.editCard, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Shield size={20} color={colors.primary} weight="duotone" style={{ marginRight: spacing.sm }} />
                <Text style={{ ...typography.h3, fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                  {language === 'hi' ? 'क्लिनिक सत्यापन' : 'Clinic Verification'}
                </Text>
              </View>

              <Text style={styles.fieldLabel}>
                {language === 'hi' ? 'मेडिकल पंजीकरण संख्या' : 'Medical Registration Number'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={language === 'hi' ? 'MCI-12345' : 'e.g. MCI-12345'}
                placeholderTextColor={colors.textSecondary}
                value={medicalRegNumber}
                onChangeText={setMedicalRegNumber}
                autoCapitalize="characters"
              />

              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
                {language === 'hi' ? 'क्लिनिक फोटो 1 (रिसेप्शन)' : 'Clinic Photo 1 (Reception)'}
              </Text>
              <TouchableOpacity
                style={{ borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', overflow: 'hidden', height: 100, marginTop: spacing.xs }}
                onPress={() => pickClinicPhoto(1, false)}
              >
                {clinicPhoto1 ? (
                  <Image source={{ uri: clinicPhoto1 }} style={{ width: '100%', height: '100%', borderRadius: borderRadius.md }} />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={24} color={colors.textSecondary} weight="regular" />
                    <Text style={{ ...typography.small, color: colors.textSecondary }}>{language === 'hi' ? 'फोटो जोड़ें' : 'Add Photo'}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
                {language === 'hi' ? 'क्लिनिक फोटो 2 (नाम बोर्ड)' : 'Clinic Photo 2 (Name Board)'}
              </Text>
              <TouchableOpacity
                style={{ borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', overflow: 'hidden', height: 100, marginTop: spacing.xs }}
                onPress={() => pickClinicPhoto(2, false)}
              >
                {clinicPhoto2 ? (
                  <Image source={{ uri: clinicPhoto2 }} style={{ width: '100%', height: '100%', borderRadius: borderRadius.md }} />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={24} color={colors.textSecondary} weight="regular" />
                    <Text style={{ ...typography.small, color: colors.textSecondary }}>{language === 'hi' ? 'फोटो जोड़ें' : 'Add Photo'}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', marginTop: spacing.lg, padding: spacing.md, backgroundColor: 'rgba(76,175,80,0.08)', borderRadius: borderRadius.sm }}>
                <Info size={14} color={colors.textSecondary} weight="regular" style={{ marginRight: spacing.sm }} />
                <Text style={{ ...typography.small, color: colors.textSecondary, flex: 1, lineHeight: 18 }}>
                  {language === 'hi'
                    ? 'सत्यापन अभी वैकल्पिक है। आपकी प्रोफ़ाइल तुरंत उपयोग की जा सकती है।'
                    : 'Verification is optional right now. Your profile can be used immediately. Full verification coming soon.'}
                </Text>
              </View>
            </PlatformCard>

            <View style={{ marginBottom: spacing.md }}>
              <Button title={t('saveChanges' as TranslationKey, language)} onPress={handleSave} size="lg" />
            </View>
          </>
        ) : (
          <PlatformCard style={styles.detailCard}>
            <Text style={styles.sectionLabel}>{t('clinicDetails' as TranslationKey, language)}</Text>
            {[
              { iconComp: Phone, label: t('doctorPhone' as TranslationKey, language), value: doctorProfile.phone || '—' },
              { iconComp: Hospital, label: t('clinicName' as TranslationKey, language), value: doctorProfile.clinicName },
              { iconComp: MapPin, label: t('addressLabel' as TranslationKey, language), value: doctorProfile.address },
              { iconComp: Clock, label: t('timingsLabel' as TranslationKey, language), value: `${doctorProfile.workingHoursStart} - ${doctorProfile.workingHoursEnd}` },
              { iconComp: Timer, label: t('avgConsultTime' as TranslationKey, language), value: `${doctorProfile.consultDuration} ${t('min' as TranslationKey, language)} ${t('perPatient' as TranslationKey, language)}` },
              ...(doctorProfile.workingDays && doctorProfile.workingDays.length > 0
                ? [{
                    iconComp: ChartBar,
                    label: t('workingDays' as TranslationKey, language),
                    value: doctorProfile.workingDays.map((d) => t(d as TranslationKey, language)).join(', '),
                  }]
                : []),
              ...(doctorProfile.maxPatientsPerDay
                ? [{
                    iconComp: Users,
                    label: t('maxPatientsPerDay' as TranslationKey, language),
                    value: String(doctorProfile.maxPatientsPerDay),
                  }]
                : []),
              ...(doctorProfile.breakTimeStart && doctorProfile.breakTimeEnd
                ? [{
                    iconComp: Coffee,
                    label: t('breakTime' as TranslationKey, language),
                    value: `${doctorProfile.breakTimeStart} - ${doctorProfile.breakTimeEnd}`,
                  }]
                : []),
              ...(doctorProfile.locality
                ? [{
                    iconComp: MapPin,
                    label: language === 'hi' ? 'इलाका / लोकैलिटी' : 'Area / Locality',
                    value: doctorProfile.locality,
                  }]
                : []),
              ...(doctorProfile.consultFee
                ? [{
                    iconComp: CurrencyInr,
                    label: language === 'hi' ? 'परामर्श शुल्क' : 'Consultation Fee',
                    value: `₹${doctorProfile.consultFee}`,
                  }]
                : []),
              ...(doctorProfile.medicalRegNumber
                ? [{
                    iconComp: Shield,
                    label: language === 'hi' ? 'पंजीकरण संख्या' : 'Registration No.',
                    value: doctorProfile.medicalRegNumber,
                  }]
                : []),
            ].map((item, i) => (
              <View key={i} style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  {item.iconComp && <item.iconComp size={18} color={colors.primary} weight="duotone" />}
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </PlatformCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Time picker modal */}
      <Modal visible={timePickerVisible} transparent animationType="slide" onRequestClose={() => setTimePickerVisible(false)}>
        <Pressable style={sheetStyles.overlay} onPress={() => setTimePickerVisible(false)}>
          <Pressable style={sheetStyles.timeSheet} onPress={(e) => e.stopPropagation()}>
            <View style={sheetStyles.handle} />
            <Text style={sheetStyles.timeTitle}>
              {timePickerTarget === 'start' ? t('startTime' as TranslationKey, language) :
               timePickerTarget === 'end' ? t('endTime' as TranslationKey, language) :
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
            {localImage && (
              <TouchableOpacity style={sheetStyles.option} onPress={() => { setShowImageSheet(false); setLocalImage(undefined); if (doctorProfile) setDoctorProfile({ ...doctorProfile, profileImage: undefined }); }}>
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
    </FadeInView>
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
  timeSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingTop: 8, alignItems: 'center' },
  timeTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, marginTop: 4 },
  pickerWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },

  doneBtn: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 48, borderRadius: borderRadius.md, marginTop: 12 },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  backText: { fontSize: 24, color: colors.primary, fontWeight: '600' },
  editBtn: { ...typography.body, color: colors.primary, fontWeight: '600' },
  header: { ...typography.h2, marginBottom: spacing.lg },
  avatarCard: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.md, position: 'relative' },
  cardEditBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCancelText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  avatarWrapper: { position: 'relative', marginBottom: spacing.md, width: 90, height: 90, borderRadius: 45, overflow: 'hidden', backgroundColor: '#F0F9FF' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' } as any,
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.cardHighlight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.primary },
  cameraBadge: { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  cameraBadgeText: { fontSize: 14 },
  doctorNameText: { ...typography.h3, marginBottom: spacing.sm },
  specialtyPill: { backgroundColor: colors.cardHighlight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: borderRadius.full, marginBottom: spacing.sm },
  specialtyPillText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  clinicSubtitle: { ...typography.caption },

  // Completion bar
  completionCard: { marginBottom: spacing.md, backgroundColor: colors.primaryLight },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  completionText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  completionPercent: { fontSize: 16, fontWeight: '800' },
  progressTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  nudgeList: { marginTop: spacing.md },
  nudgeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  nudgeIcon: { fontSize: 14, marginRight: spacing.sm },
  nudgeText: { ...typography.small, color: colors.primary, flex: 1, fontWeight: '500' },
  nudgeArrow: { color: colors.primary, fontSize: 14 },
  completeBar: { backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  completeBarText: { color: colors.success, fontWeight: '600', fontSize: 14 },

  remainingCard: { marginBottom: spacing.md, backgroundColor: colors.primaryLight },
  sectionLabel: { ...typography.caption, color: colors.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md },
  remainingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  remainingStat: { alignItems: 'center', flex: 1 },
  remainingBig: { fontSize: 36, fontWeight: '800', color: colors.primary },
  remainingLabel: { ...typography.small, marginTop: 4 },
  remainingDivider: { width: 1, height: 40, backgroundColor: colors.border },

  // Edit mode
  editCard: { marginBottom: spacing.md },
  editCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  requiredBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,193,7,0.15)', alignItems: 'center', justifyContent: 'center' },
  requiredBadgeText: { fontSize: 12 },
  optionalHint: { ...typography.small, color: colors.textSecondary, fontStyle: 'italic' },
  fieldLabel: { ...typography.caption, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.background, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.textPrimary, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  timeField: { flex: 1 },
  timeSubLabel: { ...typography.small, marginBottom: spacing.xs },
  timeInput: { justifyContent: 'center', alignItems: 'center' },
  timeDisplayText: { color: colors.textPrimary, fontSize: 18, fontWeight: '600', fontVariant: ['tabular-nums'] as any },
  timePlaceholder: { color: colors.textSecondary, fontSize: 18, fontVariant: ['tabular-nums'] as any },
  timeSep: { color: colors.textSecondary, fontSize: 20, marginTop: 18 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  dayChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, minWidth: 44, alignItems: 'center' },
  dayChipActive: { backgroundColor: colors.cardHighlight, borderColor: colors.primary },
  dayChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  dayChipTextActive: { color: colors.primary, fontWeight: '700' },

  // Detail view
  detailCard: { marginBottom: spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  detailIconWrap: { width: 22, alignItems: 'center', marginRight: spacing.md, marginTop: 2 },
  detailInfo: { flex: 1 },
  detailLabel: { ...typography.small, color: colors.textSecondary, marginBottom: 2 },
  detailValue: { ...typography.body, fontWeight: '500' },
  settingsLink: { marginBottom: spacing.md },
  settingsCard: { paddingVertical: spacing.sm },
  settingsRow: { flexDirection: 'row', alignItems: 'center' },
  settingsIcon: { fontSize: 20, marginRight: spacing.md },
  settingsText: { ...typography.body, fontWeight: '500', flex: 1 },
  settingsChevron: { fontSize: 18, color: colors.textSecondary },

});

const profStyles = StyleSheet.create({
  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  verifyBadgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  verifyBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

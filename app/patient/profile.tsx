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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { getDefaultAvatar } from '../../lib/avatars';

import { t, type TranslationKey } from '../../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { getSymptomIcon, CheckCircle, Camera, MapPin, Warning, Hospital, Phone, Gear, LightbulbFilament, ArrowRight, ArrowLeft } from '../../lib/icons';
import { Drop, Tag, PencilSimpleLine } from 'phosphor-react-native';
import { PlatformCard } from '../../components/PlatformCard';
import { Button } from '../../components/Button';
import { FadeInView } from '../../components/FadeInView';
import PhoneInput from '../../components/PhoneInput';
import * as ImagePicker from 'expo-image-picker';

export default function PatientProfile() {
  const router = useRouter();
  const { language, patientProfile, setPatientProfile, patientToken } = useApp();

  const profileScrollRef = useRef<ScrollView>(null);
  const editCardYPositions = useRef<Record<string, number>>({});
  const [pendingNudge, setPendingNudge] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const [name, setName] = useState(patientProfile?.name || '');
  const [age, setAge] = useState(patientProfile?.age || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(patientProfile?.gender || 'male');
  const [phone, setPhone] = useState(patientProfile?.phone || '');
  const [bloodGroup, setBloodGroup] = useState(patientProfile?.bloodGroup || '');
  const [city, setCity] = useState(patientProfile?.city || '');
  const [allergies, setAllergies] = useState(patientProfile?.allergies || '');
  const [existingConditions, setExistingConditions] = useState(patientProfile?.existingConditions || '');
  const [localImage, setLocalImage] = useState<string | undefined>(patientProfile?.profileImage);

  // Profile completion calculation
  const completionData = useMemo(() => {
    const fields = [
      { key: 'name', filled: !!patientProfile?.name, weight: 15, required: true, nudgeKey: 'fullName' },
      { key: 'phone', filled: !!patientProfile?.phone, weight: 15, required: true, nudgeKey: 'addDoctorPhone' },
      { key: 'age', filled: !!patientProfile?.age, weight: 10, required: true, nudgeKey: 'patientAge' },
      { key: 'gender', filled: true, weight: 10, required: true }, // always has default
      { key: 'profileImage', filled: !!patientProfile?.profileImage, weight: 10, nudgeKey: 'addProfilePhoto' },
      { key: 'bloodGroup', filled: !!patientProfile?.bloodGroup, weight: 10, nudgeKey: 'addBloodGroup' },
      { key: 'city', filled: !!patientProfile?.city, weight: 10, nudgeKey: 'addCity' },
      { key: 'allergies', filled: !!patientProfile?.allergies, weight: 10, nudgeKey: 'addAllergies' },
      { key: 'existingConditions', filled: !!patientProfile?.existingConditions, weight: 10, nudgeKey: 'addConditions' },
    ];

    const total = fields.reduce((s, f) => s + f.weight, 0);
    const filled = fields.filter((f) => f.filled).reduce((s, f) => s + f.weight, 0);
    const percent = Math.round((filled / total) * 100);
    const nudges = fields.filter((f) => !f.filled && f.nudgeKey).map((f) => f.nudgeKey!);

    return { percent, nudges };
  }, [patientProfile]);

  // Scroll to field when nudge is tapped
  useEffect(() => {
    if (isEditing && pendingNudge) {
      const optionalNudges = ['addBloodGroup', 'addCity', 'addAllergies', 'addConditions', 'addProfilePhoto'];
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
        if (patientProfile) {
          setPatientProfile({ ...patientProfile, profileImage: result.assets[0].uri });
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
            if (patientProfile) setPatientProfile({ ...patientProfile, profileImage: undefined });
          }
        }
      );
    } else {
      setShowImageSheet(true);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    setPatientProfile({
      name: name.trim(),
      age: age.trim(),
      gender,
      phone: phone.trim(),
      bloodGroup,
      profileImage: localImage,
      city: city.trim(),
      allergies: allergies.trim(),
      existingConditions: existingConditions.trim(),
    });
    setIsEditing(false);
    Alert.alert(t('profileUpdated' as TranslationKey, language));
  };



  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const barColor = colors.primary;

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView ref={profileScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.primary} weight="bold" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/patient/settings')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Gear size={26} color={colors.primary} weight="duotone" />
          </TouchableOpacity>
        </View>

        <Text style={styles.header}>{t('myProfile' as TranslationKey, language)}</Text>

        {/* Profile Completion Bar */}
        {completionData.percent < 100 && (
          <PlatformCard style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionText}>
                {t('profileCompletion' as TranslationKey, language, { percent: completionData.percent })}
              </Text>
              <Text style={[styles.completionPercent, { color: colors.primary }]}>
                {completionData.percent}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completionData.percent}%` as any, backgroundColor: colors.primary }]} />
            </View>
            {completionData.nudges.length > 0 && (
              <View style={styles.nudgeList}>
                {completionData.nudges.slice(0, 2).map((nudge, i) => (
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

        {completionData.percent === 100 && (
          <View style={styles.completeBar}>
            <CheckCircle size={16} color={colors.success} weight="fill" /><Text style={styles.completeBarText}>{t('greatProfile' as TranslationKey, language)}</Text>
          </View>
        )}

        {/* Patient Avatar Card */}
        <PlatformCard style={styles.avatarCard} accentColor={colors.secondary} accentSide="top">
          {/* Edit / Cancel pencil in card corner */}
          <TouchableOpacity
            style={styles.cardEditBtn}
            onPress={() => setIsEditing(!isEditing)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isEditing
              ? <Text style={styles.cardCancelText}>{language === 'hi' ? 'रद्द' : 'Cancel'}</Text>
              : <PencilSimpleLine size={20} color={colors.primary} weight="duotone" />
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={isEditing ? showImageOptions : undefined} activeOpacity={isEditing ? 0.8 : 1}>
            <View style={styles.avatarContainer}>
              <Image
                source={localImage ? { uri: localImage } : getDefaultAvatar('patient', gender)}
                style={styles.avatarImage}
              />
              {isEditing && (
                <View style={styles.cameraBadge}>
                  <Camera size={12} color="#FFFFFF" weight="fill" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>
            {localImage
              ? t('changePhoto' as TranslationKey, language)
              : t('addPhoto' as TranslationKey, language)}
          </Text>

          <Text style={styles.patientName}>{name || (language === 'hi' ? 'मरीज़' : 'Patient')}</Text>
          <View style={styles.infoRow}>
            {age ? (
              <View style={styles.infoPill}>
                <Text style={styles.infoPillText}>{age} yrs</Text>
              </View>
            ) : null}
            <View style={styles.infoPill}>
              <Text style={styles.infoPillText}>
                {gender === 'male'
                  ? t('male' as TranslationKey, language)
                  : gender === 'female'
                  ? t('female' as TranslationKey, language)
                  : t('otherGender' as TranslationKey, language)}
              </Text>
            </View>
            {bloodGroup ? (
              <View style={styles.infoPill}>
                <Text style={styles.infoPillText}>{bloodGroup}</Text>
              </View>
            ) : null}
            {city ? (
              <View style={styles.infoPill}>
                <MapPin size={12} color={colors.primary} weight="fill" /><Text style={styles.infoPillText}>{city}</Text>
              </View>
            ) : null}
          </View>
          {patientToken && (
            <View style={styles.tokenPill}>
              <Text style={styles.tokenPillText}>
                {t('tokenLabel' as TranslationKey, language)} #{patientToken.tokenNumber}
              </Text>
            </View>
          )}
        </PlatformCard>

        {/* Editable Personal Info */}
        {isEditing ? (
          <>
            {/* Required Fields */}
            <View onLayout={(e) => { editCardYPositions.current.required = e.nativeEvent.layout.y; }}>
            <PlatformCard style={styles.editCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>
                  {t('personalInfo' as TranslationKey, language)}
                </Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>Required</Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>
                {t('patientName' as TranslationKey, language)} *
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('patientNamePlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.fieldLabel}>
                {t('patientPhone' as TranslationKey, language)} *
              </Text>
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

              <Text style={styles.fieldLabel}>
                {t('patientAge' as TranslationKey, language)} *
              </Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder={t('patientAgePlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
                maxLength={3}
              />

              <Text style={styles.fieldLabel}>
                {t('patientGender' as TranslationKey, language)} *
              </Text>
              <View style={styles.genderRow}>
                {(['male', 'female', 'other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}
                    >
                      {g === 'other'
                        ? t('otherGender' as TranslationKey, language)
                        : t(g as TranslationKey, language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </PlatformCard>
            </View>

            {/* Optional Fields */}
            <View onLayout={(e) => { editCardYPositions.current.optional = e.nativeEvent.layout.y; }}>
            <PlatformCard style={styles.editCard}>
              {/* Optional section — no header needed, fields are self-explanatory */}

              <Text style={styles.fieldLabel}>
                {t('patientBloodGroup' as TranslationKey, language)}
              </Text>
              <View style={styles.bloodGroupRow}>
                {bloodGroups.map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodGroupBtn, bloodGroup === bg && styles.bloodGroupBtnActive]}
                    onPress={() => setBloodGroup(bloodGroup === bg ? '' : bg)}
                  >
                    <Text
                      style={[
                        styles.bloodGroupText,
                        bloodGroup === bg && styles.bloodGroupTextActive,
                      ]}
                    >
                      {bg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>
                {t('cityArea' as TranslationKey, language)}
              </Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder={t('cityAreaPlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.fieldLabel}>
                {t('knownAllergies' as TranslationKey, language)}
              </Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={allergies}
                onChangeText={setAllergies}
                placeholder={t('knownAllergiesPlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={2}
              />

              <Text style={styles.fieldLabel}>
                {t('existingConditions' as TranslationKey, language)}
              </Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={existingConditions}
                onChangeText={setExistingConditions}
                placeholder={t('existingConditionsPlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={2}
              />
            </PlatformCard>
            </View>

            <View style={{ marginHorizontal: spacing.xs }}>
              <Button
                title={t('saveChanges' as TranslationKey, language)}
                onPress={handleSave}
                size="lg"
              />
            </View>
            <View style={{ height: spacing.md }} />
          </>
        ) : (
          <PlatformCard style={styles.detailCard}>
            <Text style={styles.sectionLabel}>
              {t('personalInfo' as TranslationKey, language)}
            </Text>

            {phone ? (
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Phone size={18} color={colors.primary} weight="duotone" />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    {t('patientPhone' as TranslationKey, language)}
                  </Text>
                  <Text style={styles.detailValue}>{phone}</Text>
                </View>
              </View>
            ) : null}

            {bloodGroup ? (
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Drop size={18} color={colors.primary} weight="duotone" />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    {t('patientBloodGroup' as TranslationKey, language)}
                  </Text>
                  <Text style={styles.detailValue}>{bloodGroup}</Text>
                </View>
              </View>
            ) : null}

            {city ? (
              <View style={styles.detailRow}>
                <MapPin size={18} color={colors.primary} weight="duotone" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    {t('cityArea' as TranslationKey, language)}
                  </Text>
                  <Text style={styles.detailValue}>{city}</Text>
                </View>
              </View>
            ) : null}

            {allergies ? (
              <View style={styles.detailRow}>
                <Warning size={18} color={'#F59E0B'} weight="duotone" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    {t('knownAllergies' as TranslationKey, language)}
                  </Text>
                  <Text style={styles.detailValue}>{allergies}</Text>
                </View>
              </View>
            ) : null}

            {existingConditions ? (
              <View style={styles.detailRow}>
                <Hospital size={18} color={colors.primary} weight="duotone" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    {t('existingConditions' as TranslationKey, language)}
                  </Text>
                  <Text style={styles.detailValue}>{existingConditions}</Text>
                </View>
              </View>
            ) : null}

            {patientToken && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Tag size={18} color={colors.primary} weight="duotone" />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    {t('symptomLabel' as TranslationKey, language)}
                  </Text>
                  <Text style={styles.detailValue}>
                    {t(patientToken.symptomKey as TranslationKey, language)}
                  </Text>
                </View>
              </View>
            )}

            {!phone && !bloodGroup && !patientToken && !city && !allergies && !existingConditions && (
              <Text style={styles.emptyText}>
                {language === 'hi' ? 'प्रोफ़ाइल संपादित करें और जानकारी जोड़ें' : 'Edit profile to add your details'}
              </Text>
            )}
          </PlatformCard>
        )}



        <View style={{ height: 40 }} />
      </ScrollView>

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
              <TouchableOpacity style={sheetStyles.option} onPress={() => { setShowImageSheet(false); setLocalImage(undefined); if (patientProfile) setPatientProfile({ ...patientProfile, profileImage: undefined }); }}>
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '600',
  },
  editBtn: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  header: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },

  // Completion bar
  completionCard: {
    marginBottom: spacing.md,
    backgroundColor: 'rgba(0,150,136,0.04)',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  completionText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  completionPercent: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  nudgeList: {
    marginTop: spacing.md,
  },
  nudgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  nudgeIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  nudgeText: {
    ...typography.small,
    color: colors.primary,
    flex: 1,
    fontWeight: '500',
  },
  nudgeArrow: {
    color: colors.primary,
    fontSize: 14,
  },
  completeBar: {
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  completeBarText: {
    color: colors.success,
    fontWeight: '600',
    fontSize: 14,
  },

  // Avatar card
  avatarCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
    position: 'relative',
  },
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
  avatarContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    backgroundColor: '#F0F9FF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(68,138,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.secondary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadgeText: {
    fontSize: 13,
  },
  photoHint: {
    ...typography.caption,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    color: colors.primary,
  },
  patientName: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoPillText: {
    ...typography.small,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  tokenPill: {
    backgroundColor: colors.cardHighlight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  tokenPillText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  // Section labels
  sectionLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  requiredBadge: {
    backgroundColor: 'rgba(255,152,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9800',
  },
  optionalHint: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // Edit form
  editCard: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multilineInput: {
    minHeight: 56,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  genderBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.cardHighlight,
  },
  genderBtnText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  genderBtnTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  bloodGroupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bloodGroupBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  bloodGroupBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.cardHighlight,
  },
  bloodGroupText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  bloodGroupTextActive: {
    color: colors.primary,
  },

  // Detail view
  detailCard: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  detailIconWrap: {
    width: 22,
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    ...typography.body,
    fontWeight: '500',
  },
  emptyText: {
    ...typography.bodySecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },


});

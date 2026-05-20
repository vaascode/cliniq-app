import React, { useState, useEffect, useCallback } from 'react';
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
  ActionSheetIOS,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { t, type TranslationKey } from '../../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Camera, GenderMale, GenderFemale, User, ArrowLeft } from '../../lib/icons';
import { Button } from '../../components/Button';
import { PlatformCard } from '../../components/PlatformCard';
import PhoneInput from '../../components/PhoneInput';
import * as ImagePicker from 'expo-image-picker';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function PatientRegistration() {
  const router = useRouter();
  const navigation = useNavigation();
  const { language, setPatientProfile, setRole } = useApp();
  const params = useLocalSearchParams<{ authName?: string; authEmail?: string; authPhoto?: string; authPhone?: string }>();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [name, setName] = useState(params.authName || '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [phone, setPhone] = useState(params.authPhone || '');
  const [bloodGroup, setBloodGroup] = useState('');
  const [city, setCity] = useState('');
  const [allergies, setAllergies] = useState('');
  const [existingConditions, setExistingConditions] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>(params.authPhoto || undefined);
  const [showImageSheet, setShowImageSheet] = useState(false);

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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const isValid = name.trim().length > 0 && (phone.trim().length === 0 || phone.trim().length >= 10);

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(language === 'hi' ? 'कैमरा अनुमति चाहिए' : 'Camera permission needed');
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(language === 'hi' ? 'गैलरी अनुमति चाहिए' : 'Gallery permission needed');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Image picker error:', e);
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
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: profileImage ? options.length - 2 : undefined,
        },
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

  const handleCreate = async () => {
    if (!isValid) return;
    await setPatientProfile({
      name: name.trim(),
      age: age.trim(),
      gender,
      phone: phone.trim(),
      bloodGroup,
      profileImage,
      city: city.trim(),
      allergies: allergies.trim(),
      existingConditions: existingConditions.trim(),
    });
    router.replace('/patient/scan');
  };

  const handleSkip = async () => {
    await setPatientProfile({
      name: language === 'hi' ? 'मरीज़' : 'Patient',
      age: '',
      gender: 'male',
      phone: '',
      bloodGroup: '',
      profileImage: undefined,
      city: '',
      allergies: '',
      existingConditions: '',
    });
    router.replace('/patient/scan');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={goBack}>
                <ArrowLeft size={22} color={colors.primary} weight="bold" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSkip}>
                <Text style={styles.skipText}>{t('skip' as TranslationKey, language)} →</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.header}>{t('setupProfile' as TranslationKey, language)}</Text>
            <Text style={styles.subheader}>{t('takesAMinute' as TranslationKey, language)}</Text>

            {/* Profile Photo */}
            <View style={styles.photoSection}>
              <TouchableOpacity onPress={showImageOptions} activeOpacity={0.8}>
                <View style={styles.photoContainer}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.photo} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Camera size={28} color={colors.textSecondary} weight="regular" />
                    </View>
                  )}
                  <View style={styles.photoBadge}>
                    <Text style={styles.photoBadgeText}>+</Text>
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
              <Text style={styles.label}>{t('patientName' as TranslationKey, language)} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('patientNamePlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Age */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('patientAge' as TranslationKey, language)}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('patientAgePlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            {/* Gender */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('patientGender' as TranslationKey, language)}</Text>
              <View style={styles.genderRow}>
                {(['male', 'female', 'other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={styles.genderIcon}>
                      {g === 'male' ? <GenderMale size={20} color={colors.primary} weight="duotone" /> : g === 'female' ? <GenderFemale size={20} color={colors.primary} weight="duotone" /> : <User size={20} color={colors.primary} weight="duotone" />}
                    </Text>
                    <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                      {g === 'other'
                        ? t('otherGender' as TranslationKey, language)
                        : t(g as TranslationKey, language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Phone */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('patientPhone' as TranslationKey, language)}</Text>
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

            {/* Blood Group */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('patientBloodGroup' as TranslationKey, language)}</Text>
              <View style={styles.bloodGroupGrid}>
                {BLOOD_GROUPS.map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodGroupBtn, bloodGroup === bg && styles.bloodGroupBtnActive]}
                    onPress={() => setBloodGroup(bloodGroup === bg ? '' : bg)}
                  >
                    <Text style={[styles.bloodGroupText, bloodGroup === bg && styles.bloodGroupTextActive]}>
                      {bg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Optional fields */}

            {/* City / Area */}
            <View style={styles.field}>
              <Text style={styles.label}>
                {t('cityArea' as TranslationKey, language)}
                <Text style={styles.optionalTag}> ({t('optionalLabel' as TranslationKey, language)})</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t('cityAreaPlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
                value={city}
                onChangeText={setCity}
              />
            </View>

            {/* Known Allergies */}
            <View style={styles.field}>
              <Text style={styles.label}>
                {t('knownAllergies' as TranslationKey, language)}
                <Text style={styles.optionalTag}> ({t('optionalLabel' as TranslationKey, language)})</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder={t('knownAllergiesPlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
                value={allergies}
                onChangeText={setAllergies}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Existing Conditions */}
            <View style={styles.field}>
              <Text style={styles.label}>
                {t('existingConditions' as TranslationKey, language)}
                <Text style={styles.optionalTag}> ({t('optionalLabel' as TranslationKey, language)})</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder={t('existingConditionsPlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
                value={existingConditions}
                onChangeText={setExistingConditions}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={t('createProfile' as TranslationKey, language)}
                onPress={handleCreate}
                size="lg"
                disabled={!isValid}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
  skipText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subheader: {
    ...typography.bodySecondary,
    marginBottom: spacing.xl,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 32,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  photoBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: -1,
  },
  photoHint: {
    ...typography.caption,
    marginTop: spacing.sm,
    color: colors.primary,
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
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  genderBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.cardHighlight,
  },
  genderIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  genderText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  genderTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bloodGroupBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 60,
    alignItems: 'center',
  },
  bloodGroupBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.cardHighlight,
  },
  bloodGroupText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bloodGroupTextActive: {
    color: colors.primary,
  },
  multilineInput: {
    minHeight: 56,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  optionalTag: {
    color: colors.textSecondary,
    fontWeight: '400',
    textTransform: 'none',
    fontSize: 11,
    letterSpacing: 0,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  errorHint: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
  },
});

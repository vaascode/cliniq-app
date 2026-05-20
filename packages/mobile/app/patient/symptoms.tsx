import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  TextInput,
  Modal,
  Pressable,
  Platform,
  Alert,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { t, type TranslationKey } from '../../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { getSymptomIcon, User, Heart, Sparkle, MagnifyingGlass, Warning, ArrowLeft } from '../../lib/icons';
import { PlatformCard } from '../../components/PlatformCard';
import { Button } from '../../components/Button';
import {
  symptomCards,
  estimateConsultTime,
  mockPatientToken,
  specialtyRecommendations,
  getSpecialtyKey,
  type RecommendedConcern,
} from '../../lib/mockData';
import * as Haptics from 'expo-haptics';

type BookingFor = 'myself' | 'someone';

const RELATIONS = [
  'relationFather',
  'relationMother',
  'relationWife',
  'relationHusband',
  'relationSon',
  'relationDaughter',
  'relationFriend',
  'relationOther',
] as const;

export default function SymptomsScreen() {
  const router = useRouter();
  const { language, selectedClinic, patientProfile, addToken, allTokens, isQueuePaused } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [selectedBaseTime, setSelectedBaseTime] = useState<number>(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showAllConcerns, setShowAllConcerns] = useState(false);

  // Mismatch warning
  const [showMismatchWarning, setShowMismatchWarning] = useState(false);
  const [pendingConcern, setPendingConcern] = useState<{
    key: string;
    label: string;
    baseTime: number;
  } | null>(null);
  const mismatchAnim = useRef(new Animated.Value(0)).current;

  // Book-for state
  const [bookingFor, setBookingFor] = useState<BookingFor>('myself');
  const [otherName, setOtherName] = useState('');
  const [otherAge, setOtherAge] = useState('');
  const [otherRelation, setOtherRelation] = useState('');
  const [showRelationPicker, setShowRelationPicker] = useState(false);

  // Stagger animation for recommended cards
  const cardAnims = useRef<Animated.Value[]>([]).current;

  // Get specialty info
  const specialtyKey = selectedClinic?.specialtyKey || getSpecialtyKey(selectedClinic?.specialty || '');
  const recommendations = specialtyRecommendations[specialtyKey] || specialtyRecommendations['generalPhysician'];
  const specialtyDisplay = selectedClinic?.specialty || 'General';

  // Build recommended concern keys set for mismatch detection
  const recommendedKeys = new Set(recommendations.map((r) => r.key));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Initialize card animations
  useEffect(() => {
    if (cardAnims.length === 0) {
      for (let i = 0; i < 6; i++) {
        cardAnims.push(new Animated.Value(0));
      }
    }
    // Stagger entrance
    const anims = cardAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 350,
        delay: i * 80,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      })
    );
    Animated.stagger(80, anims).start();
  }, []);

  const estimatedMins = selectedBaseTime ? estimateConsultTime(selectedBaseTime) : 0;

  const handleSelectRecommended = async (concern: RecommendedConcern) => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setSelected(concern.key);
    setSelectedLabel(language === 'hi' ? concern.labelHi : concern.label);
    setSelectedBaseTime(concern.baseTime);
    setShowAllConcerns(false);
  };

  const handleSelectGeneral = async (symptom: typeof symptomCards[0]) => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}

    const label = t(symptom.key as TranslationKey, language);

    // Check mismatch: is this symptom NOT in recommended list?
    if (!recommendedKeys.has(symptom.key) && symptom.key !== 'followUp' && symptom.key !== 'prescriptionRefill' && symptom.key !== 'somethingElse') {
      setPendingConcern({ key: symptom.key, label, baseTime: symptom.baseTime });
      setShowMismatchWarning(true);
      mismatchAnim.setValue(0);
      Animated.spring(mismatchAnim, {
        toValue: 1,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }).start();
      return;
    }

    setSelected(symptom.key);
    setSelectedLabel(label);
    setSelectedBaseTime(symptom.baseTime);
  };

  const handleContinueAnyway = () => {
    if (pendingConcern) {
      setSelected(pendingConcern.key);
      setSelectedLabel(pendingConcern.label);
      setSelectedBaseTime(pendingConcern.baseTime);
    }
    setShowMismatchWarning(false);
    setPendingConcern(null);
  };

  const handleChooseRecommended = () => {
    setShowMismatchWarning(false);
    setPendingConcern(null);
    setShowAllConcerns(false);
    // Scroll to top
  };

  const handleToggleBookingFor = async (mode: BookingFor) => {
    if (mode === bookingFor) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setBookingFor(mode);
  };

  const handleConfirm = () => {
    if (!selected || !selectedLabel) return;

    const isForSelf = bookingFor === 'myself';
    const tokenPatientName = isForSelf
      ? (patientProfile?.name || (language === 'hi' ? 'मरीज़' : 'Patient'))
      : (otherName || (language === 'hi' ? 'मरीज़' : 'Patient'));
    const tokenPatientAge = isForSelf
      ? (patientProfile?.age || '')
      : otherAge;
    const tokenRelation = isForSelf ? 'self' : (otherRelation || 'relationOther');

    const clinicName = selectedClinic?.clinicName || 'Sharma Heart Clinic';
    const duplicate = allTokens.find((tk) => {
      const samePerson = (tk.patientName || '').toLowerCase() === tokenPatientName.toLowerCase();
      const sameClinic = tk.clinicName === clinicName;
      const isActive = tk.status !== 'done';
      return samePerson && sameClinic && isActive;
    });

    if (duplicate) {
      Alert.alert(
        t('duplicateTokenTitle' as TranslationKey, language),
        t('duplicateTokenMsg' as TranslationKey, language, { name: tokenPatientName }),
      );
      return;
    }

    // Find emoji for selected concern
    const recMatch = recommendations.find((r) => r.key === selected);
    const genMatch = symptomCards.find((s) => s.key === selected);
    const emoji = recMatch?.emoji || genMatch?.emoji || '🩺';

    const token = {
      ...mockPatientToken,
      clinicName: selectedClinic?.clinicName || 'Sharma Heart Clinic',
      doctorName: selectedClinic?.doctorName || 'Dr. Rajesh Sharma',
      specialty: selectedClinic?.specialty || 'Cardiologist',
      symptom: selectedLabel,
      symptomEmoji: emoji,
      symptomKey: selected,
      tokenNumber: Math.floor(Math.random() * 50) + 30,
      peopleAhead: Math.floor(Math.random() * 8) + 2,
      estimatedWait: Math.floor(Math.random() * 30) + 15,
      joinedAt: new Date(),
      status: 'waiting' as const,
      patientName: tokenPatientName,
      patientAge: tokenPatientAge,
      relation: tokenRelation,
    };

    addToken(token);
    router.replace('/patient/token');
  };

  const userName = patientProfile?.name || (language === 'hi' ? 'मरीज़' : 'Patient');
  const userAge = patientProfile?.age || '';
  const relationLabel = otherRelation ? t(otherRelation as TranslationKey, language) : '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.primary} weight="bold" />
          </TouchableOpacity>

          <View style={styles.clinicBadge}>
            <Text style={styles.clinicBadgeText}>
              {selectedClinic?.clinicName || 'Sharma Heart Clinic'}
            </Text>
          </View>

          {/* ── Book Token For ── */}
          <Text style={styles.sectionTitle}>
            {t('bookTokenFor' as TranslationKey, language)}
          </Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={styles.toggleCardWrap}
              activeOpacity={0.7}
              onPress={() => handleToggleBookingFor('myself')}
            >
              <View style={[styles.toggleCard, bookingFor === 'myself' && styles.toggleCardActive]}>
                <View style={[styles.toggleIcon, bookingFor === 'myself' && styles.toggleIconActive]}>
                  <User size={22} color={colors.primary} weight="duotone" />
                </View>
                <Text style={[styles.toggleLabel, bookingFor === 'myself' && styles.toggleLabelActive]}>
                  {t('myself' as TranslationKey, language)}
                </Text>
                <Text style={[styles.toggleSub, bookingFor === 'myself' && styles.toggleSubActive]} numberOfLines={1}>
                  {userName}{userAge ? `, ${userAge} yrs` : ''}
                </Text>
                {bookingFor === 'myself' && (
                  <View style={styles.checkBadge}><Text style={styles.checkText}>✓</Text></View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleCardWrap}
              activeOpacity={0.7}
              onPress={() => handleToggleBookingFor('someone')}
            >
              <View style={[styles.toggleCard, bookingFor === 'someone' && styles.toggleCardActive]}>
                <View style={[styles.toggleIcon, bookingFor === 'someone' && styles.toggleIconActive]}>
                  <Heart size={22} color={colors.primary} weight="duotone" />
                </View>
                <Text style={[styles.toggleLabel, bookingFor === 'someone' && styles.toggleLabelActive]}>
                  {t('someoneElse' as TranslationKey, language)}
                </Text>
                <Text style={[styles.toggleSub, bookingFor === 'someone' && styles.toggleSubActive]} numberOfLines={1}>
                  {bookingFor === 'someone' && otherName
                    ? otherName
                    : (language === 'hi' ? 'परिवार / दोस्त' : 'Family / Friend')}
                </Text>
                {bookingFor === 'someone' && (
                  <View style={styles.checkBadge}><Text style={styles.checkText}>✓</Text></View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Someone Else — Input Fields */}
          {bookingFor === 'someone' && (
            <PlatformCard style={styles.someoneCard}>
              <Text style={styles.fieldLabel}>{t('enterFullName' as TranslationKey, language)}</Text>
              <TextInput
                style={styles.input}
                value={otherName}
                onChangeText={setOtherName}
                placeholder={t('namePlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.fieldLabel}>{t('enterAge' as TranslationKey, language)}</Text>
              <TextInput
                style={styles.input}
                value={otherAge}
                onChangeText={setOtherAge}
                placeholder={t('agePlaceholder' as TranslationKey, language)}
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.fieldLabel}>{t('relation' as TranslationKey, language)}</Text>
              <TouchableOpacity
                style={styles.dropdown}
                activeOpacity={0.7}
                onPress={() => setShowRelationPicker(true)}
              >
                <Text style={[styles.dropdownText, !otherRelation && styles.dropdownPlaceholder]}>
                  {relationLabel || t('selectRelation' as TranslationKey, language)}
                </Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </TouchableOpacity>
            </PlatformCard>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* ── AI Recommended Section ── */}
          <View style={styles.recommendedHeader}>
            <View style={styles.recommendedTitleRow}>
              <Sparkle size={18} color={colors.primary} weight="duotone" />
              <Text style={styles.recommendedTitle}>
                {t('recommendedForClinic' as TranslationKey, language)}
              </Text>
            </View>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>{t('aiSuggested' as TranslationKey, language)}</Text>
            </View>
          </View>

          <View style={styles.recommendedGrid}>
            {recommendations.map((concern, idx) => {
              const isSelected = selected === concern.key && !showAllConcerns;
              const animVal = cardAnims[idx] || new Animated.Value(1);
              return (
                <Animated.View
                  key={concern.key}
                  style={[
                    styles.recommendedItem,
                    {
                      opacity: animVal,
                      transform: [
                        {
                          translateY: animVal.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                        {
                          scale: animVal.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleSelectRecommended(concern)}
                  >
                    <View style={[styles.recommendedCard, isSelected && styles.recommendedCardActive]}>
                      {getSymptomIcon(concern.key, { size: 22, color: colors.primary, weight: 'duotone' })}
                      <Text
                        style={[styles.recommendedLabel, isSelected && styles.recommendedLabelActive]}
                        numberOfLines={2}
                      >
                        {language === 'hi' ? concern.labelHi : concern.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.selectedDot}>
                          <Text style={styles.selectedDotText}>✓</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* ── Something Else Button ── */}
          <TouchableOpacity
            style={[styles.somethingElseBtn, showAllConcerns && styles.somethingElseBtnActive]}
            activeOpacity={0.7}
            onPress={() => {
              setShowAllConcerns(!showAllConcerns);
              if (!showAllConcerns) {
                setSelected(null);
                setSelectedLabel('');
                setSelectedBaseTime(0);
              }
            }}
          >
            <Text style={styles.somethingElseIcon}>{showAllConcerns ? '↑' : ''}</Text>
            <Text style={[styles.somethingElseText, showAllConcerns && styles.somethingElseTextActive]}>
              {showAllConcerns
                ? t('chooseRecommended' as TranslationKey, language)
                : t('somethingElseBtn' as TranslationKey, language)}
            </Text>
          </TouchableOpacity>

          {/* ── All Concerns (expanded) ── */}
          {showAllConcerns && (
            <View>
              <Text style={styles.allConcernsTitle}>
                {t('allConcerns' as TranslationKey, language)}
              </Text>
              <View style={styles.grid}>
                {symptomCards.map((symptom) => {
                  const isSelected2 = selected === symptom.key;
                  return (
                    <TouchableOpacity
                      key={symptom.key}
                      style={styles.gridItem}
                      onPress={() => handleSelectGeneral(symptom)}
                      activeOpacity={0.7}
                    >
                      <PlatformCard
                        style={styles.symptomCard}
                        highlighted={isSelected2}
                      >
                        {getSymptomIcon(symptom.key, { size: 22, color: colors.primary, weight: 'duotone' })}
                        <Text
                          style={[styles.symptomTextEn, isSelected2 && styles.symptomTextSelected]}
                          numberOfLines={2}
                        >
                          {t(symptom.key as TranslationKey, 'en')}
                        </Text>
                        <Text style={styles.symptomTextHi} numberOfLines={2}>
                          {t(symptom.key as TranslationKey, 'hi')}
                        </Text>
                      </PlatformCard>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* AI Estimate */}
          {selected && (
            <PlatformCard style={styles.estimateCard}>
              <Text style={styles.estimateIcon}>🤖</Text>
              <Text style={styles.estimateText}>
                {t('aiEstimate', language, { mins: String(estimatedMins) })}
              </Text>
            </PlatformCard>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Sticky bottom button */}
        <View style={styles.stickyButtonContainer}>
          {isQueuePaused && (
            <View style={styles.pausedBannerBottom}>
              <Text style={styles.pausedBannerBottomText}>
                {t('clinicCurrentlyPaused' as any, language)}
              </Text>
            </View>
          )}
          <Button
            title={isQueuePaused ? t('clinicCurrentlyPaused' as any, language) : t('confirmGetToken', language)}
            onPress={handleConfirm}
            size="lg"
            disabled={!selected || isQueuePaused}
          />
        </View>
      </Animated.View>

      {/* ── Mismatch Warning Modal ── */}
      <Modal
        visible={showMismatchWarning}
        transparent
        animationType="none"
        onRequestClose={() => setShowMismatchWarning(false)}
      >
        <Pressable
          style={mismatchStyles.overlay}
          onPress={() => setShowMismatchWarning(false)}
        >
          <Animated.View
            style={[
              mismatchStyles.popup,
              {
                opacity: mismatchAnim,
                transform: [
                  {
                    scale: mismatchAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={mismatchStyles.iconWrap}>
                <Warning size={24} color={colors.warning || '#F59E0B'} weight="duotone" />
              </View>
              <Text style={mismatchStyles.title}>
                {t('mismatchWarningTitle' as TranslationKey, language)}
              </Text>
              <Text style={mismatchStyles.message}>
                {t('mismatchWarningMsg' as TranslationKey, language, {
                  specialty: specialtyDisplay,
                  concern: pendingConcern?.label || '',
                })}
              </Text>
              <Text style={mismatchStyles.hint}>
                {t('mismatchWarningHint' as TranslationKey, language)}
              </Text>
              <TouchableOpacity
                style={mismatchStyles.primaryBtn}
                onPress={handleChooseRecommended}
                activeOpacity={0.7}
              >
                <Text style={mismatchStyles.primaryBtnText}>
                  {t('chooseRecommended' as TranslationKey, language)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={mismatchStyles.secondaryBtn}
                onPress={handleContinueAnyway}
                activeOpacity={0.7}
              >
                <Text style={mismatchStyles.secondaryBtnText}>
                  {t('continueAnyway' as TranslationKey, language)}
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Relation Picker Modal */}
      <Modal
        visible={showRelationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRelationPicker(false)}
      >
        <Pressable
          style={modalStyles.overlay}
          onPress={() => setShowRelationPicker(false)}
        >
          <Pressable style={modalStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={modalStyles.handle} />
            <Text style={modalStyles.sheetTitle}>
              {t('relation' as TranslationKey, language)}
            </Text>
            {RELATIONS.map((rel) => {
              const isSelected3 = otherRelation === rel;
              return (
                <TouchableOpacity
                  key={rel}
                  style={[modalStyles.option, isSelected3 && modalStyles.optionActive]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setOtherRelation(rel);
                    setShowRelationPicker(false);
                  }}
                >
                  <Text style={[modalStyles.optionText, isSelected3 && modalStyles.optionTextActive]}>
                    {t(rel as TranslationKey, language)}
                  </Text>
                  {isSelected3 && <Text style={modalStyles.optionCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setShowRelationPicker(false)}>
              <Text style={modalStyles.cancelText}>
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ── Mismatch Warning Styles ── */
const mismatchStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  popup: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,0.25)',
  },
  iconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,180,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    color: '#FFB400',
    marginBottom: 10,
    fontWeight: '700',
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

/* ── Modal Styles ── */
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    ...typography.body,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: colors.textPrimary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  optionActive: {
    backgroundColor: 'rgba(22,101,52,0.06)',
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  optionCheck: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});

/* ── Main Styles ── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
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
  clinicBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  clinicBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },

  /* ── Book Token For ── */
  sectionTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  toggleCardWrap: { flex: 1 },
  toggleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    position: 'relative',
    minHeight: 120,
    justifyContent: 'center',
  },
  toggleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  toggleIconActive: { backgroundColor: 'rgba(22,101,52,0.1)' },
  toggleEmoji: { fontSize: 22 },
  toggleLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  toggleLabelActive: { color: colors.primary, fontWeight: '700' },
  toggleSub: {
    ...typography.small,
    color: colors.textSecondary,
    fontSize: 11,
  },
  toggleSubActive: { color: colors.primary },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },

  /* ── Someone Else Fields ── */
  someoneCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
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
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownPlaceholder: { color: colors.textSecondary, fontWeight: '400' },
  dropdownChevron: {
    color: colors.textSecondary,
    fontSize: 16,
    marginLeft: spacing.sm,
  },

  /* ── Divider ── */
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },

  /* ── Recommended Section ── */
  recommendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  recommendedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sparkle: {
    fontSize: 18,
  },
  recommendedTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    fontSize: 15,
  },
  aiBadge: {
    backgroundColor: 'rgba(138,43,226,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  aiBadgeText: {
    color: '#A855F7',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.lg,
  },
  recommendedItem: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  recommendedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm + 2,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    position: 'relative',
  },
  recommendedCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(22,101,52,0.06)',
  },
  recommendedEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  recommendedLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 17,
  },
  recommendedLabelActive: {
    color: colors.primary,
  },
  selectedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDotText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },

  /* ── Something Else ── */
  somethingElseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    marginBottom: spacing.lg,
    gap: 8,
  },
  somethingElseBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  somethingElseIcon: {
    fontSize: 16,
  },
  somethingElseText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: 14,
  },
  somethingElseTextActive: {
    color: colors.primary,
  },

  /* ── All Concerns (expanded) ── */
  allConcernsTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  gridItem: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  symptomCard: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    minHeight: 110,
    justifyContent: 'center',
  },
  symptomEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  symptomTextEn: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 13,
  },
  symptomTextSelected: { color: colors.primary },
  symptomTextHi: {
    ...typography.small,
    textAlign: 'center',
    fontSize: 11,
    marginTop: 2,
  },

  /* ── Estimate ── */
  estimateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22,101,52,0.06)',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  estimateIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  estimateText: {
    ...typography.caption,
    color: colors.primary,
    flex: 1,
    lineHeight: 20,
  },

  /* ── Sticky Button ── */
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pausedBannerBottom: {
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  pausedBannerBottomText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
});

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, Modal, BackHandler, Alert, Platform, Animated, Easing, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { t } from '../../lib/i18n';
import type { TranslationKey } from '../../lib/i18n';
import type { QueuePatient } from '../../lib/mockData';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { getSymptomIcon, Hospital, CheckCircle, Clock, ListBullets, ChartBar, User, Queue, Star, FastForward, Gear } from '../../lib/icons';
import { PlatformCard } from '../../components/PlatformCard';
import { FadeInView } from '../../components/FadeInView';
import { getDefaultAvatar } from '../../lib/avatars';
import { Button } from '../../components/Button';
import * as Haptics from 'expo-haptics';

/* ── QR Code Icon (pure RN views — no SVG dependency) ── */
const QrCodeIcon = ({ size = 48, color = colors.primary }: { size?: number; color?: string }) => {
  const s = size;
  const cell = s / 7;
  const blockSize = cell * 3;
  const innerSize = cell * 1.2;
  const gap = cell * 0.3;

  const CornerBlock = () => (
    <View style={{ width: blockSize, height: blockSize, borderWidth: cell * 0.22, borderColor: color, borderRadius: cell * 0.35, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: innerSize, height: innerSize, borderRadius: cell * 0.2, backgroundColor: color }} />
    </View>
  );

  return (
    <View style={{ width: s, height: s }}>
      {/* Top row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <CornerBlock />
        <CornerBlock />
      </View>
      {/* Bottom row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: s - blockSize * 2 }}>
        <CornerBlock />
        {/* Data dots bottom-right */}
        <View style={{ width: blockSize, height: blockSize, flexDirection: 'row', flexWrap: 'wrap', gap: gap, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: cell * 0.9, height: cell * 0.9, borderRadius: cell * 0.15, backgroundColor: color }} />
          <View style={{ width: cell * 0.9, height: cell * 0.9, borderRadius: cell * 0.15, backgroundColor: color, opacity: 0.4 }} />
          <View style={{ width: cell * 0.9, height: cell * 0.9, borderRadius: cell * 0.15, backgroundColor: color, opacity: 0.4 }} />
          <View style={{ width: cell * 0.9, height: cell * 0.9, borderRadius: cell * 0.15, backgroundColor: color }} />
        </View>
      </View>
    </View>
  );
};

export default function DoctorDashboard() {
  const router = useRouter();
  const { language, doctorProfile, queue, nextPatient, undoNextPatient, skipAndHold, recallPatient, lastQueueSnapshot, isClinicOpen, isQueuePaused, toggleQueuePaused } = useApp();

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSkipHoldConfirm, setShowSkipHoldConfirm] = useState(false);
  const [onHoldExpanded, setOnHoldExpanded] = useState(true);

  // Undo toast state
  const [showUndo, setShowUndo] = useState(false);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState(8);
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoSlideAnim = useRef(new Animated.Value(100)).current;
  const undoProgressAnim = useRef(new Animated.Value(1)).current;

  const startUndoTimer = useCallback(() => {
    setShowUndo(true);
    setUndoSecondsLeft(8);
    undoProgressAnim.setValue(1);

    // Slide in
    Animated.spring(undoSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();

    // Progress bar animation
    Animated.timing(undoProgressAnim, {
      toValue: 0,
      duration: 8000,
      useNativeDriver: false,
    }).start();

    // Countdown
    undoTimerRef.current = setInterval(() => {
      setUndoSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(undoTimerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-dismiss after 8s
    undoTimeoutRef.current = setTimeout(() => {
      dismissUndo();
    }, 8000);
  }, []);

  const dismissUndo = useCallback(() => {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    Animated.timing(undoSlideAnim, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowUndo(false);
    });
  }, []);

  const handleUndoPress = useCallback(() => {
    undoNextPatient();
    dismissUndo();
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, [undoNextPatient, dismissUndo]);

  // (QR animation removed — simplified to icon button)

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning', language);
    if (hour < 17) return t('goodAfternoon', language);
    return t('goodEvening', language);
  }, [language]);

  const [selectedPatient, setSelectedPatient] = useState<QueuePatient | null>(null);

  // Exit app confirmation on back — only when this screen is focused
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

  const currentPatient = queue.find((p) => p.status === 'seeing');
  const waitingPatients = queue.filter((p) => p.status === 'waiting');
  const seenPatients = queue.filter((p) => p.status === 'done');
  const onHoldPatients = queue.filter((p) => p.status === 'on_hold');

  const avgTime = useMemo(() => {
    if (seenPatients.length === 0) return 0;
    return Math.round(
      seenPatients.reduce((acc, p) => {
        if (p.startedAt) {
          return acc + 10; // mock avg
        }
        return acc + 9;
      }, 0) / seenPatients.length
    );
  }, [seenPatients]);

  const minutesSinceStart = currentPatient?.startedAt
    ? Math.round((Date.now() - new Date(currentPatient.startedAt).getTime()) / 60000)
    : 0;

  // The next patient who'll be called — arrived first, then first waiting
  const nextUpPatient = useMemo(() => {
    const arrived = waitingPatients.find((p) => !!p.arrivedAt);
    return arrived || waitingPatients[0] || null;
  }, [waitingPatients]);

  const arrivedCount = useMemo(() => waitingPatients.filter((p) => !!p.arrivedAt).length, [waitingPatients]);

  const handleNextPatientPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setShowConfirmModal(true);
  };

  const handleConfirmNextPatient = async () => {
    setShowConfirmModal(false);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    nextPatient();
    startUndoTimer();
  };

  const handleSkipAndHold = () => {
    setShowConfirmModal(false);
    setShowSkipHoldConfirm(true);
  };

  const handleConfirmSkipAndHold = async () => {
    setShowSkipHoldConfirm(false);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    skipAndHold();
  };

  const handleRecall = (id: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    recallPatient(id);
  };

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const getWaitMinutes = (patient: QueuePatient) =>
    Math.round((Date.now() - new Date(patient.joinedAt).getTime()) / 60000);

  const today = new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Bar — pill chip + QR + settings */}
        <View style={styles.topBar}>
          {/* Profile pill chip */}
          <TouchableOpacity
            onPress={() => router.push('/doctor/profile')}
            activeOpacity={0.8}
            style={styles.profilePill}
          >
            <Image
              source={doctorProfile?.profileImage ? { uri: doctorProfile.profileImage } : getDefaultAvatar('doctor', 'male')}
              style={styles.pillAvatar}
            />
            <View style={styles.pillTextWrap}>
              <Text style={styles.pillName} numberOfLines={1}>
                {doctorProfile?.name?.split(' ')[0] || 'Doctor'}
              </Text>
              <Text style={styles.pillGreeting} numberOfLines={1}>{greeting}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.topActions}>
            {/* QR code */}
            <TouchableOpacity
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                router.push('/doctor/qr');
              }}
              style={styles.settingsTopBtn}
              activeOpacity={0.7}
            >
              <QrCodeIcon size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity
              onPress={() => router.push('/doctor/settings')}
              activeOpacity={0.7}
              style={styles.settingsTopBtn}
            >
              <Gear size={22} color={colors.primary} weight="duotone" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Card */}
        <PlatformCard style={styles.statusCard} accentColor={colors.primary} accentSide="top">
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isClinicOpen ? '#22C55E' : '#EF4444' }]} />
            <Text style={styles.statusText}>
              {isClinicOpen
                ? t('currentlyOpen', language)
                : t('currentlyClosed', language)}
            </Text>
          </View>
          <Text style={styles.dateText}>{today}</Text>
        </PlatformCard>

        {/* Emergency Pause Toggle */}
        <View style={styles.pauseToggleCard}>
          <View style={styles.pauseToggleLeft}>
            <View style={[styles.pauseToggleDot, isQueuePaused && styles.pauseToggleDotActive]} />
            <View>
              <Text style={[styles.pauseToggleLabel, isQueuePaused && styles.pauseToggleLabelActive]}>
                {t('pauseQueue' as any, language)}
              </Text>
              <Text style={styles.pauseToggleStatus}>
                {isQueuePaused ? t('queuePaused' as any, language) : t('queueActive' as any, language)}
              </Text>
            </View>
          </View>
          <Switch
            value={isQueuePaused}
            onValueChange={toggleQueuePaused}
            trackColor={{ false: colors.border, true: '#EF4444' }}
            thumbColor={isQueuePaused ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor={colors.border}
          />
        </View>

        {/* Now Seeing */}
        {currentPatient ? (
          <PlatformCard style={styles.nowSeeingCard}>
            <Text style={styles.sectionLabel}>{t('nowSeeing', language)}</Text>
            <View style={styles.nowSeeingContent}>
              <Text style={styles.tokenLarge}>#{currentPatient.tokenNumber}</Text>
              <Text style={styles.patientName}>{currentPatient.name}</Text>
              <View style={styles.symptomTag}>
                <Text style={styles.symptomTagText}>
                  {t(currentPatient.symptomKey as any, language)}
                </Text>
              </View>
              {currentPatient.patientNotes ? (
                <View style={styles.patientNotesBox}>
                  <Text style={styles.patientNotesLabel}>{t('preConsultNotesLabel', language)}</Text>
                  <Text style={styles.patientNotesText}>{currentPatient.patientNotes}</Text>
                </View>
              ) : null}
              <Text style={styles.timeStarted}>
                {t('started', language)} {minutesSinceStart} {t('minsAgo', language)}
              </Text>
            </View>
          </PlatformCard>
        ) : (
          <PlatformCard style={styles.nowSeeingCard}>
            <Text style={styles.sectionLabel}>{t('nowSeeing', language)}</Text>
            <View style={styles.emptyState}>
              <Hospital size={36} color={colors.textSecondary} weight="duotone" />
              <Text style={styles.emptyText}>{t('noPatients', language)}</Text>
              <Text style={styles.emptySubtext}>{t('noPatientsDesc', language)}</Text>
            </View>
          </PlatformCard>
        )}

        {/* ── Big Next Patient Button ── */}
        {waitingPatients.length > 0 ? (
          <TouchableOpacity
            style={styles.nextBtn}
            activeOpacity={0.8}
            onPress={handleNextPatientPress}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.nextBtnTitle}>
                {currentPatient
                  ? t('nextPatient', language)
                  : language === 'hi' ? 'शुरू करें' : 'Start'}
              </Text>
              <FastForward size={24} color="#FFFFFF" weight="bold" />
            </View>
            <Text style={styles.nextBtnSub}>
              {currentPatient
                ? t('markSeenCallNext' as any, language)
                : nextUpPatient
                  ? (language === 'hi'
                    ? `${nextUpPatient.name} को बुलाएं`
                    : `Call ${nextUpPatient.name}`)
                  : ''}
            </Text>
            {nextUpPatient && (
              <View style={styles.nextBtnPreview}>
                <View style={styles.nextBtnPreviewToken}>
                  <Text style={styles.nextBtnPreviewTokenText}>#{nextUpPatient.tokenNumber}</Text>
                </View>
                <Text style={styles.nextBtnPreviewName} numberOfLines={1}>{nextUpPatient.name}</Text>
                {nextUpPatient.arrivedAt && (
                  <View style={styles.nextBtnArrivedPill}>
                    <View style={styles.nextBtnArrivedDot} />
                    <Text style={styles.nextBtnArrivedText}>{t('arrived' as any, language)}</Text>
                  </View>
                )}
              </View>
            )}
            {nextUpPatient?.patientNotes ? (
              <Text style={styles.nextBtnNotes} numberOfLines={2}>
                📋 {nextUpPatient.patientNotes}
              </Text>
            ) : null}
          </TouchableOpacity>
        ) : (
          <PlatformCard style={styles.allDoneCard}>
            <Star size={32} color={colors.primary} weight="duotone" />
            <Text style={styles.allDoneText}>{t('allDoneForNow' as any, language)}</Text>
          </PlatformCard>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <PlatformCard style={styles.statCard}>
            <Queue size={22} color={colors.primary} weight="duotone" />
            <Text style={styles.statValue}>{waitingPatients.length}</Text>
            <Text style={styles.statLabel}>{t('waiting', language)}</Text>
          </PlatformCard>
          <PlatformCard style={styles.statCard}>
            <CheckCircle size={22} color={colors.primary} weight="duotone" />
            <Text style={styles.statValue}>{seenPatients.length}</Text>
            <Text style={styles.statLabel}>{t('seenToday', language)}</Text>
          </PlatformCard>
          <PlatformCard style={styles.statCard}>
            <Clock size={22} color={colors.primary} weight="duotone" />
            <Text style={styles.statValue}>{avgTime || 9}</Text>
            <Text style={styles.statLabel}>{t('avgTime', language)}</Text>
          </PlatformCard>
        </View>

        {/* Queue List */}
        {waitingPatients.length > 0 && (
          <View style={styles.queueSection}>
            <View style={styles.queueTitleRow}>
              <Text style={styles.queueTitle}>
                {t('queue', language)} ({waitingPatients.length})
              </Text>
              {arrivedCount > 0 && (
                <View style={styles.arrivedCountPill}>
                  <View style={styles.arrivedCountDot} />
                  <Text style={styles.arrivedCountText}>
                    {arrivedCount} {t('arrived' as any, language).toLowerCase()}
                  </Text>
                </View>
              )}
            </View>
            {waitingPatients.map((patient) => {
              const hasArrived = !!patient.arrivedAt;
              return (
                <TouchableOpacity
                  key={patient.id}
                  activeOpacity={0.7}
                  onPress={() => setSelectedPatient(patient)}
                >
                  <PlatformCard style={styles.queueItem}>
                    <View style={styles.queueItemRow}>
                      <View style={styles.tokenBadge}>
                        <Text style={styles.tokenBadgeText}>#{patient.tokenNumber}</Text>
                      </View>
                      <View style={styles.queueItemInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.queueItemName}>{patient.name}</Text>
                        </View>
                        <Text style={styles.queueItemSymptom}>
                          {t(patient.symptomKey as any, language)}
                        </Text>
                      </View>
                      <View style={[
                        styles.arrivalBadge,
                        hasArrived ? styles.arrivalBadgeGreen : styles.arrivalBadgeGray,
                      ]}>
                        <View style={[
                          styles.arrivalBadgeDot,
                          hasArrived ? styles.arrivalBadgeDotGreen : styles.arrivalBadgeDotGray,
                        ]} />
                        <Text style={[
                          styles.arrivalBadgeText,
                          hasArrived ? styles.arrivalBadgeTextGreen : styles.arrivalBadgeTextGray,
                        ]}>
                          {hasArrived
                            ? t('arrived' as any, language)
                            : t('notYetArrived' as any, language)}
                        </Text>
                      </View>
                    </View>
                  </PlatformCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* On Hold Section */}
        {onHoldPatients.length > 0 && (
          <View style={styles.onHoldSection}>
            <TouchableOpacity
              style={styles.onHoldHeader}
              activeOpacity={0.7}
              onPress={() => setOnHoldExpanded((v) => !v)}
            >
              <View style={styles.onHoldHeaderLeft}>
                <View style={styles.onHoldDot} />
                <Text style={styles.onHoldTitle}>
                  {language === 'hi' ? 'होल्ड पर' : 'On Hold'} ({onHoldPatients.length})
                </Text>
              </View>
              <Text style={styles.onHoldChevron}>
                {onHoldExpanded ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            {onHoldExpanded && (
              <View>
                <Text style={styles.onHoldSubtitle}>
                  {language === 'hi'
                    ? 'ये मरीज उपस्थित नहीं हुए। "वापस बुलाएं" दबाकर कतार में सबसे आगे करें।'
                    : 'These patients missed their turn. Tap "Recall" to move them to the top of the queue.'}
                </Text>
                {onHoldPatients.map((patient) => (
                  <PlatformCard key={patient.id} style={styles.onHoldItem}>
                    <View style={styles.onHoldItemRow}>
                      <View style={styles.onHoldTokenBadge}>
                        <Text style={styles.onHoldTokenText}>#{patient.tokenNumber}</Text>
                      </View>
                      <View style={styles.onHoldItemInfo}>
                        <Text style={styles.onHoldName}>{patient.name}</Text>
                        <Text style={styles.onHoldSymptom}>
                          {t(patient.symptomKey as any, language)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.recallBtn}
                        activeOpacity={0.8}
                        onPress={() => handleRecall(patient.id)}
                      >
                        <Text style={styles.recallBtnText}>
                          {language === 'hi' ? 'वापस बुलाएं' : 'Recall'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </PlatformCard>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Patient Detail Modal */}
      <Modal
        visible={!!selectedPatient}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPatient(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPatient(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {selectedPatient && (
              <>
                <View style={styles.modalTokenRow}>
                  <View style={[
                    styles.modalTokenBadge,
                    selectedPatient.status === 'seeing' && { backgroundColor: colors.warning },
                    selectedPatient.status === 'done' && { backgroundColor: colors.success },
                  ]}>
                    <Text style={[
                      styles.modalTokenText,
                      (selectedPatient.status === 'seeing' || selectedPatient.status === 'done') && { color: '#FFFFFF' },
                    ]}>
                      #{selectedPatient.tokenNumber}
                    </Text>
                  </View>
                  <View style={[
                    styles.modalStatusPill,
                    (selectedPatient.status === 'waiting' && selectedPatient.arrivedAt) && { backgroundColor: 'rgba(76,175,80,0.12)' },
                    selectedPatient.status === 'seeing' && { backgroundColor: 'rgba(255,179,0,0.12)' },
                    selectedPatient.status === 'done' && { backgroundColor: 'rgba(76,175,80,0.12)' },
                  ]}>
                    <Text style={[
                      styles.modalStatusText,
                      (selectedPatient.status === 'waiting' && selectedPatient.arrivedAt) && { color: colors.success },
                      selectedPatient.status === 'seeing' && { color: colors.warning },
                      selectedPatient.status === 'done' && { color: colors.success },
                    ]}>
                      {selectedPatient.status === 'waiting'
                        ? (selectedPatient.arrivedAt
                          ? t('arrived' as any, language)
                          : t('waiting' as TranslationKey, language))
                        : selectedPatient.status === 'seeing'
                        ? t('viewing' as TranslationKey, language)
                        : t('done' as TranslationKey, language)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalNameRow}>
                  <Text style={styles.modalName}>{selectedPatient.name}</Text>
                  {selectedPatient.status === 'waiting' && !selectedPatient.arrivedAt && (
                    <View style={[styles.arrivalBadge, styles.arrivalBadgeGray]}>
                      <View style={[styles.arrivalBadgeDot, styles.arrivalBadgeDotGray]} />
                      <Text style={[styles.arrivalBadgeText, styles.arrivalBadgeTextGray]}>
                        {t('notYetArrived' as any, language)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalSymptomTag}>
                  <Text style={styles.modalSymptomText}>
                    {t(selectedPatient.symptomKey as TranslationKey, language)}
                  </Text>
                </View>

                <View style={styles.modalDetailGrid}>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>
                      {language === 'hi' ? 'शामिल हुए' : 'Joined'}
                    </Text>
                    <Text style={styles.modalDetailValue}>
                      {formatTime(selectedPatient.joinedAt)}
                    </Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>
                      {language === 'hi' ? 'प्रतीक्षा' : 'Wait Time'}
                    </Text>
                    <Text style={styles.modalDetailValue}>
                      {getWaitMinutes(selectedPatient)} {t('min' as TranslationKey, language)}
                    </Text>
                  </View>
                  {selectedPatient.startedAt && (
                    <View style={styles.modalDetailItem}>
                      <Text style={styles.modalDetailLabel}>
                        {language === 'hi' ? 'शुरू' : 'Started'}
                      </Text>
                      <Text style={styles.modalDetailValue}>
                        {formatTime(selectedPatient.startedAt)}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedPatient(null)}
                >
                  <Text style={styles.modalCloseBtnText}>
                    {language === 'hi' ? 'बंद करें' : 'Close'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Confirmation Modal ── */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <TouchableOpacity
          style={styles.confirmOverlay}
          activeOpacity={1}
          onPress={() => setShowConfirmModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.confirmBox}>
            <View style={styles.confirmIconCircle}>
              <FastForward size={28} color={colors.primary} weight="bold" />
            </View>
            <Text style={styles.confirmTitle}>
              {language === 'hi' ? 'वर्तमान मरीज को देखा गया?' : 'Mark current patient as Seen?'}
            </Text>
            <Text style={styles.confirmMessage}>
              {currentPatient && nextUpPatient
                ? (language === 'hi'
                  ? `${currentPatient.name} को पूर्ण चिह्नित किया जाएगा और ${nextUpPatient.name} को अगला बुलाया जाएगा।`
                  : `${currentPatient.name} will be marked as completed and ${nextUpPatient.name} will be called next.`)
                : !currentPatient && nextUpPatient
                  ? (language === 'hi'
                    ? `${nextUpPatient.name} को बुलाया जाएगा।`
                    : `${nextUpPatient.name} will be called next.`)
                  : (language === 'hi'
                    ? 'अगले मरीज को बुलाएं।'
                    : 'Call the next patient.')}
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.confirmCancelText}>
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmYesBtn}
                onPress={handleConfirmNextPatient}
              >
                <Text style={styles.confirmYesText}>
                  {language === 'hi' ? 'हाँ, अगला बुलाएं' : 'Yes, Call Next'}
                </Text>
              </TouchableOpacity>
            </View>
            {currentPatient && (
              <TouchableOpacity
                style={styles.skipHoldBtn}
                onPress={handleSkipAndHold}
              >
                <Text style={styles.skipHoldBtnText}>
                  {language === 'hi' ? 'स्किप करें और होल्ड पर रखें' : 'Skip & Hold'}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Skip & Hold Confirmation Modal ── */}
      <Modal
        visible={showSkipHoldConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSkipHoldConfirm(false)}
      >
        <TouchableOpacity
          style={styles.confirmOverlay}
          activeOpacity={1}
          onPress={() => setShowSkipHoldConfirm(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.confirmBox}>
            <View style={[styles.confirmIconCircle, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <Text style={styles.confirmIconText}>⏸️</Text>
            </View>
            <Text style={styles.confirmTitle}>
              {language === 'hi' ? 'होल्ड पर रखें?' : 'Place on Hold?'}
            </Text>
            <Text style={styles.confirmMessage}>
              {currentPatient
                ? (language === 'hi'
                  ? `${currentPatient.name} को होल्ड पर रखा जाएगा और अगले मरीज को बुलाया जाएगा।`
                  : `${currentPatient.name} will be placed on hold and the next patient will be called.`)
                : (language === 'hi' ? 'मरीज होल्ड पर रखा जाएगा।' : 'Patient will be placed on hold.')}
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setShowSkipHoldConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmYesBtn, { backgroundColor: '#D97706' }]}
                onPress={handleConfirmSkipAndHold}
              >
                <Text style={styles.confirmYesText}>
                  {language === 'hi' ? 'होल्ड पर रखें' : 'Skip & Hold'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Undo Toast ── */}
      {showUndo && (
        <Animated.View style={[styles.undoToast, { transform: [{ translateY: undoSlideAnim }] }]}>
          <Animated.View
            style={[
              styles.undoProgress,
              {
                width: undoProgressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          <View style={styles.undoContent}>
            <View style={styles.undoTextCol}>
              <Text style={styles.undoTitle}>
                {language === 'hi' ? 'अगला मरीज बुलाया गया' : 'Next patient called'}
              </Text>
              <Text style={styles.undoSub}>
                {language === 'hi' ? `${undoSecondsLeft}s में वापस करें` : `Undo in ${undoSecondsLeft}s`}
              </Text>
            </View>
            <TouchableOpacity style={styles.undoBtn} onPress={handleUndoPress}>
              <Text style={styles.undoBtnText}>
                {language === 'hi' ? 'वापस करें' : 'Undo'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={dismissUndo} style={styles.undoDismiss}>
              <Text style={styles.undoDismissText}>✕</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} activeOpacity={0.7}>
          <ListBullets size={22} color={colors.primary} weight="duotone" />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>{t('queue', language)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} activeOpacity={0.7} onPress={() => router.push('/doctor/analytics')}>
          <ChartBar size={22} color={colors.textSecondary} weight="regular" />
          <Text style={styles.tabLabel}>{t('analytics', language)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} activeOpacity={0.7} onPress={() => router.push('/doctor/profile')}>
          <User size={22} color={colors.textSecondary} weight="regular" />
          <Text style={styles.tabLabel}>{t('you' as any, language)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
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
    maxWidth: 220,
  },
  pillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
    overflow: 'hidden',
    backgroundColor: '#F0F9FF',
  } as any,
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
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsTopBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // (QR styles removed — uses settingsTopBtn now)
  topAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  statusCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight,
  },
  // Emergency Pause Toggle
  pauseToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  pauseToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: spacing.md,
  },
  pauseToggleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  pauseToggleDotActive: {
    backgroundColor: '#EF4444',
  },
  pauseToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pauseToggleLabelActive: {
    color: '#EF4444',
  },
  pauseToggleStatus: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    ...typography.h4,
    color: colors.primary,
  },
  dateText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  nowSeeingCard: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  nowSeeingContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tokenLarge: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  patientName: {
    ...typography.h4,
    marginBottom: spacing.sm,
  },
  symptomTag: {
    backgroundColor: colors.cardHighlight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  symptomTagText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  timeStarted: {
    ...typography.caption,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    textAlign: 'center',
  },
  // Next Patient Button
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 20,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.elevated,
  },
  nextBtnTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  nextBtnSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  nextBtnPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  nextBtnPreviewToken: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nextBtnPreviewTokenText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nextBtnPreviewName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  nextBtnArrivedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  nextBtnArrivedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1B5E20',
  },
  nextBtnArrivedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1B5E20',
  },
  nextBtnNotes: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 17,
    marginTop: 8,
    fontStyle: 'italic',
  },
  patientNotesBox: {
    backgroundColor: 'rgba(255,179,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,179,0,0.35)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 10,
    alignSelf: 'stretch',
  },
  patientNotesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  patientNotesText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  allDoneCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  allDoneIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  allDoneText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.small,
    marginTop: 2,
  },
  queueSection: {
    marginTop: spacing.lg,
  },
  queueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  queueTitle: {
    ...typography.h4,
  },
  arrivedCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  arrivedCountDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  arrivedCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  queueItem: {
    marginBottom: spacing.sm,
    paddingVertical: 12,
  },
  queueItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenBadge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tokenBadgeText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  queueItemInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrivedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  queueItemName: {
    ...typography.body,
    fontWeight: '500',
  },
  queueItemSymptom: {
    ...typography.caption,
    marginTop: 2,
  },
  arrivalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  arrivalBadgeGreen: {
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
  },
  arrivalBadgeGray: {
    backgroundColor: 'rgba(158, 158, 158, 0.10)',
  },
  arrivalBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },
  arrivalBadgeDotGreen: {
    backgroundColor: '#4CAF50',
  },
  arrivalBadgeDotGray: {
    backgroundColor: '#9E9E9E',
  },
  arrivalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  arrivalBadgeTextGreen: {
    color: '#4CAF50',
  },
  arrivalBadgeTextGray: {
    color: '#9E9E9E',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  modalTokenBadge: {
    backgroundColor: colors.cardHighlight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  modalTokenText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  modalStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(158,158,158,0.12)',
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalName: {
    ...typography.h3,
  },
  modalSymptomTag: {
    backgroundColor: colors.cardHighlight,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  modalSymptomText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  modalDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  modalDetailItem: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minWidth: '45%',
    flex: 1,
  },
  modalDetailLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  modalDetailValue: {
    ...typography.body,
    fontWeight: '600',
  },
  modalCloseBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingBottom: 24,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
    opacity: 0.5,
  },
  tabActive: {
    opacity: 1,
  },
  tabLabel: {
    ...typography.small,
    fontSize: 11,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Confirmation Modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  confirmBox: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  confirmIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  confirmIconText: {
    fontSize: 28,
  },
  confirmTitle: {
    ...typography.h4,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  confirmMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmYesBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmYesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Skip & Hold button (outline)
  skipHoldBtn: {
    width: '100%',
    marginTop: spacing.sm,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#D97706',
    alignItems: 'center',
  },
  skipHoldBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  // On Hold section
  onHoldSection: {
    marginTop: spacing.xl,
  },
  onHoldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  onHoldHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onHoldDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  onHoldTitle: {
    ...typography.h4,
    color: '#D97706',
  },
  onHoldChevron: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
  },
  onHoldSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  onHoldItem: {
    marginBottom: spacing.sm,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.2)',
    backgroundColor: 'rgba(245,158,11,0.04)',
  },
  onHoldItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onHoldTokenBadge: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.25)',
  },
  onHoldTokenText: {
    ...typography.body,
    fontWeight: '700',
    color: '#D97706',
  },
  onHoldItemInfo: {
    flex: 1,
  },
  onHoldName: {
    ...typography.body,
    fontWeight: '500',
  },
  onHoldSymptom: {
    ...typography.caption,
    marginTop: 2,
  },
  recallBtn: {
    backgroundColor: '#D97706',
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recallBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Undo Toast
  undoToast: {
    position: 'absolute',
    bottom: 80,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.elevated,
  },
  undoProgress: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  undoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  undoTextCol: {
    flex: 1,
  },
  undoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  undoSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  undoBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  undoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  undoDismiss: {
    padding: 4,
  },
  undoDismissText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
});

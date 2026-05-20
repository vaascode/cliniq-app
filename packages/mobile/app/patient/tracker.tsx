import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { t, type TranslationKey } from '../../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { MapPin, Lightning, Coffee, Bell, LightbulbFilament, CheckCircle, ArrowLeft } from '../../lib/icons';
import { PlatformCard } from '../../components/PlatformCard';

export default function TrackerScreen() {
  const router = useRouter();
  const { language, patientToken, cancelToken, queue, hasConfirmedArrival, submitPatientNotes, isQueuePaused, currentPatientStartedAt, doctorProfile } = useApp();
  const [notesText, setNotesText] = useState('');
  const [notesSubmitted, setNotesSubmitted] = useState(false);
  const [notesEditing, setNotesEditing] = useState(false);
  const notesCardAnim = useRef(new Animated.Value(0)).current;
  const [fadeAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));

  // Live-ticking clock for dynamic ETA recalculation (every 15s)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  // Check if this patient is on hold
  const isOnHold = useMemo(() => {
    if (!patientToken) return false;
    const myEntry = queue.find((p) => p.tokenNumber === patientToken.tokenNumber);
    return myEntry?.status === 'on_hold';
  }, [queue, patientToken]);

  // Derive live stats from the shared queue with dynamic ETA
  const liveStats = useMemo(() => {
    if (!patientToken) return { peopleAhead: 0, estimatedMins: 0, totalWaiting: 0, arrivedCount: 0, overtimeMins: 0 };

    const waitingPatients = queue.filter((p) => p.status === 'waiting');
    const myIndex = waitingPatients.findIndex((p) => p.tokenNumber === patientToken.tokenNumber);

    // People ahead = everyone before me in the waiting list
    const peopleAhead = myIndex >= 0 ? myIndex : waitingPatients.length;
    const arrivedCount = waitingPatients.filter((p) => !!p.arrivedAt).length;

    // Dynamic ETA: (peopleAhead * avgConsult) + max(0, currentOvertime - avgConsult)
    const avgConsult = doctorProfile?.consultDuration ?? 10;
    const baseEta = peopleAhead * avgConsult;

    let overtimeMins = 0;
    if (currentPatientStartedAt) {
      const elapsedMins = (now - new Date(currentPatientStartedAt).getTime()) / 60000;
      overtimeMins = Math.max(0, elapsedMins - avgConsult);
    }

    const estimatedMins = Math.round(baseEta + overtimeMins);

    return {
      peopleAhead,
      estimatedMins,
      totalWaiting: waitingPatients.length,
      arrivedCount,
      overtimeMins: Math.round(overtimeMins),
    };
  }, [queue, patientToken, now, currentPatientStartedAt, doctorProfile]);

  const totalInQueue = liveStats.totalWaiting + 1;
  const progress = Math.max(0, 1 - liveStats.peopleAhead / totalInQueue);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 30,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const isFast = liveStats.estimatedMins < 20;

  // Animate notes card in when patient is near front
  useEffect(() => {
    if (liveStats.peopleAhead <= 2 && !isOnHold) {
      Animated.spring(notesCardAnim, {
        toValue: 1,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else {
      notesCardAnim.setValue(0);
    }
  }, [liveStats.peopleAhead, isOnHold]);

  const handleSubmitNotes = () => {
    if (!patientToken || !notesText.trim()) return;
    Keyboard.dismiss();
    submitPatientNotes(patientToken.tokenNumber, notesText.trim());
    setNotesSubmitted(true);
    setNotesEditing(false);
  };

  const getTimelineStatus = (step: number) => {
    const ahead = liveStats.peopleAhead;
    if (step === 0) return 'done'; // Token generated
    if (step === 1) return 'done'; // Queue joined
    if (step === 2) {
      // Arrived at clinic
      if (hasConfirmedArrival) return 'done';
      return 'current';
    }
    if (step === 3) {
      // Waiting in queue
      if (!hasConfirmedArrival) return 'pending';
      if (ahead > 2) return 'current';
      return 'done';
    }
    if (step === 4) {
      // Your turn soon
      if (ahead <= 2 && ahead > 0) return 'current';
      if (ahead === 0) return 'done';
      return 'pending';
    }
    if (step === 5) {
      // Your turn
      if (ahead === 0) return 'current';
      return 'pending';
    }
    return 'pending';
  };

  const handleCancel = () => {
    Alert.alert(
      language === 'hi' ? 'टोकन रद्द करें?' : 'Cancel Token?',
      language === 'hi'
        ? 'क्या आप सुनिश्चित हैं?'
        : 'Are you sure you want to cancel?',
      [
        { text: language === 'hi' ? 'नहीं' : 'No', style: 'cancel' },
        {
          text: language === 'hi' ? 'हाँ' : 'Yes',
          style: 'destructive',
          onPress: () => {
            if (patientToken) cancelToken(patientToken.tokenNumber);
            router.replace('/patient/scan');
          },
        },
      ]
    );
  };

  const circleSize = 200;
  const strokeWidth = 10;

  if (!patientToken) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No active token</Text>
        </View>
      </SafeAreaView>
    );
  }

  const timelineSteps = [
    { step: 0, labelKey: 'tokenGenerated' },
    { step: 1, labelKey: 'queueJoined' },
    {
      step: 2,
      labelKey: hasConfirmedArrival ? 'arrivedAtClinic' : 'scanQrToArrive',
    },
    { step: 3, labelKey: 'waitingStatus' },
    { step: 4, labelKey: 'yourTurnSoon' },
    { step: 5, labelKey: 'done' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.primary} weight="bold" />
          </TouchableOpacity>

          <Text style={styles.header}>{t('liveQueueStatus', language)}</Text>
          <Text style={styles.clinicInfo}>
            {patientToken.clinicName} • {patientToken.doctorName}
          </Text>

          {/* ── Queue Paused Emergency Banner ── */}
          {isQueuePaused && (
            <View style={styles.queuePausedBanner}>
              <Text style={styles.queuePausedIcon}>🚨</Text>
              <Text style={styles.queuePausedText}>
                {t('queuePausedAlert' as any, language)}
              </Text>
            </View>
          )}

          {/* ── On Hold Warning Banner ── */}
          {isOnHold && (
            <View style={styles.onHoldBanner}>
              <Text style={styles.onHoldBannerIcon}>⚠️</Text>
              <View style={styles.onHoldBannerText}>
                <Text style={styles.onHoldBannerTitle}>
                  {language === 'hi' ? 'आपकी बारी छूट गई' : 'You missed your turn'}
                </Text>
                <Text style={styles.onHoldBannerMsg}>
                  {language === 'hi'
                    ? 'कृपया रिसेप्शनिस्ट से बात करें और वापस बुलवाएं।'
                    : 'Please speak to the receptionist to be recalled.'}
                </Text>
              </View>
            </View>
          )}

          {/* ── Pre-Consultation Notes Card ── */}
          {liveStats.peopleAhead <= 2 && !isOnHold && (
            <Animated.View
              style={[
                styles.notesCard,
                {
                  opacity: notesCardAnim,
                  transform: [
                    {
                      translateY: notesCardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {notesSubmitted && !notesEditing ? (
                <View style={styles.notesSubmittedRow}>
                  <CheckCircle size={20} color="#4CAF50" weight="fill" />
                  <Text style={styles.notesSubmittedText}>{t('preConsultSubmitted', language)}</Text>
                  <TouchableOpacity
                    style={styles.notesEditBtn}
                    onPress={() => setNotesEditing(true)}
                  >
                    <Text style={styles.notesEditBtnText}>{t('preConsultEditBtn', language)}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.notesCardTitle}>{t('preConsultTitle', language)}</Text>
                  <Text style={styles.notesCardSubtitle}>{t('preConsultSubtitle', language)}</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder={t('preConsultPlaceholder', language)}
                    placeholderTextColor={colors.textSecondary}
                    value={notesText}
                    onChangeText={setNotesText}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  <TouchableOpacity
                    style={[
                      styles.notesSubmitBtn,
                      !notesText.trim() && { opacity: 0.5 },
                    ]}
                    onPress={handleSubmitNotes}
                    disabled={!notesText.trim()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.notesSubmitBtnText}>{t('preConsultSubmit', language)}</Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          )}

          {/* ── Hint Banner ── */}
          <View style={styles.hintBanner}>
            <LightbulbFilament size={16} color={colors.primary} weight="duotone" />
            <Text style={styles.hintText}>
              {language === 'hi'
                ? 'टोकन बन गया! क्लिनिक आएं और पहुँचने पर "मैं क्लिनिक पर हूँ" दबाएं।'
                : "Token generated! Come to clinic and tap 'I'm at the Clinic' when you arrive."}
            </Text>
          </View>

          {/* Live Stats Row */}
          <View style={styles.liveStatsRow}>
            <View style={styles.liveStat}>
              <Text style={styles.liveStatValue}>{liveStats.totalWaiting}</Text>
              <Text style={styles.liveStatLabel}>{t('waiting' as TranslationKey, language)}</Text>
            </View>
            <View style={[styles.liveStat, styles.liveStatHighlight]}>
              <Text style={[styles.liveStatValue, { color: colors.primary }]}>{liveStats.peopleAhead}</Text>
              <Text style={styles.liveStatLabel}>{t('peopleAheadLabel', language)}</Text>
            </View>
            <View style={styles.liveStat}>
              <Text style={styles.liveStatValue}>{liveStats.arrivedCount}</Text>
              <Text style={styles.liveStatLabel}>{t('arrived' as TranslationKey, language)}</Text>
            </View>
          </View>

          {/* Progress Circle */}
          <View style={styles.circleContainer}>
            <PlatformCard style={styles.circleCard}>
              <View style={styles.circleOuter}>
                <View
                  style={[
                    styles.circleTrack,
                    {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                      borderWidth: strokeWidth,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.circleProgress,
                    {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                      borderWidth: strokeWidth,
                      borderColor: colors.primary,
                      borderTopColor: progress > 0.25 ? colors.primary : 'transparent',
                      borderRightColor: progress > 0.5 ? colors.primary : 'transparent',
                      borderBottomColor: progress > 0.75 ? colors.primary : 'transparent',
                      borderLeftColor: progress > 0 ? colors.primary : 'transparent',
                      transform: [{ rotate: '-90deg' }],
                    },
                  ]}
                />
                <View style={styles.circleCenter}>
                  <Text style={styles.positionNumber}>{liveStats.peopleAhead}</Text>
                  <Text style={styles.positionLabel}>{t('peopleAheadLabel', language)}</Text>
                </View>
              </View>
            </PlatformCard>
          </View>

          {/* Your arrival status */}
          {hasConfirmedArrival ? (
            <View style={styles.arrivedBanner}>
              <View style={styles.arrivedBannerDot} />
              <Text style={styles.arrivedBannerText}>
                {t('arrivalConfirmed' as TranslationKey, language)}
              </Text>
              <Text style={styles.arrivedBannerSub}>
                {language === 'hi' ? 'डॉक्टर को सूचित किया गया' : 'Doctor has been notified'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.arriveNowBanner}
              activeOpacity={0.8}
              onPress={() => router.push('/patient/confirm-arrival')}
            >
              <MapPin size={18} color="#FFFFFF" weight="fill" />
              <View style={styles.arriveNowContent}>
                <Text style={styles.arriveNowTitle}>{t('imAtClinic' as TranslationKey, language)}</Text>
                <Text style={styles.arriveNowSub}>
                  {language === 'hi' ? 'QR स्कैन करें और प्राथमिकता पाएं' : 'Scan QR to get priority'}
                </Text>
              </View>
              <Text style={styles.arriveNowArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* Status Card */}
          <PlatformCard
            style={{
              ...styles.statusCard,
              backgroundColor: liveStats.overtimeMins > 0
                ? 'rgba(245,158,11,0.08)'
                : isFast
                  ? 'rgba(22,101,52,0.06)'
                  : 'rgba(68,138,255,0.08)',
            }}
          >
            {liveStats.overtimeMins > 0
              ? <Coffee size={20} color={'#D97706'} weight="fill" />
              : isFast
                ? <Lightning size={20} color={'#F59E0B'} weight="fill" />
                : <Coffee size={20} color={colors.textSecondary} weight="duotone" />}
            <View style={styles.statusInfo}>
              <Text style={styles.statusTime}>
                ~{liveStats.estimatedMins} {t('minsRemaining', language)}
              </Text>
              <Text style={styles.statusMessage}>
                {liveStats.overtimeMins > 0
                  ? (language === 'hi'
                    ? `डॉक्टर मौजूदा मरीज़ पर +${liveStats.overtimeMins} मिनट ओवरटाइम`
                    : `Doctor running +${liveStats.overtimeMins}min overtime on current patient`)
                  : isFast
                    ? t('doctorMovingFast', language)
                    : t('queueSlow', language)}
              </Text>
            </View>
          </PlatformCard>

          {/* Timeline */}
          <View style={styles.timeline}>
            {timelineSteps.map((item, index) => {
              const status = getTimelineStatus(item.step);
              const isArrivalStep = item.step === 2;
              return (
                <View key={item.step} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        status === 'done' && styles.timelineDotDone,
                        status === 'current' && styles.timelineDotCurrent,
                      ]}
                    >
                      <Text style={styles.timelineDotText}>
                        {status === 'done' ? '✓' : status === 'current' ? '●' : '○'}
                      </Text>
                    </View>
                    {index < timelineSteps.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          status === 'done' && styles.timelineLineDone,
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineTextWrap}>
                    <Text
                      style={[
                        styles.timelineText,
                        status === 'current' && styles.timelineTextCurrent,
                        status === 'done' && styles.timelineTextDone,
                      ]}
                    >
                      {isArrivalStep
                        ? (hasConfirmedArrival
                          ? (language === 'hi' ? 'क्लिनिक पहुंचे ✓' : 'Arrived at Clinic ✓')
                          : (language === 'hi' ? 'क्लिनिक पर QR स्कैन करें' : 'Scan QR at Clinic'))
                        : t(item.labelKey as TranslationKey, language)}
                    </Text>
                    {isArrivalStep && hasConfirmedArrival && (
                      <View style={styles.timelineArrivedPill}>
                        <View style={styles.timelineArrivedDot} />
                        <Text style={styles.timelineArrivedText}>
                          {t('arrived' as TranslationKey, language)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Notification Info */}
          <PlatformCard style={styles.alertCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Bell size={14} color={colors.primary} weight="duotone" /><Text style={styles.alertText}>{t('alertAt5', language)}</Text></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}><Bell size={14} color={colors.primary} weight="duotone" /><Text style={styles.alertText}>{t('alertAt2', language)}</Text></View>
          </PlatformCard>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>{t('cancelToken', language)}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
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
  header: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  clinicInfo: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },

  // Queue Paused Emergency Banner
  queuePausedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 14,
    marginBottom: spacing.lg,
    gap: 10,
  },
  queuePausedIcon: {
    fontSize: 20,
    marginTop: 1,
  },
  queuePausedText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#B91C1C',
    fontWeight: '600',
  },

  // On Hold Warning Banner
  onHoldBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(217,119,6,0.10)',
    borderWidth: 1.5,
    borderColor: '#D97706',
    borderRadius: 12,
    padding: 14,
    marginBottom: spacing.lg,
    gap: 10,
  },
  onHoldBannerIcon: {
    fontSize: 20,
    marginTop: 1,
  },
  onHoldBannerText: {
    flex: 1,
  },
  onHoldBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 3,
  },
  onHoldBannerMsg: {
    fontSize: 13,
    lineHeight: 19,
    color: '#92400E',
    fontWeight: '500',
  },

  // Hint Banner
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(22,101,52,0.06)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    marginBottom: spacing.lg,
    gap: 10,
  },
  hintIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.primary,
    fontWeight: '500',
  },

  // Live Stats
  liveStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  liveStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  liveStatHighlight: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  liveStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  liveStatLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },

  // Circle
  circleContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  circleCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  circleOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  circleTrack: {
    position: 'absolute',
    borderColor: colors.border,
  },
  circleProgress: {
    position: 'absolute',
  },
  circleCenter: {
    alignItems: 'center',
  },
  positionNumber: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.primary,
  },
  positionLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },

  // Arrived Banner
  arrivedBanner: {
    backgroundColor: 'rgba(76, 175, 80, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: 4,
  },
  arrivedBannerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginBottom: 4,
  },
  arrivedBannerText: {
    ...typography.body,
    fontWeight: '700',
    color: '#4CAF50',
  },
  arrivedBannerSub: {
    ...typography.small,
    color: '#66BB6A',
  },

  // Arrive Now Banner
  arriveNowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22,101,52,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  arriveNowIcon: {
    fontSize: 22,
  },
  arriveNowContent: {
    flex: 1,
  },
  arriveNowTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  arriveNowSub: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  arriveNowArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },

  // Status card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(22,101,52,0.12)',
  },
  statusEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusTime: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  statusMessage: {
    ...typography.caption,
  },

  // Timeline
  timeline: {
    marginBottom: spacing.lg,
    paddingLeft: spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 36,
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineDotCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.cardHighlight,
  },
  timelineDotText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
  },
  timelineLineDone: {
    backgroundColor: colors.primary,
  },
  timelineTextWrap: {
    paddingTop: 4,
    paddingBottom: 8,
    flex: 1,
  },
  timelineText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 15,
  },
  timelineTextCurrent: {
    color: colors.primary,
    fontWeight: '600',
  },
  timelineTextDone: {
    color: colors.textPrimary,
  },
  timelineArrivedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 5,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  timelineArrivedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  timelineArrivedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },

  alertCard: {
    marginBottom: spacing.xl,
  },
  alertText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },

  // Pre-Consultation Notes Card
  notesCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  notesCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  notesCardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 80,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  notesSubmitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  notesSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  notesSubmittedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesSubmittedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  notesEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesEditBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

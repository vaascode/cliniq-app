import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { t, type TranslationKey } from '../../lib/i18n';
import type { QueuePatient } from '../../lib/mockData';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { PlatformCard } from '../../components/PlatformCard';
import { FadeInView } from '../../components/FadeInView';
import { Users, ChartBar, Clock, ListBullets, getSymptomIcon, ArrowLeft } from '../../lib/icons';

// Mock weekly data
const WEEKLY_DATA = [
  { day: 'Mon', patients: 18, avgTime: 9 },
  { day: 'Tue', patients: 22, avgTime: 11 },
  { day: 'Wed', patients: 15, avgTime: 8 },
  { day: 'Thu', patients: 25, avgTime: 10 },
  { day: 'Fri', patients: 20, avgTime: 12 },
  { day: 'Sat', patients: 30, avgTime: 9 },
  { day: 'Sun', patients: 0, avgTime: 0 },
];

const WEEKLY_DATA_HI = [
  { day: 'सोम', patients: 18, avgTime: 9 },
  { day: 'मंगल', patients: 22, avgTime: 11 },
  { day: 'बुध', patients: 15, avgTime: 8 },
  { day: 'गुरु', patients: 25, avgTime: 10 },
  { day: 'शुक्र', patients: 20, avgTime: 12 },
  { day: 'शनि', patients: 30, avgTime: 9 },
  { day: 'रवि', patients: 0, avgTime: 0 },
];

const TOP_SYMPTOMS = [
  { key: 'fever', count: 38, pct: 28 },
  { key: 'coldCough', count: 31, pct: 23 },
  { key: 'headBodyPain', count: 22, pct: 16 },
  { key: 'chestHeart', count: 18, pct: 13 },
  { key: 'followUp', count: 14, pct: 10 },
  { key: 'prescriptionRefill', count: 12, pct: 9 },
];

const PEAK_HOURS = [
  { time: '9–10 AM', patients: 8 },
  { time: '10–11 AM', patients: 12 },
  { time: '11–12 PM', patients: 15 },
  { time: '12–1 PM', patients: 6 },
  { time: '2–3 PM', patients: 10 },
  { time: '3–4 PM', patients: 13 },
  { time: '4–5 PM', patients: 11 },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const { language, queue, doctorProfile } = useApp();

  const [selectedPatient, setSelectedPatient] = useState<QueuePatient | null>(null);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [patientFilter, setPatientFilter] = useState<'all' | 'waiting' | 'seeing' | 'done'>('all');
  const [showAllPatients, setShowAllPatients] = useState(false);
  const [selectedPeakIndex, setSelectedPeakIndex] = useState<number | null>(null);
  const [selectedSymptomIndex, setSelectedSymptomIndex] = useState<number | null>(null);

  const seenToday = queue.filter((p) => p.status === 'done').length;
  const waitingNow = queue.filter((p) => p.status === 'waiting').length;
  const totalToday = seenToday + waitingNow + (queue.find((p) => p.status === 'seeing') ? 1 : 0);

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const getWaitMinutes = (patient: QueuePatient) =>
    Math.round((Date.now() - new Date(patient.joinedAt).getTime()) / 60000);

  const weeklyData = language === 'hi' ? WEEKLY_DATA_HI : WEEKLY_DATA;
  const maxPatients = Math.max(...weeklyData.map((d) => d.patients));

  const totalWeekly = useMemo(() => WEEKLY_DATA.reduce((s, d) => s + d.patients, 0), []);
  const avgDaily = useMemo(() => Math.round(totalWeekly / 6), [totalWeekly]); // 6 working days
  const avgWait = useMemo(() => {
    const times = WEEKLY_DATA.filter((d) => d.avgTime > 0).map((d) => d.avgTime);
    return Math.round(times.reduce((s, t) => s + t, 0) / times.length);
  }, []);

  const maxPeakPatients = Math.max(...PEAK_HOURS.map((h) => h.patients));

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.primary} weight="bold" />
        </TouchableOpacity>

        <Text style={styles.title}>
          {language === 'hi' ? 'विश्लेषण' : 'Analytics'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'hi' ? 'इस सप्ताह की जानकारी' : "This week's insights"}
        </Text>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <PlatformCard style={styles.summaryCard}>
            <View style={styles.summaryIconWrap}><Users size={22} color={colors.primary} weight="duotone" /></View>
            <Text style={styles.summaryValue}>{totalWeekly}</Text>
            <Text style={styles.summaryLabel}>
              {language === 'hi' ? 'साप्ताहिक' : 'This Week'}
            </Text>
          </PlatformCard>
          <PlatformCard style={styles.summaryCard}>
            <View style={styles.summaryIconWrap}><ChartBar size={22} color={colors.primary} weight="duotone" /></View>
            <Text style={styles.summaryValue}>{avgDaily}</Text>
            <Text style={styles.summaryLabel}>
              {language === 'hi' ? 'औसत/दिन' : 'Avg/Day'}
            </Text>
          </PlatformCard>
          <PlatformCard style={styles.summaryCard}>
            <View style={styles.summaryIconWrap}><Clock size={22} color={colors.primary} weight="duotone" /></View>
            <Text style={styles.summaryValue}>{avgWait}m</Text>
            <Text style={styles.summaryLabel}>
              {language === 'hi' ? 'औसत समय' : 'Avg Time'}
            </Text>
          </PlatformCard>
        </View>

        {/* Today's Stats */}
        <PlatformCard style={styles.todayCard} accentColor={colors.primary} accentSide="left">
          <Text style={styles.sectionLabel}>
            {language === 'hi' ? 'आज' : 'Today'}
          </Text>
          <View style={styles.todayRow}>
            <View style={styles.todayStat}>
              <Text style={styles.todayValue}>{totalToday}</Text>
              <Text style={styles.todayLabel}>{language === 'hi' ? 'कुल' : 'Total'}</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayStat}>
              <Text style={[styles.todayValue, { color: colors.success }]}>{seenToday}</Text>
              <Text style={styles.todayLabel}>{t('seenToday', language)}</Text>
            </View>
            <View style={styles.todayDivider} />
            <View style={styles.todayStat}>
              <Text style={[styles.todayValue, { color: colors.warning }]}>{waitingNow}</Text>
              <Text style={styles.todayLabel}>{t('waiting', language)}</Text>
            </View>
          </View>
        </PlatformCard>

        {/* Weekly Chart */}
        <PlatformCard style={styles.chartCard}>
          <Text style={styles.sectionLabel}>
            {language === 'hi' ? '📈 साप्ताहिक मरीज़' : '📈 Weekly Patients'}
          </Text>
          <View style={styles.chartContainer}>
            {weeklyData.map((item, i) => {
              const isToday = i === new Date().getDay() - 1;
              const isSelected = selectedBarIndex === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.chartColumn}
                  activeOpacity={0.7}
                  onPress={() => setSelectedBarIndex(isSelected ? null : i)}
                >
                  {isSelected ? (
                    <View style={styles.barTooltip}>
                      <Text style={styles.barTooltipValue}>{item.patients}</Text>
                      <Text style={styles.barTooltipLabel}>
                        {language === 'hi' ? `${item.avgTime}मि औसत` : `${item.avgTime}m avg`}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.chartValue}>{item.patients || ''}</Text>
                  )}
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: maxPatients > 0 ? (item.patients / maxPatients) * 110 : 0,
                          backgroundColor: isSelected
                            ? colors.primary
                            : isToday
                            ? colors.primary
                            : colors.primaryLight,
                        },
                        isSelected && { width: 28, borderRadius: 8 },
                      ]}
                    />
                  </View>
                  <Text style={[
                    styles.chartDay,
                    (isToday || isSelected) && { color: colors.primary, fontWeight: '700' },
                  ]}>
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </PlatformCard>

        {/* Peak Hours */}
        <PlatformCard style={styles.chartCard}>
          <Text style={styles.sectionLabel}>
            {language === 'hi' ? 'पीक आवर्स' : 'Peak Hours'}
          </Text>
          {PEAK_HOURS.map((hour, i) => {
            const isSelected = selectedPeakIndex === i;
            const isPeak = hour.patients === maxPeakPatients;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => setSelectedPeakIndex(isSelected ? null : i)}
              >
                <View style={[styles.peakRow, isSelected && styles.peakRowSelected]}>
                  <Text style={[styles.peakTime, isSelected && { color: colors.primary, fontWeight: '700' }]}>{hour.time}</Text>
                  <View style={styles.peakBarContainer}>
                    <View
                      style={[
                        styles.peakBar,
                        {
                          width: `${(hour.patients / maxPeakPatients) * 100}%`,
                          backgroundColor: isSelected || isPeak ? colors.primary : colors.primaryLight,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.peakCount, isSelected && { color: colors.primary }]}>{hour.patients}</Text>
                </View>
                {isSelected && (
                  <View style={styles.peakInsight}>
                    <Text style={styles.peakInsightText}>
                      {language === 'hi'
                        ? `${hour.time} में ${hour.patients} मरीज़ आए — ${isPeak ? 'यह सबसे व्यस्त समय है!' : `${Math.round((hour.patients / maxPeakPatients) * 100)}% पीक ट्रैफ़िक`}`
                        : `${hour.patients} patients during ${hour.time} — ${isPeak ? 'This is the busiest hour!' : `${Math.round((hour.patients / maxPeakPatients) * 100)}% of peak traffic`}`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </PlatformCard>

        {/* Top Symptoms */}
        <PlatformCard style={styles.chartCard}>
          <Text style={styles.sectionLabel}>
            {language === 'hi' ? 'मुख्य समस्याएं' : 'Top Concerns'}
          </Text>
          {TOP_SYMPTOMS.map((symptom, i) => {
            const isSelected = selectedSymptomIndex === i;
            const avgPerDay = Math.round(symptom.count / 6);
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => setSelectedSymptomIndex(isSelected ? null : i)}
              >
                <View style={[styles.symptomRow, isSelected && styles.symptomRowSelected]}>
                  <Text style={[styles.symptomRank, isSelected && { color: colors.primary }]}>#{i + 1}</Text>
                  {getSymptomIcon(symptom.key, { size: 22, color: isSelected ? colors.primary : colors.primary, weight: isSelected ? 'fill' : 'duotone' })}
                  <View style={styles.symptomInfo}>
                    <Text style={[styles.symptomName, isSelected && { color: colors.primary, fontWeight: '700' }]}>
                      {t(symptom.key as TranslationKey, language)}
                    </Text>
                    <View style={styles.symptomBarOuter}>
                      <View
                        style={[styles.symptomBarInner, { width: `${symptom.pct}%` }]}
                      />
                    </View>
                  </View>
                  <View style={styles.symptomStats}>
                    <Text style={[styles.symptomCount, isSelected && { color: colors.primary }]}>{symptom.count}</Text>
                    <Text style={styles.symptomPct}>{symptom.pct}%</Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.symptomInsight}>
                    <Text style={styles.symptomInsightText}>
                      {language === 'hi'
                        ? `इस सप्ताह ${symptom.count} मरीज़ — औसत ${avgPerDay}/दिन। कुल मरीज़ों का ${symptom.pct}%।`
                        : `${symptom.count} patients this week — avg ${avgPerDay}/day. ${symptom.pct}% of all patients.`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </PlatformCard>

        {/* Today's Patients */}
        <PlatformCard style={styles.chartCard}>
          <Text style={styles.sectionLabel}>
            {language === 'hi' ? `आज के मरीज़ (${queue.length})` : `Today's Patients (${queue.length})`}
          </Text>

          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
            {([
              { key: 'all' as const, labelEn: 'All', labelHi: 'सभी' },
              { key: 'waiting' as const, labelEn: 'Waiting', labelHi: 'प्रतीक्षा' },
              { key: 'seeing' as const, labelEn: 'Seeing', labelHi: 'देख रहे' },
              { key: 'done' as const, labelEn: 'Done', labelHi: 'पूर्ण' },
            ]).map((chip) => {
              const isActive = patientFilter === chip.key;
              const count = chip.key === 'all' ? queue.length : queue.filter(p => p.status === chip.key).length;
              return (
                <TouchableOpacity
                  key={chip.key}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  activeOpacity={0.7}
                  onPress={() => { setPatientFilter(chip.key); setShowAllPatients(false); }}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {language === 'hi' ? chip.labelHi : chip.labelEn} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {(() => {
            const filtered = patientFilter === 'all' ? queue : queue.filter(p => p.status === patientFilter);
            const visible = showAllPatients ? filtered : filtered.slice(0, 5);
            const hasMore = filtered.length > 5 && !showAllPatients;

            if (filtered.length === 0) {
              return (
                <View style={styles.emptyState}>
                  <ListBullets size={32} color={colors.textSecondary} weight="regular" />
                  <Text style={styles.emptyText}>
                    {language === 'hi' ? 'कोई मरीज़ नहीं' : 'No patients'}
                  </Text>
                </View>
              );
            }

            return (
              <>
                {visible.map((patient) => (
                  <TouchableOpacity
                    key={patient.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedPatient(patient)}
                  >
                    <View style={styles.patientRow}>
                      <View style={[
                        styles.patientToken,
                        patient.status === 'seeing' && styles.patientTokenActive,
                        patient.status === 'done' && styles.patientTokenDone,
                      ]}>
                        <Text style={[
                          styles.patientTokenText,
                          (patient.status === 'seeing' || patient.status === 'done') && { color: '#FFFFFF' },
                        ]}>
                          #{patient.tokenNumber}
                        </Text>
                      </View>
                      <View style={styles.patientInfo}>
                        <Text style={styles.patientRowName}>{patient.name}</Text>
                        <Text style={styles.patientSymptom}>
                          {t(patient.symptomKey as TranslationKey, language)}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        patient.status === 'seeing' && styles.statusBadgeActive,
                        patient.status === 'done' && styles.statusBadgeDone,
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          patient.status === 'seeing' && { color: colors.warning },
                          patient.status === 'done' && { color: colors.success },
                        ]}>
                          {patient.status === 'waiting'
                            ? t('waiting' as TranslationKey, language)
                            : patient.status === 'seeing'
                            ? t('viewing' as TranslationKey, language)
                            : t('done' as TranslationKey, language)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                {hasMore && (
                  <TouchableOpacity
                    style={styles.showMoreBtn}
                    activeOpacity={0.7}
                    onPress={() => setShowAllPatients(true)}
                  >
                    <Text style={styles.showMoreText}>
                      {language === 'hi'
                        ? `+${filtered.length - 5} और दिखाएं`
                        : `Show ${filtered.length - 5} More`}
                    </Text>
                  </TouchableOpacity>
                )}
                {showAllPatients && filtered.length > 5 && (
                  <TouchableOpacity
                    style={styles.showMoreBtn}
                    activeOpacity={0.7}
                    onPress={() => setShowAllPatients(false)}
                  >
                    <Text style={styles.showMoreText}>
                      {language === 'hi' ? 'कम दिखाएं' : 'Show Less'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()}
        </PlatformCard>

        <View style={{ height: 40 }} />
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
                    selectedPatient.status === 'seeing' && { backgroundColor: 'rgba(255,179,0,0.12)' },
                    selectedPatient.status === 'done' && { backgroundColor: 'rgba(76,175,80,0.12)' },
                  ]}>
                    <Text style={[
                      styles.modalStatusText,
                      selectedPatient.status === 'seeing' && { color: colors.warning },
                      selectedPatient.status === 'done' && { color: colors.success },
                    ]}>
                      {selectedPatient.status === 'waiting'
                        ? t('waiting' as TranslationKey, language)
                        : selectedPatient.status === 'seeing'
                        ? t('viewing' as TranslationKey, language)
                        : t('done' as TranslationKey, language)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalName}>{selectedPatient.name}</Text>

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
                        {language === 'hi' ? '▶️ शुरू' : '▶️ Started'}
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
  backBtn: {
    marginBottom: spacing.md,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySecondary,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    fontSize: 13,
  },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  summaryIconWrap: {
    marginBottom: 6,
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  summaryLabel: {
    ...typography.small,
    marginTop: 4,
  },
  // Today
  todayCard: {
    marginBottom: spacing.md,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayStat: {
    flex: 1,
    alignItems: 'center',
  },
  todayValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  todayLabel: {
    ...typography.small,
    marginTop: 4,
  },
  todayDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  // Weekly Chart
  chartCard: {
    marginBottom: spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    paddingTop: spacing.lg,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartValue: {
    ...typography.small,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    minHeight: 16,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 6,
    minHeight: 2,
  },
  chartDay: {
    ...typography.small,
    fontSize: 11,
    marginTop: 6,
    color: colors.textSecondary,
  },
  // Peak Hours
  peakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  peakTime: {
    ...typography.small,
    width: 75,
    color: colors.textSecondary,
    fontSize: 12,
  },
  peakBarContainer: {
    flex: 1,
    height: 18,
    backgroundColor: colors.surface,
    borderRadius: 9,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  peakBar: {
    height: '100%',
    borderRadius: 9,
  },
  peakCount: {
    ...typography.small,
    width: 24,
    textAlign: 'right',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  peakRowSelected: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  peakInsight: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: -4,
  },
  peakInsightText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '500',
    lineHeight: 18,
  },
  // Symptoms
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  symptomRank: {
    ...typography.small,
    fontWeight: '700',
    color: colors.textSecondary,
    width: 24,
  },
  symptomEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  symptomInfo: {
    flex: 1,
    marginRight: 12,
  },
  symptomName: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  symptomBarOuter: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  symptomBarInner: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  symptomStats: {
    alignItems: 'flex-end',
  },
  symptomCount: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  symptomPct: {
    ...typography.small,
    color: colors.textSecondary,
    fontSize: 11,
  },
  symptomRowSelected: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  symptomInsight: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: -8,
  },
  symptomInsightText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '500',
    lineHeight: 18,
  },
  // Patient List
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.caption,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  patientToken: {
    width: 44,
    height: 34,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  patientTokenActive: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  patientTokenDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  patientTokenText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  patientInfo: {
    flex: 1,
  },
  patientRowName: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '500',
  },
  patientSymptom: {
    ...typography.small,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(158,158,158,0.12)',
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(255,179,0,0.12)',
  },
  statusBadgeDone: {
    backgroundColor: 'rgba(76,175,80,0.12)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // Bar Tooltip
  barTooltip: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    minHeight: 16,
    marginBottom: 2,
  },
  barTooltipValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  barTooltipLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '500',
  },
  // Filter Chips
  filterRow: {
    marginBottom: spacing.md,
    marginTop: -4,
  },
  filterRowContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  // Show More
  showMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  showMoreText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
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
  modalName: {
    ...typography.h3,
    marginBottom: spacing.sm,
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
});

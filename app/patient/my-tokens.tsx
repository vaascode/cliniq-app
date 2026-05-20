import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { t, type TranslationKey } from '../../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { getSymptomIcon, CheckCircle, Clock, Stethoscope, User, Heart, Ticket, Timer, ArrowLeft } from '../../lib/icons';
import { PlatformCard } from '../../components/PlatformCard';
import { FadeInView } from '../../components/FadeInView';

type TokenStatus = 'waiting' | 'arrived' | 'seeing' | 'done';

interface EnrichedToken {
  tokenNumber: number;
  patientName: string;
  patientAge: string;
  relation: string;
  symptom: string;
  symptomEmoji: string;
  symptomKey: string;
  clinicName: string;
  doctorName: string;
  estimatedWait: number;
  joinedAt: Date;
  liveStatus: TokenStatus;
  arrivedAt?: Date;
}

const STATUS_CONFIG: Record<TokenStatus, { label: string; labelHi: string; bg: string; text: string }> = {
  arrived: { label: 'Arrived', labelHi: 'पहुँच गए', bg: '#D1FAE5', text: '#10B981' },
  waiting: { label: 'Waiting', labelHi: 'प्रतीक्षा', bg: '#DBEAFE', text: '#3B82F6' },
  seeing: { label: 'Now Seeing', labelHi: 'अभी देख रहे हैं', bg: '#FEF3C7', text: '#F59E0B' },
  done: { label: 'Completed', labelHi: 'पूर्ण', bg: '#F3F4F6', text: '#6B7280' },
};

export default function MyTokensScreen() {
  const router = useRouter();
  const { language, allTokens, queue, cancelToken } = useApp();

  // Enrich tokens with live status from queue
  const enrichedTokens = useMemo<EnrichedToken[]>(() => {
    return allTokens.map((token) => {
      const queueEntry = queue.find((q) => q.tokenNumber === token.tokenNumber);
      let liveStatus: TokenStatus = 'waiting';
      if (queueEntry) {
        if (queueEntry.status === 'done') {
          liveStatus = 'done';
        } else if (queueEntry.status === 'seeing') {
          liveStatus = 'seeing';
        } else if (queueEntry.arrivedAt) {
          liveStatus = 'arrived';
        } else {
          liveStatus = 'waiting';
        }
      }

      return {
        tokenNumber: token.tokenNumber,
        patientName: token.patientName || 'Patient',
        patientAge: token.patientAge || '',
        relation: token.relation || 'self',
        symptom: token.symptom,
        symptomEmoji: token.symptomEmoji,
        symptomKey: token.symptomKey,
        clinicName: token.clinicName,
        doctorName: token.doctorName,
        estimatedWait: token.estimatedWait,
        joinedAt: token.joinedAt,
        liveStatus,
        arrivedAt: queueEntry?.arrivedAt,
      };
    });
  }, [allTokens, queue]);

  // Sort: seeing first, then arrived, then waiting, then done
  const sortedTokens = useMemo(() => {
    const order: Record<TokenStatus, number> = { seeing: 0, arrived: 1, waiting: 2, done: 3 };
    return [...enrichedTokens].sort((a, b) => order[a.liveStatus] - order[b.liveStatus]);
  }, [enrichedTokens]);

  const activeCount = sortedTokens.filter((t) => t.liveStatus !== 'done').length;

  const handleCancel = (tokenNumber: number) => {
    Alert.alert(
      language === 'hi' ? 'टोकन रद्द करें' : 'Cancel Token',
      t('cancelTokenConfirm' as TranslationKey, language),
      [
        { text: t('cancel' as TranslationKey, language), style: 'cancel' },
        {
          text: t('cancelToken' as TranslationKey, language),
          style: 'destructive',
          onPress: () => cancelToken(tokenNumber),
        },
      ]
    );
  };

  const handleGenerateToken = () => {
    router.push('/patient/symptoms');
  };

  const getRelationDisplay = (relation: string) => {
    if (relation === 'self') return t('self' as TranslationKey, language);
    return t(relation as TranslationKey, language);
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <FadeInView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.primary} weight="bold" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>
            {t('myActiveTokens' as TranslationKey, language)}
          </Text>
          {activeCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{activeCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {sortedTokens.length === 0 ? (
        /* ── Empty State ── */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ticket size={48} color={colors.textSecondary} weight="duotone" />
          </View>
          <Text style={styles.emptyHeading}>
            {t('noActiveTokens' as TranslationKey, language)}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t('noActiveTokensDesc' as TranslationKey, language)}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            activeOpacity={0.8}
            onPress={handleGenerateToken}
          >
            <Text style={styles.emptyButtonText}>
              {t('generateFirstToken' as TranslationKey, language)}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Token Cards ── */
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {sortedTokens.map((token) => {
              const statusCfg = STATUS_CONFIG[token.liveStatus];
              const isDone = token.liveStatus === 'done';

              return (
                <TouchableOpacity
                  key={token.tokenNumber}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/patient/token-detail?tokenNumber=${token.tokenNumber}`)}
                >
                <PlatformCard
                  style={isDone ? StyleSheet.flatten([styles.tokenCard, styles.tokenCardDone]) : styles.tokenCard}
                >
                  {/* Top Row: Token number + Status badge */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.tokenNumberWrap}>
                      <Text style={styles.tokenHash}>#</Text>
                      <Text style={[styles.tokenNumber, isDone && styles.textMuted]}>
                        {token.tokenNumber}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>

                      <Text style={[styles.statusText, { color: statusCfg.text }]}>
                        {language === 'hi' ? statusCfg.labelHi : statusCfg.label}
                      </Text>
                    </View>
                  </View>

                  {/* Person info */}
                  <View style={styles.personRow}>
                    <View style={styles.personEmoji}>
                      {token.relation === 'self' ? <User size={18} color={colors.primary} weight="duotone" /> : <Heart size={18} color={colors.primary} weight="duotone" />}
                    </View>
                    <View style={styles.personInfo}>
                      <Text style={[styles.personName, isDone && styles.textMuted]}>
                        {token.patientName}
                        {token.patientAge ? `, ${token.patientAge} yrs` : ''}
                      </Text>
                      <Text style={styles.personRelation}>
                        {getRelationDisplay(token.relation)}
                      </Text>
                    </View>
                  </View>

                  {/* Concern + Clinic */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>
                        {t('concern' as TranslationKey, language)}
                      </Text>
                      <Text style={[styles.detailValue, isDone && styles.textMuted]} numberOfLines={2}>
                        {token.symptom}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>
                        {t('doctor' as TranslationKey, language)}
                      </Text>
                      <Text style={[styles.detailValue, isDone && styles.textMuted]} numberOfLines={1}>
                        {token.doctorName}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom: Wait info + Cancel */}
                  <View style={styles.cardBottomRow}>
                    <View style={styles.waitInfo}>
                      {!isDone && token.liveStatus !== 'seeing' && (
                        <View style={styles.waitTextRow}>
                          <Timer size={13} color={colors.primary} weight="duotone" />
                          <Text style={styles.waitText}>
                            ~{token.estimatedWait} {t('mins' as TranslationKey, language)}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.joinedText}>
                        {formatTime(token.joinedAt)}
                      </Text>
                    </View>

                    {!isDone && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        activeOpacity={0.7}
                        onPress={() => handleCancel(token.tokenNumber)}
                      >
                        <Text style={styles.cancelText}>
                          {t('cancelToken' as TranslationKey, language)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </PlatformCard>
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Sticky Bottom Button */}
          <View style={styles.stickyBottom}>
            <TouchableOpacity
              style={styles.generateBtn}
              activeOpacity={0.85}
              onPress={handleGenerateToken}
            >
              <Text style={styles.generateBtnText}>
                {t('generateNewToken' as TranslationKey, language)}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 26,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: -2,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...typography.h4,
  },
  countBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  countText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },

  /* ── Scroll ── */
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  /* ── Token Card ── */
  tokenCard: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tokenCardDone: {
    opacity: 0.55,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tokenNumberWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tokenHash: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 2,
  },
  tokenNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusEmoji: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* ── Person Row ── */
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  personEmoji: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  personRelation: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 1,
  },

  /* ── Details Row ── */
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 2,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: 13,
  },

  /* ── Bottom Row ── */
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm + 2,
  },
  waitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  waitTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waitText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  joinedText: {
    ...typography.small,
    color: colors.textSecondary,
    fontSize: 11,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  cancelText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },

  textMuted: {
    color: colors.textSecondary,
  },

  /* ── Empty State ── */
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  emptyHeading: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  /* ── Sticky Bottom ── */
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg + 10,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  generateBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

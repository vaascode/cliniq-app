import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../lib/context/AppContext';
import { t, type TranslationKey } from '../../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import {
  Clock,
  CheckCircle,
  Stethoscope,
  Ticket,
  User,
  Users,
  Hospital,
  MapPin,
  Warning,
  ArrowLeft,
} from 'phosphor-react-native';
import { getSymptomIcon } from '../../lib/icons';

type TokenStatus = 'waiting' | 'arrived' | 'seeing' | 'done';

const STATUS_CONFIG: Record<TokenStatus, {
  label: string;
  labelHi: string;
  color: string;
  bg: string;
  Icon: React.ComponentType<any>;
}> = {
  waiting: {
    label: 'Waiting',
    labelHi: 'प्रतीक्षा',
    color: '#3B82F6',
    bg: '#DBEAFE',
    Icon: Clock,
  },
  arrived: {
    label: 'Arrived',
    labelHi: 'पहुँच गए',
    color: '#059669',
    bg: '#D1FAE5',
    Icon: CheckCircle,
  },
  seeing: {
    label: 'Now Seeing',
    labelHi: 'अभी देख रहे हैं',
    color: '#D97706',
    bg: '#FEF3C7',
    Icon: Stethoscope,
  },
  done: {
    label: 'Completed',
    labelHi: 'पूर्ण',
    color: '#6B7280',
    bg: '#F3F4F6',
    Icon: CheckCircle,
  },
};

export default function TokenDetailScreen() {
  const router = useRouter();
  const { tokenNumber: tokenNumStr } = useLocalSearchParams<{ tokenNumber: string }>();
  const { language, allTokens, queue, cancelToken } = useApp();

  const tokenNumber = parseInt(tokenNumStr || '0', 10);

  const token = useMemo(() => allTokens.find((t) => t.tokenNumber === tokenNumber), [allTokens, tokenNumber]);
  const queueEntry = useMemo(() => queue.find((q) => q.tokenNumber === tokenNumber), [queue, tokenNumber]);

  const liveStatus: TokenStatus = useMemo(() => {
    if (!queueEntry) return 'waiting';
    if (queueEntry.status === 'done') return 'done';
    if (queueEntry.status === 'seeing') return 'seeing';
    if (queueEntry.arrivedAt) return 'arrived';
    return 'waiting';
  }, [queueEntry]);

  const queuePosition = useMemo(() => {
    const activeQueue = queue.filter((q) => q.status === 'waiting' || (q.status !== 'done' && q.status !== 'seeing'));
    const idx = activeQueue.findIndex((q) => q.tokenNumber === tokenNumber);
    return idx >= 0 ? idx + 1 : null;
  }, [queue, tokenNumber]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const detailsSlide = useRef(new Animated.Value(20)).current;
  const detailsFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(detailsFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(detailsSlide, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  };

  const handleCancel = () => {
    Alert.alert(
      language === 'hi' ? 'टोकन रद्द करें' : 'Cancel Token',
      language === 'hi' ? 'क्या आप इस टोकन को रद्द करना चाहते हैं?' : 'Are you sure you want to cancel this token?',
      [
        { text: language === 'hi' ? 'नहीं' : 'No', style: 'cancel' },
        {
          text: language === 'hi' ? 'हाँ, रद्द करें' : 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelToken(tokenNumber);
            router.back();
          },
        },
      ]
    );
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.notFoundWrap}>
          <View style={styles.notFoundIconWrap}>
            <Ticket size={48} color={colors.textSecondary} weight="duotone" />
          </View>
          <Text style={styles.notFoundText}>
            {language === 'hi' ? 'टोकन नहीं मिला' : 'Token not found'}
          </Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
            <ArrowLeft size={16} color={colors.primary} weight="bold" />
            <Text style={styles.goBackText}>
              {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusCfg = STATUS_CONFIG[liveStatus];
  const StatusIcon = statusCfg.Icon;
  const isDone = liveStatus === 'done';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#E8F5E9', colors.background]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[styles.orb, styles.orbTeal]} />
      <View style={[styles.orb, styles.orbPurple]} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={colors.primary} weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'hi' ? 'टोकन विवरण' : 'Token Details'}
          </Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Token Card */}
          <Animated.View style={[styles.tokenCardWrap, { opacity: fadeAnim, transform: [{ translateY: cardSlide }] }]}>
            <View style={styles.tokenCard}>
              <LinearGradient
                colors={[colors.surface, colors.background, colors.background]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              <View style={styles.tokenNumberSection}>
                <Text style={styles.tokenLabel}>
                  {language === 'hi' ? 'टोकन नंबर' : 'TOKEN NUMBER'}
                </Text>
                <View style={styles.tokenNumberRow}>
                  <Text style={styles.tokenHash}>#</Text>
                  <Text style={[styles.tokenNumber, isDone && { color: colors.textSecondary }]}>
                    {token.tokenNumber}
                  </Text>
                </View>
              </View>

              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                <StatusIcon size={16} color={statusCfg.color} weight="duotone" />
                <Text style={[styles.statusText, { color: statusCfg.color }]}>
                  {language === 'hi' ? statusCfg.labelHi : statusCfg.label}
                </Text>
              </View>

              {queuePosition && liveStatus === 'waiting' && (
                <Text style={styles.queuePositionText}>
                  {language === 'hi'
                    ? `कतार में ${queuePosition} नंबर पर`
                    : `#${queuePosition} in queue`}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Details Section */}
          <Animated.View style={[styles.detailsSection, { opacity: detailsFade, transform: [{ translateY: detailsSlide }] }]}>
            {/* Patient Info */}
            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>
                {language === 'hi' ? 'मरीज़ की जानकारी' : 'Patient Info'}
              </Text>

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <User size={18} color={colors.primary} weight="duotone" />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    {language === 'hi' ? 'नाम' : 'Name'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {token.patientName || (language === 'hi' ? 'मरीज़' : 'Patient')}
                    {token.patientAge ? `, ${token.patientAge} yrs` : ''}
                  </Text>
                </View>
              </View>

              {token.relation && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrap}>
                    <Users size={18} color={colors.primary} weight="duotone" />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>
                      {language === 'hi' ? 'संबंध' : 'Relation'}
                    </Text>
                    <Text style={styles.detailValue}>
                      {token.relation === 'self'
                        ? (language === 'hi' ? 'स्वयं' : 'Self')
                        : t(token.relation as TranslationKey, language)}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  {getSymptomIcon(token.symptomKey || 'somethingElse', { size: 18, color: colors.primary, weight: 'duotone' })}
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    {language === 'hi' ? 'समस्या' : 'Concern'}
                  </Text>
                  <Text style={styles.detailValue}>{token.symptom}</Text>
                </View>
              </View>
            </View>

            {/* Clinic Info */}
            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>
                {language === 'hi' ? 'क्लिनिक की जानकारी' : 'Clinic Info'}
              </Text>

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Hospital size={18} color={colors.primary} weight="duotone" />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    {language === 'hi' ? 'क्लिनिक' : 'Clinic'}
                  </Text>
                  <Text style={styles.detailValue}>{token.clinicName}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <User size={18} color={colors.primary} weight="duotone" />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    {language === 'hi' ? 'डॉक्टर' : 'Doctor'}
                  </Text>
                  <Text style={styles.detailValue}>{token.doctorName}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Stethoscope size={18} color={colors.primary} weight="duotone" />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    {language === 'hi' ? 'विशेषज्ञता' : 'Specialty'}
                  </Text>
                  <Text style={styles.detailValue}>{token.specialty}</Text>
                </View>
              </View>
            </View>

            {/* Timing Info */}
            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>
                {language === 'hi' ? 'समय की जानकारी' : 'Timing'}
              </Text>

              <View style={styles.detailRow}>
                <View style={styles.detailIconWrap}>
                  <Clock size={18} color={colors.primary} weight="duotone" />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>
                    {language === 'hi' ? 'बुकिंग समय' : 'Booked At'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {formatTime(token.joinedAt)} • {formatDate(token.joinedAt)}
                  </Text>
                </View>
              </View>

              {!isDone && liveStatus !== 'seeing' && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrap}>
                    <Warning size={18} color={colors.primary} weight="duotone" />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>
                      {language === 'hi' ? 'अनुमानित प्रतीक्षा' : 'Estimated Wait'}
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.primary }]}>
                      ~{token.estimatedWait} {language === 'hi' ? 'मिनट' : 'mins'}
                    </Text>
                  </View>
                </View>
              )}

              {queueEntry?.arrivedAt && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrap}>
                    <MapPin size={18} color={colors.primary} weight="duotone" />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>
                      {language === 'hi' ? 'पहुँचने का समय' : 'Arrived At'}
                    </Text>
                    <Text style={styles.detailValue}>
                      {formatTime(queueEntry.arrivedAt)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Cancel Button */}
            {!isDone && (
              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.8}
                onPress={handleCancel}
              >
                <Text style={styles.cancelBtnText}>
                  {language === 'hi' ? 'टोकन रद्द करें' : 'Cancel Token'}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },

  orb: {
    position: 'absolute',
    borderRadius: 200,
  },
  orbTeal: {
    width: 250,
    height: 250,
    backgroundColor: colors.primary,
    opacity: 0.06,
    top: '30%',
    left: -100,
  },
  orbPurple: {
    width: 200,
    height: 200,
    backgroundColor: colors.primary,
    opacity: 0.05,
    top: -40,
    right: -60,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 26,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  tokenCardWrap: {
    marginBottom: spacing.lg,
  },
  tokenCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  tokenNumberSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tokenNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tokenHash: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 4,
  },
  tokenNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  queuePositionText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },

  detailsSection: {},
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  detailIconWrap: {
    width: 24,
    alignItems: 'center',
    marginTop: 2,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
    lineHeight: 22,
  },

  cancelBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },

  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  notFoundIconWrap: {
    marginBottom: spacing.md,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  goBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  goBackText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});

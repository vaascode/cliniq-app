import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Share, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../lib/context/AppContext';
import { t } from '../../lib/i18n';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { ClipboardText, ArrowLeft, ShareNetwork, DownloadSimple } from '../../lib/icons';
import { PlatformCard } from '../../components/PlatformCard';
import { FadeInView } from '../../components/FadeInView';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = Math.min(SCREEN_WIDTH - 120, 160);

export default function QRCodeScreen() {
  const router = useRouter();
  const { language, doctorProfile } = useApp();

  const clinicLink = `cliniq.app/c/${doctorProfile?.clinicId || 'demo'}`;

  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    try {
      await Share.share({
        message: language === 'hi'
          ? `${doctorProfile?.clinicName || 'मेरी क्लिनिक'} में अपॉइंटमेंट के लिए इस लिंक पर जाएं: ${clinicLink}`
          : `Book your appointment at ${doctorProfile?.clinicName || 'my clinic'}: ${clinicLink}`,
        title: doctorProfile?.clinicName || 'Clinic QR',
      });
    } catch (e: any) {
      // User cancelled share
    }
  };

  const handleDownload = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    Alert.alert(
      language === 'hi' ? '✅ सेव हो गया' : '✅ Saved',
      language === 'hi' ? 'QR कोड गैलरी में सेव हो गया' : 'QR code saved to your gallery'
    );
  };

  const handleCopyLink = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Alert.alert(t('copied', language), clinicLink);
  };

  return (
    <FadeInView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={22} color={colors.primary} weight="bold" />
            </TouchableOpacity>
          </View>

          <Text style={styles.header}>{t('clinicQRCode', language)}</Text>
          <Text style={styles.subtitle}>{t('askPatientsToScan', language)}</Text>

          {/* QR Card — compact */}
          <PlatformCard style={styles.qrCard}>
            <View style={styles.qrContainer}>
              {/* Simulated QR pattern */}
              <View style={styles.qrGrid}>
                {Array.from({ length: 7 }).map((_, row) => (
                  <View key={row} style={styles.qrRow}>
                    {Array.from({ length: 7 }).map((_, col) => (
                      <View
                        key={col}
                        style={[
                          styles.qrCell,
                          {
                            backgroundColor:
                              (row < 2 && col < 2) ||
                              (row < 2 && col > 4) ||
                              (row > 4 && col < 2) ||
                              (row === 3 && col === 3) ||
                              ((row + col) % 3 === 0)
                                ? colors.textPrimary
                                : '#FFF',
                          },
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
              {/* Corner markers */}
              <View style={[styles.cornerMarker, styles.cornerTL]} />
              <View style={[styles.cornerMarker, styles.cornerTR]} />
              <View style={[styles.cornerMarker, styles.cornerBL]} />
            </View>

            <Text style={styles.clinicNameText}>{doctorProfile?.clinicName}</Text>
            <Text style={styles.doctorNameText}>{doctorProfile?.name}</Text>
            <View style={styles.specialtyPill}>
              <Text style={styles.specialtyPillText}>
                {t(doctorProfile?.specialtyKey as any, language)}
              </Text>
            </View>
          </PlatformCard>

          {/* Action buttons — side by side */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <ShareNetwork size={18} color={colors.primary} weight="bold" />
              <Text style={styles.shareBtnText}>
                {language === 'hi' ? 'शेयर' : 'Share'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} activeOpacity={0.8}>
              <DownloadSimple size={18} color="#FFFFFF" weight="bold" />
              <Text style={styles.downloadBtnText}>
                {language === 'hi' ? 'डाउनलोड' : 'Download'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Link section */}
          <View style={styles.linkSection}>
            <Text style={styles.linkLabel}>{t('orShareLink', language)}</Text>
            <TouchableOpacity style={styles.linkRow} onPress={handleCopyLink} activeOpacity={0.7}>
              <Text style={styles.linkText} numberOfLines={1}>
                {clinicLink}
              </Text>
              <ClipboardText size={20} color={colors.primary} weight="duotone" />
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22,101,52,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    ...typography.h2,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  qrCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  qrGrid: {
    gap: 2,
  },
  qrRow: {
    flexDirection: 'row',
    gap: 2,
  },
  qrCell: {
    width: QR_SIZE / 7 - 2,
    height: QR_SIZE / 7 - 2,
    borderRadius: 2,
  },
  cornerMarker: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderWidth: 4,
    borderColor: colors.border,
    borderRadius: 8,
  },
  cornerTL: { top: -3, left: -3 },
  cornerTR: { top: -3, right: -3 },
  cornerBL: { bottom: -3, left: -3 },
  clinicNameText: {
    ...typography.h4,
    marginBottom: 2,
  },
  doctorNameText: {
    ...typography.bodySecondary,
    marginBottom: spacing.sm,
  },
  specialtyPill: {
    backgroundColor: colors.cardHighlight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  specialtyPillText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.lg,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'rgba(22,101,52,0.04)',
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: colors.primary,
    ...(Platform.OS === 'ios'
      ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
      : { elevation: 4 }),
  },
  downloadBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Link
  linkSection: {
    alignItems: 'center',
  },
  linkLabel: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'stretch',
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
    marginRight: spacing.sm,
    flex: 1,
  },
});

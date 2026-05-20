import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Linking,
  Dimensions,
  Pressable,
  PanResponder,
} from 'react-native';
import { useApp } from '../lib/context/AppContext';
import { colors, spacing, borderRadius } from '../lib/theme';
import { mockDoctor } from '../lib/mockData';
import { Info, Camera, Phone, ClipboardText } from 'phosphor-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.5;
const DISMISS_THRESHOLD = 80;

interface HelpOption {
  icon: React.ReactNode;
  labelEn: string;
  labelHi: string;
  onPress: () => void;
}

export function NeedHelpFAB() {
  const { language, patientToken, cancelToken } = useApp();
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
          const newOpacity = Math.max(0, 1 - gestureState.dy / SHEET_HEIGHT);
          backdropOpacity.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > 0.5) {
          hide();
        } else {
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              tension: 65,
              friction: 10,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const show = () => {
    setVisible(true);
    slideAnim.setValue(SHEET_HEIGHT);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  const helpOptions: HelpOption[] = [
    {
      icon: <Info size={20} color={colors.primary} weight="duotone" />,
      labelEn: 'How does Cliniq work?',
      labelHi: 'Cliniq कैसे काम करता है?',
      onPress: () => {
        hide();
        setTimeout(() => {
          const msg = language === 'hi'
            ? '1. क्लिनिक का QR स्कैन करें\n2. अपनी समस्या चुनें\n3. टोकन लें\n4. घर पर आराम करें\n5. बारी आने पर पहुँचें'
            : '1. Scan the clinic QR code\n2. Select your concern\n3. Get your token\n4. Relax at home\n5. Arrive when it\'s your turn';
          const { Alert } = require('react-native');
          Alert.alert(
            language === 'hi' ? 'Cliniq कैसे काम करता है?' : 'How does Cliniq work?',
            msg,
            [{ text: language === 'hi' ? 'समझ गया' : 'Got it' }]
          );
        }, 350);
      },
    },
    {
      icon: <Camera size={20} color={colors.primary} weight="duotone" />,
      labelEn: 'How to scan QR?',
      labelHi: 'QR कैसे स्कैन करें?',
      onPress: () => {
        hide();
        setTimeout(() => {
          const msg = language === 'hi'
            ? 'क्लिनिक के रिसेप्शन पर QR कोड होता है। "Scan QR" बटन दबाएं और कैमरा QR कोड की ओर करें। टोकन अपने आप बन जाएगा।'
            : 'The QR code is at the clinic reception. Tap "Scan QR", point your camera at it, and your token will be generated automatically.';
          const { Alert } = require('react-native');
          Alert.alert(
            language === 'hi' ? 'QR कैसे स्कैन करें?' : 'How to scan QR?',
            msg,
            [{ text: language === 'hi' ? 'समझ गया' : 'Got it' }]
          );
        }, 350);
      },
    },
    {
      icon: <ClipboardText size={20} color={colors.error} weight="duotone" />,
      labelEn: 'Cancel my token',
      labelHi: 'मेरा टोकन रद्द करें',
      onPress: () => {
        hide();
        if (!patientToken) {
          setTimeout(() => {
            const { Alert } = require('react-native');
            Alert.alert(
              language === 'hi' ? 'कोई टोकन नहीं' : 'No Token',
              language === 'hi' ? 'आपका कोई एक्टिव टोकन नहीं है।' : 'You don\'t have an active token.',
              [{ text: 'OK' }]
            );
          }, 350);
          return;
        }
        setTimeout(() => {
          const { Alert } = require('react-native');
          Alert.alert(
            language === 'hi' ? 'टोकन रद्द करें?' : 'Cancel Token?',
            language === 'hi' ? 'क्या आप सुनिश्चित हैं?' : 'Are you sure you want to cancel your token?',
            [
              { text: language === 'hi' ? 'नहीं' : 'No', style: 'cancel' },
              {
                text: language === 'hi' ? 'हाँ, रद्द करें' : 'Yes, Cancel',
                style: 'destructive',
                onPress: () => {
                  if (patientToken) cancelToken(patientToken.tokenNumber);
                },
              },
            ]
          );
        }, 350);
      },
    },
    {
      icon: <Phone size={20} color={colors.primary} weight="duotone" />,
      labelEn: 'Call Clinic',
      labelHi: 'क्लिनिक को कॉल करें',
      onPress: () => {
        hide();
        const phone = mockDoctor.phone;
        if (phone) {
          Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
        }
      },
    },
  ];

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={show}
      >
        <Text style={styles.fabText}>?</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={hide}
      >
        <Pressable style={styles.backdrop} onPress={hide}>
          <Animated.View style={[styles.backdropBg, { opacity: backdropOpacity }]} />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.sheetTitle}>
            {language === 'hi' ? 'मदद चाहिए?' : 'Need Help?'}
          </Text>
          <Text style={styles.sheetHint}>
            {language === 'hi' ? 'नीचे स्वाइप करें बंद करने के लिए' : 'Swipe down to close'}
          </Text>

          <View style={styles.optionsList}>
            {helpOptions.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.optionRow}
                activeOpacity={0.7}
                onPress={opt.onPress}
              >
                <View style={styles.optionIconWrap}>{opt.icon}</View>
                <Text style={styles.optionLabel}>
                  {language === 'hi' ? opt.labelHi : opt.labelEn}
                </Text>
                <Text style={styles.optionArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={hide}>
            <Text style={styles.closeBtnText}>
              {language === 'hi' ? 'बंद करें' : 'Close'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  fabText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: -1,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdropBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: 2,
  },
  sheetHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    opacity: 0.6,
  },

  optionsList: {
    paddingHorizontal: spacing.lg,
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 14,
  },
  optionIconWrap: {
    width: 28,
    alignItems: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionArrow: {
    fontSize: 22,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  closeBtn: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

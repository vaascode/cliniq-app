import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../lib/context/AppContext';
import { colors, typography, spacing } from '../lib/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, language, role, doctorProfile, patientProfile } = useApp();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      // If user has completed onboarding before, go directly to their dashboard
      if (role === 'doctor' && doctorProfile) {
        router.replace('/doctor/dashboard');
      } else if (role === 'patient' && patientProfile) {
        router.replace('/patient/scan');
      } else if (role === 'patient' && !patientProfile) {
        router.replace('/patient/registration');
      } else {
        // Always start fresh with get-started screen for new users or incomplete onboarding
        router.replace('/get-started');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading, language, role, doctorProfile, patientProfile]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.logo}>
            <View style={styles.crossVertical} />
            <View style={styles.crossHorizontal} />
            <View style={styles.clockDot} />
            <View style={styles.clockHand} />
          </View>
        </Animated.View>
        <Text style={styles.appName}>Cliniq</Text>
        <Text style={styles.tagline}>Smarter waiting. Better care.</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crossVertical: {
    position: 'absolute',
    width: 8,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 36,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  clockDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    top: 18,
    right: 18,
  },
  clockHand: {
    position: 'absolute',
    width: 2,
    height: 12,
    backgroundColor: '#FFFFFF',
    top: 14,
    right: 20,
    transform: [{ rotate: '45deg' }],
  },
  appName: {
    ...typography.h1,
    fontSize: 36,
    letterSpacing: 1,
  },
  tagline: {
    ...typography.bodySecondary,
    marginTop: spacing.sm,
    fontSize: 16,
  },
});

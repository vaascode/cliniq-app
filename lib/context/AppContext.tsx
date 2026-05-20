import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Language } from '../i18n';
import {
  type DoctorProfile,
  type QueuePatient,
  type PatientToken,
  type PatientProfileData,
  mockDoctor,
  mockQueue,
  mockPatientToken,
} from '../mockData';

type UserRole = 'doctor' | 'patient' | null;

export interface AuthUser {
  name: string;
  email: string;
  photo?: string;
  phone?: string;
  provider: 'google' | 'apple' | 'phone' | 'email';
}

interface AppState {
  // Auth
  authUser: AuthUser | null;
  setAuthUser: (user: AuthUser | null) => void;
  signOut: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoading: boolean;

  // Doctor state
  doctorProfile: DoctorProfile | null;
  setDoctorProfile: (profile: DoctorProfile) => void;
  queue: QueuePatient[];
  setQueue: (queue: QueuePatient[]) => void;
  nextPatient: () => void;
  undoNextPatient: () => void;
  skipAndHold: () => void;
  recallPatient: (id: string) => void;
  lastQueueSnapshot: QueuePatient[] | null;
  isClinicOpen: boolean;
  setIsClinicOpen: (open: boolean) => void;
  isQueuePaused: boolean;
  toggleQueuePaused: () => void;

  // Patient state
  patientProfile: PatientProfileData | null;
  setPatientProfile: (profile: PatientProfileData) => void;
  patientToken: PatientToken | null;
  setPatientToken: (token: PatientToken | null) => void;
  selectedClinic: { clinicName: string; doctorName: string; specialty: string; specialtyKey?: string } | null;
  setSelectedClinic: (clinic: { clinicName: string; doctorName: string; specialty: string; specialtyKey?: string } | null) => void;

  // Notification prefs
  notifyAt5: boolean;
  setNotifyAt5: (v: boolean) => void;
  notifyAt2: boolean;
  setNotifyAt2: (v: boolean) => void;

  // Arrival confirmation
  hasConfirmedArrival: boolean;
  confirmArrival: () => void;

  // Pre-consultation notes
  submitPatientNotes: (tokenNumber: number, notes: string) => void;

  // Add patient to queue (when booking a token)
  addPatientToQueue: (token: PatientToken) => void;

  // Multi-token support
  allTokens: PatientToken[];
  addToken: (token: PatientToken) => void;
  cancelToken: (tokenNumber: number) => void;

  // Dynamic ETA: tracks when the current patient's consultation started
  currentPatientStartedAt: Date | null;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [role, setRoleState] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Doctor
  const [doctorProfile, setDoctorProfileState] = useState<DoctorProfile | null>(null);
  const [queue, setQueueState] = useState<QueuePatient[]>([]);
  const [lastQueueSnapshot, setLastQueueSnapshot] = useState<QueuePatient[] | null>(null);
  const [isClinicOpen, setIsClinicOpenState] = useState(true);
  const [isQueuePaused, setIsQueuePaused] = useState(false);

  // Patient
  const [patientProfile, setPatientProfileState] = useState<PatientProfileData | null>(null);
  const [patientToken, setPatientTokenState] = useState<PatientToken | null>(null);
  const [selectedClinic, setSelectedClinicState] = useState<{
    clinicName: string;
    doctorName: string;
    specialty: string;
    specialtyKey?: string;
  } | null>(null);

  // Auth
  const [authUser, setAuthUserState] = useState<AuthUser | null>(null);

  // Notifications
  const [notifyAt5, setNotifyAt5State] = useState(true);
  const [notifyAt2, setNotifyAt2State] = useState(true);

  // Arrival
  const [hasConfirmedArrival, setHasConfirmedArrival] = useState(false);

  // Multi-token
  const [allTokens, setAllTokens] = useState<PatientToken[]>([]);

  // Dynamic ETA: when current patient's consultation started
  const [currentPatientStartedAt, setCurrentPatientStartedAt] = useState<Date | null>(null);

  useEffect(() => {
    loadPersistedState();
  }, []);

  const loadPersistedState = async () => {
    try {
      const [savedLang, savedRole, savedDoctor, savedPatient, savedAuth] = await Promise.all([
        AsyncStorage.getItem('cliniq_language'),
        AsyncStorage.getItem('cliniq_role'),
        AsyncStorage.getItem('cliniq_doctor'),
        AsyncStorage.getItem('cliniq_patient'),
        AsyncStorage.getItem('cliniq_auth_user'),
      ]);

      if (savedLang === 'en' || savedLang === 'hi') {
        setLanguageState(savedLang);
      }
      if (savedRole === 'doctor' || savedRole === 'patient') {
        setRoleState(savedRole);
      }
      if (savedDoctor) {
        setDoctorProfileState(JSON.parse(savedDoctor));
        setQueueState(mockQueue);
        // Initialize currentPatientStartedAt from mock data's 'seeing' patient
        const seeingPatient = mockQueue.find((p) => p.status === 'seeing');
        if (seeingPatient?.startedAt) {
          setCurrentPatientStartedAt(seeingPatient.startedAt);
        }
      }
      if (savedPatient) {
        setPatientProfileState(JSON.parse(savedPatient));
      }
      if (savedAuth) {
        setAuthUserState(JSON.parse(savedAuth));
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('cliniq_language', lang);
  }, []);

  const setRole = useCallback(async (r: UserRole) => {
    setRoleState(r);
    if (r) {
      await AsyncStorage.setItem('cliniq_role', r);
    } else {
      await AsyncStorage.removeItem('cliniq_role');
    }
  }, []);

  const setDoctorProfile = useCallback(async (profile: DoctorProfile) => {
    setDoctorProfileState(profile);
    setQueueState(mockQueue);
    await AsyncStorage.setItem('cliniq_doctor', JSON.stringify(profile));
  }, []);

  const setQueue = useCallback((q: QueuePatient[]) => {
    setQueueState(q);
  }, []);

  const callNextWaiting = (updated: QueuePatient[]): QueuePatient[] => {
    // Prioritize arrived patients, then fall back to first waiting
    const arrivedIndex = updated.findIndex((p) => p.status === 'waiting' && p.arrivedAt);
    const nextIndex = arrivedIndex !== -1
      ? arrivedIndex
      : updated.findIndex((p) => p.status === 'waiting');
    if (nextIndex !== -1) {
      const now = new Date();
      updated[nextIndex] = {
        ...updated[nextIndex],
        status: 'seeing',
        startedAt: now,
      };
      // Track when the current patient's consultation started (for dynamic ETA)
      setCurrentPatientStartedAt(now);
    } else {
      // No more patients waiting — clear the timestamp
      setCurrentPatientStartedAt(null);
    }
    return updated;
  };

  const nextPatient = useCallback(() => {
    setQueueState((prev) => {
      setLastQueueSnapshot([...prev]);
      const updated = [...prev];
      const currentIndex = updated.findIndex((p) => p.status === 'seeing');
      if (currentIndex !== -1) {
        updated[currentIndex] = { ...updated[currentIndex], status: 'done' };
      }
      return callNextWaiting(updated);
    });
  }, []);

  const skipAndHold = useCallback(() => {
    setQueueState((prev) => {
      setLastQueueSnapshot([...prev]);
      const updated = [...prev];
      // Mark current as on_hold
      const currentIndex = updated.findIndex((p) => p.status === 'seeing');
      if (currentIndex !== -1) {
        updated[currentIndex] = { ...updated[currentIndex], status: 'on_hold' };
      }
      return callNextWaiting(updated);
    });
  }, []);

  const recallPatient = useCallback((id: string) => {
    setQueueState((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((p) => p.id === id && p.status === 'on_hold');
      if (idx === -1) return prev;
      // Move the patient to the front of the waiting list (insert after 'seeing', before 'waiting')
      const patient = { ...updated[idx], status: 'waiting' as const };
      updated.splice(idx, 1);
      // Find where 'seeing' ends
      const seeingIdx = updated.findIndex((p) => p.status === 'seeing');
      const insertAt = seeingIdx !== -1 ? seeingIdx + 1 : 0;
      updated.splice(insertAt, 0, patient);
      return updated;
    });
  }, []);

  const undoNextPatient = useCallback(() => {
    if (lastQueueSnapshot) {
      setQueueState(lastQueueSnapshot);
      setLastQueueSnapshot(null);
    }
  }, [lastQueueSnapshot]);

  const setIsClinicOpen = useCallback((open: boolean) => {
    setIsClinicOpenState(open);
  }, []);

  const toggleQueuePaused = useCallback(() => {
    setIsQueuePaused((prev) => !prev);
  }, []);

  const setPatientProfile = useCallback(async (profile: PatientProfileData) => {
    setPatientProfileState(profile);
    await AsyncStorage.setItem('cliniq_patient', JSON.stringify(profile));
  }, []);

  const setPatientToken = useCallback((token: PatientToken | null) => {
    setPatientTokenState(token);
  }, []);

  const setSelectedClinic = useCallback(
    (clinic: { clinicName: string; doctorName: string; specialty: string; specialtyKey?: string } | null) => {
      setSelectedClinicState(clinic);
    },
    []
  );

  const setAuthUser = useCallback(async (user: AuthUser | null) => {
    setAuthUserState(user);
    if (user) {
      await AsyncStorage.setItem('cliniq_auth_user', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('cliniq_auth_user');
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthUserState(null);
    setRoleState(null);
    setDoctorProfileState(null);
    setPatientProfileState(null);
    setPatientTokenState(null);
    setAllTokens([]);
    setHasConfirmedArrival(false);
    await Promise.all([
      AsyncStorage.removeItem('cliniq_auth_user'),
      AsyncStorage.removeItem('cliniq_role'),
      AsyncStorage.removeItem('cliniq_doctor'),
      AsyncStorage.removeItem('cliniq_patient'),
    ]);
  }, []);

  const setNotifyAt5 = useCallback((v: boolean) => setNotifyAt5State(v), []);
  const setNotifyAt2 = useCallback((v: boolean) => setNotifyAt2State(v), []);

  const confirmArrival = useCallback(() => {
    setHasConfirmedArrival(true);
    // Mark this patient's entry in the doctor's queue as arrived
    setQueueState((prev) => {
      const updated = [...prev];
      const token = patientToken;
      if (token) {
        // Match by token number
        const idx = updated.findIndex(
          (p) => p.tokenNumber === token.tokenNumber && p.status === 'waiting'
        );
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], arrivedAt: new Date() };
        }
      }
      return updated;
    });
  }, [patientToken]);

  const submitPatientNotes = useCallback((tokenNumber: number, notes: string) => {
    // Update notes in the queue
    setQueueState((prev) =>
      prev.map((p) =>
        p.tokenNumber === tokenNumber ? { ...p, patientNotes: notes } : p
      )
    );
    // Also update the patientToken in state
    setPatientTokenState((prev) =>
      prev?.tokenNumber === tokenNumber ? { ...prev, patientNotes: notes } : prev
    );
    // Update in allTokens
    setAllTokens((prev) =>
      prev.map((t) =>
        t.tokenNumber === tokenNumber ? { ...t, patientNotes: notes } : t
      )
    );
  }, []);

  const addPatientToQueue = useCallback((token: PatientToken) => {
    const newPatient: QueuePatient = {
      id: `patient-${token.tokenNumber}`,
      tokenNumber: token.tokenNumber,
      name: token.patientName || patientProfile?.name || 'Patient',
      symptom: token.symptom,
      symptomEmoji: token.symptomEmoji,
      symptomKey: token.symptomKey,
      joinedAt: token.joinedAt,
      status: 'waiting',
    };
    setQueueState((prev) => [...prev, newPatient]);
  }, [patientProfile]);

  const addToken = useCallback((token: PatientToken) => {
    setPatientTokenState(token);
    setAllTokens((prev) => [...prev, token]);
    addPatientToQueue(token);
  }, [addPatientToQueue]);

  const cancelToken = useCallback((tokenNumber: number) => {
    setAllTokens((prev) => prev.filter((t) => t.tokenNumber !== tokenNumber));
    setQueueState((prev) => prev.filter((p) => p.tokenNumber !== tokenNumber));
    // If the cancelled token is the current patientToken, clear it and reset arrival
    setPatientTokenState((prev) => {
      if (prev?.tokenNumber === tokenNumber) {
        setHasConfirmedArrival(false);
        return null;
      }
      return prev;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        authUser,
        setAuthUser,
        signOut,
        language,
        setLanguage,
        role,
        setRole,
        isLoading,
        doctorProfile,
        setDoctorProfile,
        queue,
        setQueue,
        nextPatient,
        undoNextPatient,
        skipAndHold,
        recallPatient,
        lastQueueSnapshot,
        isClinicOpen,
        setIsClinicOpen,
        isQueuePaused,
        toggleQueuePaused,
        patientProfile,
        setPatientProfile,
        patientToken,
        setPatientToken,
        selectedClinic,
        setSelectedClinic,
        notifyAt5,
        setNotifyAt5,
        notifyAt2,
        setNotifyAt2,
        hasConfirmedArrival,
        confirmArrival,
        submitPatientNotes,
        addPatientToQueue,
        allTokens,
        addToken,
        cancelToken,
        currentPatientStartedAt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

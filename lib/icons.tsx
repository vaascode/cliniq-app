import React from 'react';
import {
  Stethoscope,
  User,
  GenderMale,
  GenderFemale,
  HeartBreak,
  Heartbeat,
  Wind,
  ClipboardText,
  Pill,
  Thermometer,
  Virus,
  Bandaids,
  FirstAid,
  Eye,
  Bone,
  Tooth,
  PlusCircle,
  QrCode,
  Star,
  MapPin,
  Clock,
  ChartBar,
  Gear,
  CheckCircle,
  Warning,
  Hospital,
  Queue,
  ListBullets,
  Scan,
  Phone,
  Bell,
  SignOut,
  Camera,
  CaretRight,
  CaretLeft,
  Sparkle,
  Info,
  Heart,
  House,
  Shield,
  Siren,
  MagnifyingGlass,
  Users,
  Ticket,
  Timer,
  Lightning,
  ArrowClockwise,
  LightbulbFilament,
  ArrowRight,
  ArrowLeft,
  Coffee,
  FastForward,
  ShareNetwork,
  DownloadSimple,
} from 'phosphor-react-native';
import { colors } from './theme';

const ICON_COLOR = colors.primary;
const DUOTONE_COLOR = `${colors.primary}4D`; // 30% opacity

type IconWeight = 'duotone' | 'regular' | 'bold' | 'fill' | 'thin' | 'light';

interface IconProps {
  size?: number;
  color?: string;
  weight?: IconWeight;
}

const defaultProps: IconProps = {
  size: 24,
  color: ICON_COLOR,
  weight: 'duotone' as IconWeight,
};

// ── Symptom Key → Icon Mapping ──
const symptomIconMap: Record<string, React.ComponentType<any>> = {
  coldCough: Virus,
  fever: Thermometer,
  headBodyPain: Bandaids,
  chestHeart: Heartbeat,
  chestPainDiscomfort: HeartBreak,
  stomach: FirstAid,
  eyesEarsNose: Eye,
  bonesJoints: Bone,
  prescriptionRefill: Pill,
  followUp: ClipboardText,
  somethingElse: PlusCircle,
  // Cardio
  highBloodPressure: Stethoscope,
  palpitations: Heart,
  shortnessOfBreath: Wind,
  // Dentist
  toothache: Tooth,
  cavityFilling: Tooth,
  gumProblem: Tooth,
  teethCleaning: Sparkle,
  // Ophthalmologist
  blurryVision: Eye,
  eyeRedness: Eye,
  dryEyes: Eye,
  eyeCheckup: Eye,
  // Orthopedic
  backPain: Bone,
  kneePain: Bone,
  jointStiffness: Bone,
  fractureSuspect: Bone,
  // Dermatologist
  acnePimples: FirstAid,
  skinRash: Warning,
  hairLoss: User,
  fungalInfection: Virus,
  // Pediatrician
  childFever: Thermometer,
  childCough: Virus,
  vaccination: Shield,
  growthCheckup: ChartBar,
  // Gynecologist
  periodIssues: Heart,
  pregnancyCheckup: Heart,
  pcosHormonal: ChartBar,
  urinaryInfection: FirstAid,
  // Neurologist
  headacheMigraine: Bandaids,
  dizziness: Warning,
  numbnessTingling: Warning,
  memoryIssues: Info,
  // ENT
  earPain: Stethoscope,
  sinusitis: Virus,
  soreThroat: Stethoscope,
  hearingIssue: Warning,
};

// ── Specialty Key → Icon Mapping ──
const specialtyIconMap: Record<string, React.ComponentType<any>> = {
  cardiologist: Heartbeat,
  generalPhysician: Stethoscope,
  dentist: Tooth,
  ophthalmologist: Eye,
  orthopedic: Bone,
  dermatologist: User,
  pediatrician: Heart,
  gynecologist: Heart,
  neurologist: Info,
  entSpecialist: Stethoscope,
};

export function getSymptomIcon(symptomKey: string, props?: IconProps): React.ReactElement {
  const IconComponent = symptomIconMap[symptomKey] || PlusCircle;
  const merged = { ...defaultProps, ...props };
  return <IconComponent size={merged.size} color={merged.color} weight={merged.weight} />;
}

export function getSpecialtyIcon(specialtyKey: string, props?: IconProps): React.ReactElement {
  const IconComponent = specialtyIconMap[specialtyKey] || Stethoscope;
  const merged = { ...defaultProps, ...props };
  return <IconComponent size={merged.size} color={merged.color} weight={merged.weight} />;
}

// ── Individual Icon Exports ──
export {
  Stethoscope,
  User,
  GenderMale,
  GenderFemale,
  HeartBreak,
  Heartbeat,
  Wind,
  ClipboardText,
  Pill,
  Thermometer,
  Virus,
  Bandaids,
  FirstAid,
  Eye,
  Bone,
  Tooth,
  PlusCircle,
  QrCode,
  Star,
  MapPin,
  Clock,
  ChartBar,
  Gear,
  CheckCircle,
  Warning,
  Hospital,
  Queue,
  ListBullets,
  Scan,
  Phone,
  Bell,
  SignOut,
  Camera,
  CaretRight,
  CaretLeft,
  Sparkle,
  Info,
  Heart,
  House,
  Shield,
  Siren,
  MagnifyingGlass,
  Users,
  Ticket,
  Timer,
  Lightning,
  ArrowClockwise,
  LightbulbFilament,
  ArrowRight,
  ArrowLeft,
  Coffee,
  FastForward,
  ShareNetwork,
  DownloadSimple,
};

export { ICON_COLOR, DUOTONE_COLOR, defaultProps };

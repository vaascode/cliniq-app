import { ImageSourcePropType } from 'react-native';

const avatarMap = {
  doctor: {
    male: require('../assets/avatar-doctor-male.png'),
    female: require('../assets/avatar-doctor-female.png'),
    other: require('../assets/avatar-doctor-male.png'),
  },
  patient: {
    male: require('../assets/avatar-patient-male.png'),
    female: require('../assets/avatar-patient-female.png'),
    other: require('../assets/avatar-patient-male.png'),
  },
} as const;

export function getDefaultAvatar(
  role: 'doctor' | 'patient',
  gender: 'male' | 'female' | 'other' = 'male'
): ImageSourcePropType {
  return avatarMap[role][gender];
}

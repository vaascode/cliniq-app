export interface QueuePatient {
  id: string;
  tokenNumber: number;
  name: string;
  symptom: string;
  symptomEmoji: string;
  symptomKey: string;
  joinedAt: Date;
  startedAt?: Date;
  arrivedAt?: Date;
  status: 'waiting' | 'seeing' | 'done' | 'on_hold';
  patientNotes?: string;
}

export interface DoctorProfile {
  name: string;
  clinicName: string;
  specialty: string;
  specialtyKey: string;
  consultDuration: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  address: string;
  clinicId: string;
  profileImage?: string;
  phone: string;
  maxPatientsPerDay?: number;
  breakTimeStart?: string;
  breakTimeEnd?: string;
  workingDays?: string[];
  isQueuePaused?: boolean;
  // New fields
  mapsLink?: string;
  locality?: string;
  consultFee?: number;
  medicalRegNumber?: string;
  clinicPhoto1?: string;
  clinicPhoto2?: string;
  verificationStatus?: 'pending' | 'ready';
}

export interface PatientProfileData {
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  bloodGroup: string;
  profileImage?: string;
  city?: string;
  allergies?: string;
  existingConditions?: string;
}

export interface PatientToken {
  tokenNumber: number;
  clinicName: string;
  doctorName: string;
  specialty: string;
  symptom: string;
  symptomEmoji: string;
  symptomKey: string;
  peopleAhead: number;
  estimatedWait: number;
  joinedAt: Date;
  status: 'waiting' | 'your-turn-soon' | 'your-turn' | 'done' | 'on_hold';
  patientName?: string;
  patientAge?: string;
  relation?: string; // 'self' | 'relationFather' | 'relationMother' etc.
  patientNotes?: string;
}

export const mockDoctor: DoctorProfile = {
  name: 'Dr. Rajesh Sharma',
  clinicName: 'Sharma Heart Clinic',
  specialty: 'Cardiologist',
  specialtyKey: 'cardiologist',
  consultDuration: 10,
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  address: '123 MG Road, Mumbai',
  clinicId: 'clinic-sharma-001',
  phone: '+91 98765 43210',
  maxPatientsPerDay: 30,
  breakTimeStart: '13:00',
  breakTimeEnd: '14:00',
  workingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
};

export const mockQueue: QueuePatient[] = [
  {
    id: '1',
    tokenNumber: 8,
    name: 'Amit Patel',
    symptom: 'Cold / Cough',
    symptomEmoji: '🤧',
    symptomKey: 'coldCough',
    joinedAt: new Date(Date.now() - 90 * 60000),
    startedAt: undefined,
    status: 'done',
  },
  {
    id: '2',
    tokenNumber: 9,
    name: 'Priya Singh',
    symptom: 'Fever',
    symptomEmoji: '🤒',
    symptomKey: 'fever',
    joinedAt: new Date(Date.now() - 80 * 60000),
    status: 'done',
  },
  {
    id: '3',
    tokenNumber: 10,
    name: 'Vikram Mehta',
    symptom: 'Chest / Heart',
    symptomEmoji: '🫀',
    symptomKey: 'chestHeart',
    joinedAt: new Date(Date.now() - 70 * 60000),
    status: 'done',
  },
  {
    id: '4',
    tokenNumber: 11,
    name: 'Sunita Devi',
    symptom: 'Head / Body Pain',
    symptomEmoji: '🤕',
    symptomKey: 'headBodyPain',
    joinedAt: new Date(Date.now() - 60 * 60000),
    status: 'done',
  },
  {
    id: '5',
    tokenNumber: 12,
    name: 'Raj Kumar',
    symptom: 'Fever',
    symptomEmoji: '🤒',
    symptomKey: 'fever',
    joinedAt: new Date(Date.now() - 50 * 60000),
    startedAt: new Date(Date.now() - 8 * 60000),
    arrivedAt: new Date(Date.now() - 52 * 60000),
    status: 'seeing',
  },
  {
    id: '6',
    tokenNumber: 13,
    name: 'Neha Gupta',
    symptom: 'Stomach',
    symptomEmoji: '🤢',
    symptomKey: 'stomach',
    joinedAt: new Date(Date.now() - 40 * 60000),
    arrivedAt: new Date(Date.now() - 12 * 60000),
    status: 'waiting',
  },
  {
    id: '7',
    tokenNumber: 14,
    name: 'Arun Joshi',
    symptom: 'Bones / Joints',
    symptomEmoji: '🦴',
    symptomKey: 'bonesJoints',
    joinedAt: new Date(Date.now() - 35 * 60000),
    arrivedAt: new Date(Date.now() - 10 * 60000),
    status: 'waiting',
  },
  {
    id: '8',
    tokenNumber: 15,
    name: 'Kavita Sharma',
    symptom: 'Eyes / Ears / Nose',
    symptomEmoji: '👁️',
    symptomKey: 'eyesEarsNose',
    joinedAt: new Date(Date.now() - 30 * 60000),
    status: 'waiting',
  },
  {
    id: '9',
    tokenNumber: 16,
    name: 'Deepak Verma',
    symptom: 'Follow Up',
    symptomEmoji: '📋',
    symptomKey: 'followUp',
    joinedAt: new Date(Date.now() - 25 * 60000),
    arrivedAt: new Date(Date.now() - 5 * 60000),
    status: 'waiting',
  },
  {
    id: '10',
    tokenNumber: 17,
    name: 'Anita Rao',
    symptom: 'Cold / Cough',
    symptomEmoji: '🤧',
    symptomKey: 'coldCough',
    joinedAt: new Date(Date.now() - 20 * 60000),
    status: 'waiting',
  },
  {
    id: '11',
    tokenNumber: 18,
    name: 'Suresh Pandey',
    symptom: 'Prescription Refill',
    symptomEmoji: '💊',
    symptomKey: 'prescriptionRefill',
    joinedAt: new Date(Date.now() - 15 * 60000),
    status: 'waiting',
  },
  {
    id: '12',
    tokenNumber: 19,
    name: 'Meena Iyer',
    symptom: 'Fever',
    symptomEmoji: '🤒',
    symptomKey: 'fever',
    joinedAt: new Date(Date.now() - 10 * 60000),
    arrivedAt: new Date(Date.now() - 3 * 60000),
    status: 'waiting',
  },
  {
    id: '13',
    tokenNumber: 20,
    name: 'Rajiv Khanna',
    symptom: 'Head / Body Pain',
    symptomEmoji: '🤕',
    symptomKey: 'headBodyPain',
    joinedAt: new Date(Date.now() - 5 * 60000),
    status: 'waiting',
  },
];

export const mockPatientToken: PatientToken = {
  tokenNumber: 47,
  clinicName: 'Sharma Heart Clinic',
  doctorName: 'Dr. Rajesh Sharma',
  specialty: 'Cardiologist',
  symptom: 'Fever',
  symptomEmoji: '🤒',
  symptomKey: 'fever',
  peopleAhead: 5,
  estimatedWait: 35,
  joinedAt: new Date(),
  status: 'waiting',
};

export const recentClinics = [
  {
    id: 'nearby-001',
    clinicName: 'Sharma Heart Clinic',
    doctorName: 'Dr. Rajesh Sharma',
    specialty: 'Cardiologist',
    specialtyKey: 'cardiologist',
  },
  {
    id: 'nearby-003',
    clinicName: 'Gupta Dental Care',
    doctorName: 'Dr. Pooja Gupta',
    specialty: 'Dentist',
    specialtyKey: 'dentist',
  },
  {
    id: 'nearby-005',
    clinicName: 'Mehta Eye Clinic',
    doctorName: 'Dr. Sanjay Mehta',
    specialty: 'Ophthalmologist',
    specialtyKey: 'ophthalmologist',
  },
];

export const symptomCards = [
  { key: 'coldCough', emoji: '🤧', baseTime: 8 },
  { key: 'fever', emoji: '🤒', baseTime: 10 },
  { key: 'headBodyPain', emoji: '🤕', baseTime: 12 },
  { key: 'chestHeart', emoji: '🫀', baseTime: 15 },
  { key: 'stomach', emoji: '🤢', baseTime: 10 },
  { key: 'eyesEarsNose', emoji: '👁️', baseTime: 12 },
  { key: 'bonesJoints', emoji: '🦴', baseTime: 14 },
  { key: 'prescriptionRefill', emoji: '💊', baseTime: 5 },
  { key: 'followUp', emoji: '📋', baseTime: 8 },
  { key: 'somethingElse', emoji: '🆕', baseTime: 12 },
];

export function estimateWaitTime(
  symptomBaseTime: number,
  peopleAhead: number,
  avgConsultTime: number = 10
): number {
  const waitInQueue = peopleAhead * avgConsultTime;
  return waitInQueue;
}

export function estimateConsultTime(symptomBaseTime: number): number {
  const variance = Math.floor(Math.random() * 4) - 2;
  return Math.max(5, symptomBaseTime + variance);
}

export interface NearbyClinic {
  id: string;
  clinicName: string;
  doctorName: string;
  specialty: string;
  specialtyKey: string;
  distance: string;
  rating: number;
  reviews: number;
  address: string;
  waitTime: string;
  consultFee: number;
  timings: string;
  phone: string;
  experience: string;
  about: string;
  services: string[];
  patientsToday: number;
}

export const nearbyClinics: NearbyClinic[] = [
  {
    id: 'nearby-001',
    clinicName: 'Sharma Heart Clinic',
    doctorName: 'Dr. Rajesh Sharma',
    specialty: 'Cardiologist',
    specialtyKey: 'cardiologist',
    distance: '0.8 km',
    rating: 4.8,
    reviews: 324,
    address: '123 MG Road, Sector 5, Indore',
    waitTime: '~15 min',
    consultFee: 500,
    timings: 'Mon-Sat, 9:00 AM - 5:00 PM',
    phone: '+91 98765 43210',
    experience: '18 years',
    about: 'Dr. Rajesh Sharma is a renowned cardiologist specializing in preventive cardiology, heart failure management, and interventional procedures. He has treated over 10,000 patients.',
    services: ['ECG', 'Echo', 'Stress Test', 'BP Monitoring', 'Cholesterol Management'],
    patientsToday: 12,
  },
  {
    id: 'nearby-002',
    clinicName: 'City Care Clinic',
    doctorName: 'Dr. Ananya Verma',
    specialty: 'General Physician',
    specialtyKey: 'generalPhysician',
    distance: '1.2 km',
    rating: 4.6,
    reviews: 198,
    address: '45 Station Road, Near Metro, Indore',
    waitTime: '~25 min',
    consultFee: 300,
    timings: 'Mon-Sat, 10:00 AM - 8:00 PM',
    phone: '+91 98123 45678',
    experience: '12 years',
    about: 'Dr. Ananya Verma is a trusted general physician known for her thorough diagnosis and patient-friendly approach. She specializes in managing chronic conditions and preventive health.',
    services: ['General Checkup', 'Blood Tests', 'Diabetes Management', 'Thyroid Care', 'Vaccination'],
    patientsToday: 18,
  },
  {
    id: 'nearby-003',
    clinicName: 'Gupta Dental Care',
    doctorName: 'Dr. Pooja Gupta',
    specialty: 'Dentist',
    specialtyKey: 'dentist',
    distance: '1.5 km',
    rating: 4.9,
    reviews: 412,
    address: '78 Market Complex, Block C, Indore',
    waitTime: '~10 min',
    consultFee: 400,
    timings: 'Mon-Sat, 9:30 AM - 7:00 PM',
    phone: '+91 97654 32100',
    experience: '15 years',
    about: 'Dr. Pooja Gupta is a highly skilled dentist with expertise in cosmetic dentistry, root canal treatments, and orthodontics. Her clinic is equipped with state-of-the-art technology.',
    services: ['Root Canal', 'Teeth Whitening', 'Braces', 'Dental Implants', 'Teeth Cleaning'],
    patientsToday: 8,
  },
  {
    id: 'nearby-004',
    clinicName: 'Wellness Ortho Center',
    doctorName: 'Dr. Vikram Singh',
    specialty: 'Orthopedic',
    specialtyKey: 'orthopedic',
    distance: '2.1 km',
    rating: 4.7,
    reviews: 156,
    address: '12 Park Avenue, Phase 2, Indore',
    waitTime: '~20 min',
    consultFee: 600,
    timings: 'Mon-Fri, 10:00 AM - 6:00 PM',
    phone: '+91 96543 21098',
    experience: '20 years',
    about: 'Dr. Vikram Singh is an experienced orthopedic surgeon specializing in joint replacement, sports injuries, and spinal disorders. He has performed over 5,000 successful surgeries.',
    services: ['X-Ray', 'Joint Replacement', 'Physiotherapy', 'Sports Injury', 'Fracture Care'],
    patientsToday: 10,
  },
  {
    id: 'nearby-005',
    clinicName: 'Mehta Eye Clinic',
    doctorName: 'Dr. Sanjay Mehta',
    specialty: 'Ophthalmologist',
    specialtyKey: 'ophthalmologist',
    distance: '2.8 km',
    rating: 4.5,
    reviews: 89,
    address: '34 Civil Lines, Main Road, Indore',
    waitTime: '~30 min',
    consultFee: 450,
    timings: 'Mon-Sat, 9:00 AM - 4:00 PM',
    phone: '+91 95432 10987',
    experience: '22 years',
    about: 'Dr. Sanjay Mehta is a leading ophthalmologist with expertise in cataract surgery, LASIK, and retinal disorders. He has restored vision for thousands of patients across central India.',
    services: ['Eye Checkup', 'Cataract Surgery', 'LASIK', 'Glaucoma Treatment', 'Retina Care'],
    patientsToday: 6,
  },
  {
    id: 'nearby-006',
    clinicName: 'Agarwal Skin & Hair',
    doctorName: 'Dr. Neha Agarwal',
    specialty: 'Dermatologist',
    specialtyKey: 'dermatologist',
    distance: '3.4 km',
    rating: 4.7,
    reviews: 267,
    address: '56 Palasia Square, AB Road, Indore',
    waitTime: '~20 min',
    consultFee: 550,
    timings: 'Tue-Sun, 11:00 AM - 7:00 PM',
    phone: '+91 94321 09876',
    experience: '10 years',
    about: 'Dr. Neha Agarwal is a renowned dermatologist specializing in acne treatment, hair restoration, and cosmetic procedures. She uses the latest laser and PRP technologies.',
    services: ['Acne Treatment', 'Hair PRP', 'Laser Treatment', 'Skin Allergy', 'Cosmetic Dermatology'],
    patientsToday: 14,
  },
];

// AI-recommended concerns per specialty
export interface RecommendedConcern {
  key: string;
  emoji: string;
  label: string;
  labelHi: string;
  baseTime: number;
}

export const specialtyRecommendations: Record<string, RecommendedConcern[]> = {
  cardiologist: [
    { key: 'chestPainDiscomfort', emoji: '💔', label: 'Chest Pain / Discomfort', labelHi: 'सीने में दर्द / बेचैनी', baseTime: 15 },
    { key: 'highBloodPressure', emoji: '🩺', label: 'High Blood Pressure', labelHi: 'हाई ब्लड प्रेशर', baseTime: 12 },
    { key: 'palpitations', emoji: '💓', label: 'Palpitations', labelHi: 'दिल की धड़कन तेज़', baseTime: 12 },
    { key: 'shortnessOfBreath', emoji: '😮‍💨', label: 'Shortness of Breath', labelHi: 'सांस की तकलीफ', baseTime: 14 },
    { key: 'followUp', emoji: '📋', label: 'Follow-up Visit', labelHi: 'फॉलो अप', baseTime: 8 },
    { key: 'prescriptionRefill', emoji: '💊', label: 'Prescription Refill', labelHi: 'दवाई दोबारा', baseTime: 5 },
  ],
  generalPhysician: [
    { key: 'coldCough', emoji: '🤧', label: 'Cold / Cough', labelHi: 'सर्दी / खांसी', baseTime: 8 },
    { key: 'fever', emoji: '🤒', label: 'Fever', labelHi: 'बुखार', baseTime: 10 },
    { key: 'headBodyPain', emoji: '🤕', label: 'Head / Body Pain', labelHi: 'सिर / बदन दर्द', baseTime: 12 },
    { key: 'stomach', emoji: '🤢', label: 'Stomach Issues', labelHi: 'पेट की समस्या', baseTime: 10 },
    { key: 'followUp', emoji: '📋', label: 'Follow-up Visit', labelHi: 'फॉलो अप', baseTime: 8 },
    { key: 'prescriptionRefill', emoji: '💊', label: 'Prescription Refill', labelHi: 'दवाई दोबारा', baseTime: 5 },
  ],
  dentist: [
    { key: 'toothache', emoji: '🦷', label: 'Toothache', labelHi: 'दांत दर्द', baseTime: 15 },
    { key: 'cavityFilling', emoji: '🪥', label: 'Cavity / Filling', labelHi: 'कैविटी / फिलिंग', baseTime: 20 },
    { key: 'gumProblem', emoji: '🩸', label: 'Gum Problem', labelHi: 'मसूड़ों की समस्या', baseTime: 12 },
    { key: 'teethCleaning', emoji: '✨', label: 'Teeth Cleaning', labelHi: 'दांत साफ़ करवाना', baseTime: 25 },
    { key: 'followUp', emoji: '📋', label: 'Follow-up Visit', labelHi: 'फॉलो अप', baseTime: 8 },
    { key: 'prescriptionRefill', emoji: '💊', label: 'Prescription Refill', labelHi: 'दवाई दोबारा', baseTime: 5 },
  ],
  ophthalmologist: [
    { key: 'blurryVision', emoji: '👓', label: 'Blurry Vision', labelHi: 'धुंधला दिखना', baseTime: 15 },
    { key: 'eyeRedness', emoji: '👁️', label: 'Eye Redness / Irritation', labelHi: 'आँख लाल / जलन', baseTime: 12 },
    { key: 'dryEyes', emoji: '💧', label: 'Dry Eyes', labelHi: 'आँखों में सूखापन', baseTime: 10 },
    { key: 'eyeCheckup', emoji: '🔍', label: 'Routine Eye Checkup', labelHi: 'आँखों की जांच', baseTime: 20 },
    { key: 'followUp', emoji: '📋', label: 'Follow-up Visit', labelHi: 'फॉलो अप', baseTime: 8 },
    { key: 'prescriptionRefill', emoji: '💊', label: 'Prescription Refill', labelHi: 'दवाई दोबारा', baseTime: 5 },
  ],
  orthopedic: [
    { key: 'backPain', emoji: '🔙', label: 'Back Pain', labelHi: 'कमर दर्द', baseTime: 15 },
    { key: 'kneePain', emoji: '🦵', label: 'Knee Pain', labelHi: 'घुटने का दर्द', baseTime: 14 },
    { key: 'jointStiffness', emoji: '🦴', label: 'Joint Stiffness', labelHi: 'जोड़ों में अकड़न', baseTime: 12 },
    { key: 'fractureSuspect', emoji: '🩻', label: 'Fracture / Injury', labelHi: 'फ्रैक्चर / चोट', baseTime: 20 },
    { key: 'followUp', emoji: '📋', label: 'Follow-up Visit', labelHi: 'फॉलो अप', baseTime: 8 },
    { key: 'prescriptionRefill', emoji: '💊', label: 'Prescription Refill', labelHi: 'दवाई दोबारा', baseTime: 5 },
  ],
  dermatologist: [
    { key: 'acnePimples', emoji: '😣', label: 'Acne / Pimples', labelHi: 'मुहांसे', baseTime: 12 },
    { key: 'skinRash', emoji: '🔴', label: 'Skin Rash / Allergy', labelHi: 'त्वचा पर दाने / एलर्जी', baseTime: 14 },
    { key: 'hairLoss', emoji: '💇', label: 'Hair Loss', labelHi: 'बालों का झड़ना', baseTime: 15 },
    { key: 'fungalInfection', emoji: '🍄', label: 'Fungal Infection', labelHi: 'फंगल इन्फेक्शन', baseTime: 12 },
    { key: 'followUp', emoji: '📋', label: 'Follow-up Visit', labelHi: 'फॉलो अप', baseTime: 8 },
    { key: 'prescriptionRefill', emoji: '💊', label: 'Prescription Refill', labelHi: 'दवाई दोबारा', baseTime: 5 },
  ],
  pediatrician: [
    { key: 'childFever', emoji: '🤒', label: 'Child Fever', labelHi: 'बच्चे को बुखार', baseTime: 12 },
    { key: 'childCough', emoji: '🤧', label: 'Cough / Cold', labelHi: 'खांसी / सर्दी', baseTime: 10 },
    { key: 'vaccination', emoji: '💉', label: 'Vaccination', labelHi: 'टीकाकरण', baseTime: 15 },
    { key: 'growthCheckup', emoji: '📏', label: 'Growth Checkup', labelHi: 'ग्रोथ चेकअप', baseTime: 20 },
    { key: 'followUp', emoji: '📋', label: 'Follow-up Visit', labelHi: 'फॉलो अप', baseTime: 8 },
    { key: 'prescriptionRefill', emoji: '💊', label: 'Prescription Refill', labelHi: 'दवाई दोबारा', baseTime: 5 },
  ],
  gynecologist: [
    { key: 'periodIssues', emoji: '🩸', label: 'Period Issues', labelHi: 'पीरियड की समस्या', baseTime: 15 },
    { key: 'pregnancyCheckup', emoji: '🤰', label: 'Pregnancy Checkup', labelHi: 'गर्भावस्था जांच', baseTime: 20 },
    { key: 'pcosHormonal', emoji: '⚖️', label: 'PCOS / Hormonal', labelHi: 'PCOS / हार्मोनल', baseTime: 15 },
    { key: 'urinaryInfection', emoji: '🚿', label: 'Urinary Infection', labelHi: 'यूरिन इन्फेक्शन', baseTime: 12 },
    { key: 'followUp', emoji: '📋', label: 'Follow-up Visit', labelHi: 'फॉलो अप', baseTime: 8 },
    { key: 'prescriptionRefill', emoji: '💊', label: 'Prescription Refill', labelHi: 'दवाई दोबारा', baseTime: 5 },
  ],
  neurologist: [
    { key: 'headacheMigraine', emoji: '🤕', label: 'Headache / Migraine', labelHi: 'सिरदर्द / माइग्रेन', baseTime: 15 },
    { key: 'dizziness', emoji: '😵', label: 'Dizziness / Vertigo', labelHi: 'चक्कर आना', baseTime: 12 },
    { key: 'numbnessTingling', emoji: '🖐️', label: 'Numbness / Tingling', labelHi: 'सुन्नपन / झुनझुनी', baseTime: 14 },
    { key: 'memoryIssues', emoji: '🧠', label: 'Memory Issues', labelHi: 'याददाश्त की समस्या', baseTime: 18 },
    { key: 'followUp', emoji: '📋', label: 'Follow-up Visit', labelHi: 'फॉलो अप', baseTime: 8 },
    { key: 'prescriptionRefill', emoji: '💊', label: 'Prescription Refill', labelHi: 'दवाई दोबारा', baseTime: 5 },
  ],
  entSpecialist: [
    { key: 'earPain', emoji: '👂', label: 'Ear Pain / Infection', labelHi: 'कान दर्द / संक्रमण', baseTime: 12 },
    { key: 'sinusitis', emoji: '🤧', label: 'Sinusitis / Nasal Block', labelHi: 'साइनस / नाक बंद', baseTime: 14 },
    { key: 'soreThroat', emoji: '🗣️', label: 'Sore Throat', labelHi: 'गले में खराश', baseTime: 10 },
    { key: 'hearingIssue', emoji: '🔇', label: 'Hearing Issue', labelHi: 'सुनने में दिक्कत', baseTime: 15 },
    { key: 'followUp', emoji: '📋', label: 'Follow-up Visit', labelHi: 'फॉलो अप', baseTime: 8 },
    { key: 'prescriptionRefill', emoji: '💊', label: 'Prescription Refill', labelHi: 'दवाई दोबारा', baseTime: 5 },
  ],
};

// Helper: get specialtyKey from specialty display name
export function getSpecialtyKey(specialty: string): string {
  const map: Record<string, string> = {
    'Cardiologist': 'cardiologist',
    'General Physician': 'generalPhysician',
    'Dentist': 'dentist',
    'Ophthalmologist': 'ophthalmologist',
    'Orthopedic': 'orthopedic',
    'Dermatologist': 'dermatologist',
    'Pediatrician': 'pediatrician',
    'Gynecologist': 'gynecologist',
    'Neurologist': 'neurologist',
    'ENT Specialist': 'entSpecialist',
    // Hindi
    'हृदय रोग विशेषज्ञ': 'cardiologist',
    'सामान्य चिकित्सक': 'generalPhysician',
    'दंत चिकित्सक': 'dentist',
    'नेत्र विशेषज्ञ': 'ophthalmologist',
    'हड्डी रोग विशेषज्ञ': 'orthopedic',
    'त्वचा विशेषज्ञ': 'dermatologist',
    'बाल रोग विशेषज्ञ': 'pediatrician',
    'स्त्री रोग विशेषज्ञ': 'gynecologist',
    'तंत्रिका विशेषज्ञ': 'neurologist',
    'कान-नाक-गला विशेषज्ञ': 'entSpecialist',
  };
  return map[specialty] || 'generalPhysician';
}

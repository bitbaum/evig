import type { CheckboxOption } from './types'

export const SERVICE_OPTIONS: CheckboxOption[] = [
  { id: 'laptop_repair', label: 'Laptop-Reparatur' },
  { id: 'phone_repair', label: 'Smartphone-Reparatur' },
  { id: 'tablet_repair', label: 'Tablet-Reparatur' },
  { id: 'desktop_repair', label: 'Desktop-PC Reparatur' },
  { id: 'console_repair', label: 'Spielkonsole Reparatur' },
  { id: 'audio_repair', label: 'Audio-Geräte Reparatur' },
  { id: 'other', label: 'Sonstige' },
]

export const SPECIALIZATION_OPTIONS: CheckboxOption[] = [
  { id: 'screen_replacement', label: 'Bildschirmtausch' },
  { id: 'battery_replacement', label: 'Akkuersatz' },
  { id: 'data_recovery', label: 'Datenrettung' },
  { id: 'motherboard_repair', label: 'Mainboard-Reparatur' },
  { id: 'water_damage', label: 'Wasserschaden' },
  { id: 'diagnostics', label: 'Diagnose' },
  { id: 'cleaning', label: 'Reinigung' },
  { id: 'upgrades', label: 'Aufrüstungen' },
]

export const SERVICE_RADIUS_OPTIONS = [
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '30', label: '30 km' },
  { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
  { value: '0', label: 'Überall (remote only)' },
]

export const INITIAL_FORM_DATA: import('./types').RepairerApplicationForm = {
  businessType: 'individual',
  businessName: '',
  description: '',
  yearsExperience: '',
  phone: '',
  website: '',
  address: '',
  city: '',
  postalCode: '',
  serviceRadius: '30',
  remoteServices: false,
  hourlyRate: '',
  emergencyFee: '',
  homeVisitFee: '',
  servicesOffered: [],
  specializations: [],
  certifications: [],
  insuranceInfo: '',
  portfolioImages: [],
  idDocument: null,
  certificationsDocs: [],
  termsAccepted: false,
}

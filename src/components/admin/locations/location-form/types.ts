import { Building2, Home, Monitor, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface AccessibilityInfo {
  wheelchairAccessible: boolean
  parkingAvailable: boolean
  publicTransport: string
  additionalInfo: string
}

export type LocationType = 'venue' | 'home' | 'online' | 'community_center' | 'business'

export interface LocationFormData {
  name: string
  type: LocationType
  description: string
  address_line1: string
  address_line2: string
  postal_code: string
  city: string
  canton: string
  country: string
  latitude: string
  longitude: string
  max_capacity: string
  facilities: string[]
  accessibility_info: AccessibilityInfo
  contact_name: string
  contact_phone: string
  contact_email: string
}

export interface SubmitResult {
  success: boolean
  message: string
}

export interface LocationTypeOption {
  id: LocationType
  label: string
  icon: LucideIcon
  description: string
}

export const LOCATION_TYPES: LocationTypeOption[] = [
  { id: 'venue', label: 'Veranstaltungsort', icon: Building2, description: 'Professionelle Veranstaltungsräume' },
  { id: 'home', label: 'Zu Hause', icon: Home, description: 'Private Wohnungen/Häuser' },
  { id: 'online', label: 'Online', icon: Monitor, description: 'Virtuelle Veranstaltungen' },
  { id: 'community_center', label: 'Gemeinschaftszentrum', icon: Users, description: 'Öffentliche Gemeinschaftsräume' },
  { id: 'business', label: 'Geschäft', icon: Building2, description: 'Gewerbliche Räumlichkeiten' },
]

export const FACILITIES = [
  'wheelchair_accessible',
  'parking',
  'wifi',
  'kitchen',
  'projector',
  'sound_system',
  'stage',
  'restrooms',
  'storage',
  'catering',
] as const

export const SWISS_CANTONS = [
  'Aargau', 'Appenzell Ausserrhoden', 'Appenzell Innerrhoden', 'Basel-Landschaft',
  'Basel-Stadt', 'Bern', 'Freiburg', 'Genf', 'Glarus', 'Graubünden', 'Jura',
  'Luzern', 'Neuenburg', 'Nidwalden', 'Obwalden', 'Schaffhausen', 'Schwyz',
  'Solothurn', 'St. Gallen', 'Tessin', 'Thurgau', 'Uri', 'Waadt', 'Wallis',
  'Zug', 'Zürich',
] as const

export const INITIAL_LOCATION_FORM_DATA: LocationFormData = {
  name: '',
  type: 'venue',
  description: '',
  address_line1: '',
  address_line2: '',
  postal_code: '',
  city: '',
  canton: '',
  country: 'Switzerland',
  latitude: '',
  longitude: '',
  max_capacity: '',
  facilities: [],
  accessibility_info: {
    wheelchairAccessible: false,
    parkingAvailable: false,
    publicTransport: '',
    additionalInfo: '',
  },
  contact_name: '',
  contact_phone: '',
  contact_email: '',
}

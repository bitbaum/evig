import { Building2, Home, Monitor, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { LocationType } from '@/config/location-status'

export type { LocationType }

export interface AccessibilityInfo {
  wheelchairAccessible: boolean
  parkingAvailable: boolean
  publicTransport: string
  additionalInfo: string
}

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

// Re-export from SSOT
export { SWISS_CANTONS } from '@/config/swiss-cantons'

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

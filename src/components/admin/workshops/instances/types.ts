export type { Workshop, WorkshopInstanceWithDetails } from '@/components/workshops/types'
import { LOCATIONS } from '@/config/org'

export interface InstanceFormData {
  workshopId: string
  startDate: string
  endDate: string
  location: string
  instructor: string
  maxParticipants: string
  notes: string
  status: string
}

export const initialFormData: InstanceFormData = {
  workshopId: '',
  startDate: '',
  endDate: '',
  location: `RevampIT, ${LOCATIONS.store.full}`,
  instructor: '',
  maxParticipants: '',
  notes: '',
  status: 'scheduled',
}

export interface InstanceFiltersState {
  workshopId: string
  status: string
  upcoming: boolean
}

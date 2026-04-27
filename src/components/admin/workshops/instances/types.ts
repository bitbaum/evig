export type { Workshop, WorkshopInstanceWithDetails } from '@/components/workshops/types'
import { LOCATIONS } from '@/config/org'
import { WORKSHOP_INSTANCE_STATUS } from '@/config/workshops'

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
  status: WORKSHOP_INSTANCE_STATUS.SCHEDULED,
}

export interface InstanceFiltersState {
  workshopId: string
  status: string
  upcoming: boolean
}

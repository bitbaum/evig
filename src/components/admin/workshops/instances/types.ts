export type { Workshop, WorkshopInstanceWithDetails } from '@/components/workshops/types'
import { ORG, LOCATIONS } from '@/config/org'
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
  location: `${ORG.name}, ${LOCATIONS.store.full}`,
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

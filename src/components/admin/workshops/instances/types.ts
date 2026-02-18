export type { Workshop, WorkshopInstanceWithDetails } from '@/components/workshops/types'

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
  location: 'RevampIT, Birmensdorferstr. 379, 8055 Zürich',
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

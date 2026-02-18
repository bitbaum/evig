import { WORKSHOP_LEVELS } from '@/config/workshops'

export interface WorkshopFormData {
  title: string
  description: string
  shortDescription: string
  category: string
  level: string
  instructor: string
  instructorBio: string
  date: string
  startTime: string
  endTime: string
  duration: string
  location: string
  locationDetails: string
  maxParticipants: string
  price: string
  prerequisites: string
  learningObjectives: string[]
  materials: string
  tags: string[]
  images: File[]
  status: string
}

export const INITIAL_WORKSHOP_FORM_DATA: WorkshopFormData = {
  title: '',
  description: '',
  shortDescription: '',
  category: '',
  level: 'beginner',
  instructor: '',
  instructorBio: '',
  date: '',
  startTime: '',
  endTime: '',
  duration: '',
  location: '',
  locationDetails: '',
  maxParticipants: '12',
  price: '',
  prerequisites: '',
  learningObjectives: [''],
  materials: '',
  tags: [],
  images: [],
  status: 'draft',
}

export const WORKSHOP_LEVEL_OPTIONS = WORKSHOP_LEVELS.filter(l => l.id !== 'all').map(l => ({
  value: l.id,
  label: l.name,
  description: l.id === 'beginner' ? 'Keine Vorkenntnisse erforderlich' :
               l.id === 'intermediate' ? 'Grundkenntnisse empfohlen' :
               'Umfassende Vorkenntnisse erforderlich',
}))

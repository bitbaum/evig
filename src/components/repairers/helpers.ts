/**
 * Shared helpers for repairer pages
 */

import { formatPriceCents } from '@/config/marketplace'

export const SERVICE_CATEGORIES = [
  { value: 'laptop_repair', label: 'Laptop-Reparatur', icon: '💻' },
  { value: 'phone_repair', label: 'Smartphone-Reparatur', icon: '📱' },
  { value: 'tablet_repair', label: 'Tablet-Reparatur', icon: '📱' },
  { value: 'desktop_repair', label: 'Desktop-PC Reparatur', icon: '🖥️' },
  { value: 'console_repair', label: 'Spielkonsole Reparatur', icon: '🎮' },
  { value: 'audio_repair', label: 'Audio-Geräte Reparatur', icon: '🔊' },
  { value: 'other', label: 'Anderes Gerät', icon: '🔧' },
] as const

export const URGENCY_OPTIONS = [
  { value: 'low', label: 'Niedrig', description: 'Innerhalb von 1-2 Wochen' },
  { value: 'normal', label: 'Normal', description: 'Innerhalb einer Woche' },
  { value: 'high', label: 'Dringend', description: 'So schnell wie möglich' },
  { value: 'emergency', label: 'Notfall', description: 'Heute/Morgen (Aufpreis)' },
] as const

/** @deprecated Use formatPriceCents from @/config/marketplace directly */
export const formatPrice = formatPriceCents

export function getServiceIcon(category: string): string {
  const found = SERVICE_CATEGORIES.find(
    (c) => c.value === category.toLowerCase()
  )
  return found?.icon ?? '🔧'
}

/** Get next N days as ISO date strings */
export function getAvailableDates(days = 14): string[] {
  const dates: string[] = []
  const today = new Date()
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

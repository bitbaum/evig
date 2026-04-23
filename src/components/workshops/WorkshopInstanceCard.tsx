'use client'

import { Calendar, MapPin, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatDateTimeWithWeekday } from '@/lib/date-formats'
import type { WorkshopInstance } from './types'

interface WorkshopInstanceCardProps {
  instance: WorkshopInstance
  spotsLeft: number
  priceCents: number
}

export function WorkshopInstanceCard({
  instance,
  spotsLeft,
  priceCents
}: WorkshopInstanceCardProps) {
  const t = useTranslations('components.workshopInstanceCard')
  return (
    <>
      {/* Workshop Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <span>{formatDateTimeWithWeekday(instance.start_date)}</span>
          </div>

          <div className="flex items-center text-sm">
            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
            <span>{instance.location}</span>
          </div>

          <div className="flex items-center text-sm">
            <Users className="w-4 h-4 text-gray-400 mr-2" />
            <span>{t('spotsAvailable', { count: spotsLeft })}</span>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-green-600">
          {priceCents === 0 ? t('free') : `CHF ${(priceCents / 100).toFixed(0)}`}
        </div>
        {priceCents > 0 && (
          <div className="text-sm text-gray-500">{t('vatIncluded')}</div>
        )}
      </div>
    </>
  )
}

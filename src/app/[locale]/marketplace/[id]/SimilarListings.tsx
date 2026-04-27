'use client'

import { Link } from '@/i18n/navigation'
import Heading from '@/components/ui/Heading'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { formatCHF } from '@/config/marketplace'
import { ListingImage } from '@/components/marketplace/ListingImage'
import type { SimilarListing } from './types'
import { useTranslations } from 'next-intl'

interface SimilarListingsProps {
  listings: SimilarListing[]
}

export function SimilarListings({ listings }: SimilarListingsProps) {
  const t = useTranslations('marketplace.listing')
  if (listings.length === 0) return null

  return (
    <div className="mt-6">
      <Heading level={2} className="text-lg text-gray-900 dark:text-white mb-4">{t('similarListings')}</Heading>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {listings.map((sim) => {
          const simCondition = getConditionBadge(sim.condition)
          return (
            <Link
              key={sim.id}
              href={`/marketplace/${sim.id}`}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <div className="relative aspect-[4/3]">
                <ListingImage src={sim.thumbnail} alt={sim.title} fallbackIconSize="w-10 h-10" />
                <div className="absolute top-2 left-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${simCondition.color}`}>
                    {simCondition.label}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <Heading level={3} className="text-gray-900 dark:text-white mb-1 line-clamp-2 text-sm group-hover:text-green-600 transition-colors">
                  {sim.title}
                </Heading>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCHF(Number(sim.price_chf))}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

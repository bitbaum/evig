'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  CheckCircle,
  Sparkles,
  BookOpen,
  Plus,
} from 'lucide-react'
import {
  WORKSHOP_CATEGORIES,
  WORKSHOP_LEVELS,
  WORKSHOP_INSTANCE_STATUS,
  getCategoryIcon,
  getLevelBadgeClass,
} from '@/config/workshops'
import Heading from '@/components/ui/Heading'
import { formatDateShort } from '@/lib/date-formats'
import type { WorkshopWithInstances } from '@/components/workshops/types'
import { ORG } from '@/config/org'
import { useTranslations } from 'next-intl'
import { formatCentsToChf } from '@/lib/pricing'
import { PageShell } from '@/components/layout/PageShell'

interface WorkshopBrowseClientProps {
  workshops: WorkshopWithInstances[]
}

export default function WorkshopBrowseClient({ workshops }: WorkshopBrowseClientProps) {
  const t = useTranslations('workshops.browse')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  const filteredWorkshops = workshops.filter(workshop => {
    const matchesCategory =
      categoryFilter === 'all' ||
      (workshop.category || '').toLowerCase() === categoryFilter.toLowerCase()
    const matchesLevel =
      levelFilter === 'all' ||
      (workshop.level || '').toLowerCase() === levelFilter.toLowerCase()
    return matchesCategory && matchesLevel
  })

  return (
    <>
      {/* Compact hero — workshops visible without scrolling */}
      <div className="bg-white dark:bg-neutral-950 border-b border-subtle dark:border-white/6 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Heading level={1} className="text-2xl sm:text-3xl font-bold text-text-primary">{t('title')}</Heading>
              <p className="text-sm text-text-secondary mt-1">
                {t('subtitle', { count: workshops.length, orgName: ORG.name })}
              </p>
            </div>
            <Button as={Link} href="/workshops/propose" variant="primary">
              <Plus className="w-4 h-4" />
              {t('proposeButton')}
            </Button>
          </div>
        </div>
      </div>

      <PageShell py="pt-12 pb-16">
        {/* Filter Bar */}
        <div className="card-shell p-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Dropdown */}
            <div>
              <label htmlFor="filter-category" className="block text-xs font-medium text-text-secondary mb-1">
                {t('filterCategory')}
              </label>
              <Select
                id="filter-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">{t('allCategories')}</option>
                {WORKSHOP_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </div>

            {/* Level Dropdown */}
            <div>
              <label htmlFor="filter-level" className="block text-xs font-medium text-text-secondary mb-1">
                {t('filterLevel')}
              </label>
              <Select
                id="filter-level"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <option value="all">{t('allLevels')}</option>
                {WORKSHOP_LEVELS.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </Select>
            </div>

            {/* Clear filters */}
            {(categoryFilter !== 'all' || levelFilter !== 'all') && (
              <button
                onClick={() => {
                  setCategoryFilter('all')
                  setLevelFilter('all')
                }}
                className="self-end px-3 py-2 text-sm text-action hover:text-primary-700 font-medium"
              >
                {t('clearFilters')}
              </button>
            )}

            {/* Results count */}
            <div className="ml-auto self-end text-sm text-text-tertiary">
              {t('resultCount', { count: filteredWorkshops.length })}
            </div>
          </div>
        </div>

        {/* Workshops Grid */}
        {filteredWorkshops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorkshops.map((workshop) => {
              const IconComponent = getCategoryIcon(workshop.category)
              const instances = workshop.instances || []
              const upcomingInstances = instances.filter(
                inst => inst.status === WORKSHOP_INSTANCE_STATUS.SCHEDULED && new Date(inst.start_date) > new Date()
              )
              const nextInstance = upcomingInstances[0]
              const maxParticipants = nextInstance?.max_participants ?? workshop.max_participants
              const spotsLeft = nextInstance
                ? maxParticipants - nextInstance.current_participants
                : null

              return (
                <div key={workshop.id} className="card-shell overflow-hidden hover:border-neutral-300 transition-all flex flex-col">
                  {/* Workshop Header */}
                  <div className="p-6 border-b border-subtle flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <IconComponent className="w-6 h-6 text-action" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelBadgeClass(workshop.level)}`}>
                        {workshop.level || t('allLevelsLabel')}
                      </span>
                    </div>

                    <Heading level={3} className="text-xl font-semibold text-text-primary mb-2">
                      {workshop.title}
                    </Heading>

                    <p className="text-text-secondary text-sm mb-4 line-clamp-3">
                      {workshop.description}
                    </p>

                    {/* Category badge */}
                    {workshop.category && (
                      <div className="mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-raised text-text-secondary">
                          <IconComponent className="w-3 h-3 mr-1" />
                          {WORKSHOP_CATEGORIES.find(c => c.id === workshop.category)?.name || workshop.category}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-text-tertiary">
                      {workshop.duration && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {workshop.duration}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {t('maxParticipants', { count: workshop.max_participants })}
                      </div>
                    </div>
                  </div>

                  {/* Workshop Details */}
                  <div className="p-6">
                    {nextInstance ? (
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center text-sm text-text-secondary">
                          <Calendar className="w-4 h-4 mr-1 shrink-0" />
                          <span>{t('nextDate', { date: formatDateShort(nextInstance.start_date) })}</span>
                        </div>
                        {nextInstance.location && (
                          <div className="flex items-center text-sm text-text-secondary">
                            <MapPin className="w-4 h-4 mr-1 shrink-0" />
                            <span className="truncate">{nextInstance.location}</span>
                          </div>
                        )}
                        {spotsLeft !== null && (
                          <div className="flex items-center text-sm">
                            <Users className="w-4 h-4 mr-1 shrink-0" />
                            <span className={spotsLeft <= 3 ? 'text-warning-600 font-medium' : 'text-text-secondary'}>
                              {spotsLeft <= 0 ? t('soldOut') : t('spotsLeft', { count: spotsLeft })}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4">
                        <div className="flex items-center text-sm text-warning-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{t('dateSoon')}</span>
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-action">
                        {workshop.price_cents === 0
                          ? t('free')
                          : formatCentsToChf(workshop.price_cents)}
                      </span>
                      {workshop.user_registered && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t('registered')}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button as={Link} href={`/workshops/${workshop.slug}`} variant="secondary" size="sm" className="flex-1 justify-center">
                        {t('viewDetails')}
                      </Button>

                      {workshop.user_registered ? (
                        <Button as={Link} href="/dashboard/workshops" variant="primary" size="sm" className="flex-1 justify-center">
                          {t('manage')}
                        </Button>
                      ) : nextInstance && spotsLeft !== null && spotsLeft > 0 ? (
                        <Button as={Link} href={`/workshops/${workshop.slug}#register`} variant="primary" size="sm" className="flex-1 justify-center">
                          {t('registerNow')}
                        </Button>
                      ) : nextInstance && spotsLeft !== null && spotsLeft <= 0 ? (
                        <span className="flex-1 bg-error-100 dark:bg-error-900/20 text-error-700 dark:text-error-300 px-4 py-2 rounded-lg text-center text-sm font-medium">
                          {t('soldOut')}
                        </span>
                      ) : (
                        <span className="flex-1 bg-neutral-300 dark:bg-neutral-700 text-text-tertiary px-4 py-2 rounded-lg text-center text-sm font-medium">
                          {t('noDate')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <Heading level={3} className="text-xl font-semibold text-text-primary mb-2">
              {categoryFilter !== 'all' || levelFilter !== 'all'
                ? t('emptyFiltered.title')
                : t('emptyAll.title')}
            </Heading>
            <p className="text-text-secondary mb-4">
              {categoryFilter !== 'all' || levelFilter !== 'all'
                ? t('emptyFiltered.subtitle')
                : t('emptyAll.subtitle')}
            </p>
            {(categoryFilter !== 'all' || levelFilter !== 'all') && (
              <button
                onClick={() => {
                  setCategoryFilter('all')
                  setLevelFilter('all')
                }}
                className="text-action hover:text-primary-700 font-medium"
              >
                {t('emptyFiltered.clearFilters')}
              </button>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-primary-600 dark:bg-primary-700 rounded-xl p-8 text-white text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <Heading level={2} className="mb-4">
            {t('cta.title')}
          </Heading>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <Link
            href="/workshops/propose"
            className="inline-flex items-center gap-2 bg-surface-base text-action px-6 py-3 rounded-lg font-semibold hover:bg-neutral-50 transition-colors"
          >
            {t('cta.button')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </PageShell>
    </>
  )
}

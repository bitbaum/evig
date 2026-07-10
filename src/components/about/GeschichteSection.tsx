/**
 * Geschichte (History) Section Component
 *
 * Displays RevampIT's founding story and timeline of milestones.
 * Structure (year/type/highlight) comes from `HISTORY_CONFIG`; all human-readable
 * strings come from messages so the timeline is translated per locale.
 */

'use client'

import { Clock, Rocket, Award, TrendingUp, Users, Building } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { ORG, LOCATIONS } from '@/config/org'
import { HISTORY_CONFIG, type Milestone } from '@/data/history'

const getTypeIcon = (type: Milestone['type']) => {
  switch (type) {
    case 'founding':
      return <Rocket className="h-5 w-5" />
    case 'growth':
      return <TrendingUp className="h-5 w-5" />
    case 'achievement':
      return <Award className="h-5 w-5" />
    case 'expansion':
      return <Building className="h-5 w-5" />
    case 'community':
      return <Users className="h-5 w-5" />
  }
}

const getTypeColor = (type: Milestone['type']) => {
  switch (type) {
    case 'founding':
      return 'bg-warning-500'
    case 'growth':
      return 'bg-action'
    case 'achievement':
      return 'bg-action'
    case 'expansion':
      return 'bg-action'
    case 'community':
      return 'bg-error-500'
  }
}

function TimelineItem({
  milestone,
  title,
  description,
  isLeft,
}: {
  milestone: Milestone
  title: string
  description: string
  isLeft: boolean
}) {
  return (
    <div className={`flex items-center gap-4 md:gap-8 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
      {/* Content Card */}
      <div className={`flex-1 ${isLeft ? 'md:text-right' : ''}`}>
        <div className={`card-shell p-6 ${milestone.highlight ? 'ring-2 ring-action ring-offset-2' : ''}`}>
          <div className={`flex items-center gap-3 mb-3 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
            <span className={`${getTypeColor(milestone.type)} text-white p-2 rounded-lg`}>
              {getTypeIcon(milestone.type)}
            </span>
            <div>
              <span className="text-sm font-medium text-text-tertiary">{milestone.year}</span>
              <Heading level={3} className="text-lg font-bold text-text-primary">
                {title}
              </Heading>
            </div>
          </div>
          <p className="text-text-secondary">{description}</p>
        </div>
      </div>

      {/* Timeline Dot - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex flex-col items-center">
        <div
          className={`w-4 h-4 rounded-full ${
            milestone.highlight ? 'bg-action ring-4 ring-action/20' : 'bg-surface-overlay'
          }`}
        />
      </div>

      {/* Spacer for alternating layout - Hidden on mobile */}
      <div className="hidden md:block flex-1" />
    </div>
  )
}

export default function GeschichteSection() {
  const t = useTranslations('components.geschichteSection')
  const { milestones, currentState } = HISTORY_CONFIG

  // next-intl keys are statically typed; the timeline reads them by year.
  type MsgKey = Parameters<typeof t>[0]
  const foundingParams = { orgName: ORG.name, foundingYear: ORG.foundingYear }
  const milestoneParams = {
    orgName: ORG.name,
    storeStreet: LOCATIONS.store.street,
    warehouseStreet: LOCATIONS.warehouse.street,
  }

  return (
    <section className="py-20 bg-surface-raised">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-warning-100 dark:bg-secondary-500/15 text-warning-800 dark:text-secondary-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Clock className="h-4 w-4" />
            {t('badge')}
          </div>
          <Heading level={2} className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            {t('founding.title', foundingParams)}
          </Heading>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">{t('founding.subtitle')}</p>
        </div>

        {/* Founding Story */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="card-shell rounded-2xl p-8">
            <div className="prose prose-lg max-w-none">
              {(['p1', 'p2', 'p3'] as const).map((k) => (
                <p key={k} className="text-text-secondary mb-4 last:mb-0">
                  {t(`founding.${k}`, foundingParams)}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Header */}
        <div className="text-center mb-12">
          <Heading level={3} className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            {t('milestoneTitle')}
          </Heading>
          <p className="text-text-secondary max-w-2xl mx-auto">{t('milestoneDesc')}</p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line - Hidden on mobile, shown on desktop */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-surface-overlay" />

          {/* Timeline Items */}
          <div className="space-y-8 md:space-y-12">
            {milestones.map((milestone, index) => (
              <TimelineItem
                key={milestone.year}
                milestone={milestone}
                title={t(`milestones.${milestone.year}.title` as MsgKey)}
                description={t(`milestones.${milestone.year}.description` as MsgKey, milestoneParams)}
                isLeft={index % 2 === 0}
              />
            ))}
          </div>
        </div>

        {/* Current State Summary */}
        <div className="mt-20 bg-action rounded-2xl p-8 text-white text-center">
          <Heading level={3} className="text-2xl font-bold mb-6">{t('currentTitle')}</Heading>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{currentState.yearsActive}</p>
              <p className="text-action-text">{t('yearsActive')}</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{currentState.teamSize}</p>
              <p className="text-action-text">{t('teamMembers')}</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold mb-2">{currentState.devicesPerYear}</p>
              <p className="text-action-text">{t('devicesPerYear')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

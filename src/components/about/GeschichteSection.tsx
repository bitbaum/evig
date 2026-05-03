/**
 * Geschichte (History) Section Component
 *
 * Displays RevampIT's founding story and timeline of milestones.
 * Uses warm, storytelling-focused design with visual timeline.
 */

'use client'

import { Clock, Rocket, Award, TrendingUp, Users, Building } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import {
  HISTORY_CONFIG,
  type Milestone,
} from '@/data/history'

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
      return 'bg-info-500'
    case 'achievement':
      return 'bg-primary-500'
    case 'expansion':
      return 'bg-purple-500'
    case 'community':
      return 'bg-rose-500'
  }
}

function TimelineItem({
  milestone,
  isLeft,
}: {
  milestone: Milestone
  isLeft: boolean
}) {
  return (
    <div
      className={`flex items-center gap-4 md:gap-8 ${isLeft ? 'md:flex-row-reverse' : ''}`}
    >
      {/* Content Card */}
      <div
        className={`flex-1 ${isLeft ? 'md:text-right' : ''}`}
      >
        <div
          className={`bg-white rounded-xl p-6 shadow-lg border border-neutral-100
            ${milestone.highlight ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
        >
          <div
            className={`flex items-center gap-3 mb-3 ${isLeft ? 'md:flex-row-reverse' : ''}`}
          >
            <span
              className={`${getTypeColor(milestone.type)} text-white p-2 rounded-lg`}
            >
              {getTypeIcon(milestone.type)}
            </span>
            <div>
              <span className="text-sm font-medium text-neutral-500">
                {milestone.year}
              </span>
              <Heading level={3} className="text-lg font-bold text-neutral-900">
                {milestone.title}
              </Heading>
            </div>
          </div>
          <p className="text-neutral-600">{milestone.description}</p>
        </div>
      </div>

      {/* Timeline Dot - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex flex-col items-center">
        <div
          className={`w-4 h-4 rounded-full ${
            milestone.highlight ? 'bg-primary-500 ring-4 ring-primary-200' : 'bg-neutral-300'
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
  const { founding, milestones, currentState } = HISTORY_CONFIG

  return (
    <section className="py-20 bg-gradient-to-b from-warning-50 to-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-warning-100 text-warning-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Clock className="h-4 w-4" />
            {t('badge')}
          </div>
          <Heading level={2} className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
            {founding.title}
          </Heading>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            {founding.subtitle}
          </p>
        </div>

        {/* Founding Story */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-neutral-100">
            <div className="prose prose-lg max-w-none">
              {founding.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-neutral-600 mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Header */}
        <div className="text-center mb-12">
          <Heading level={3} className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
            {t('milestoneTitle')}
          </Heading>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            {t('milestoneDesc')}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line - Hidden on mobile, shown on desktop */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-neutral-200" />

          {/* Timeline Items */}
          <div className="space-y-8 md:space-y-12">
            {milestones.map((milestone, index) => (
              <TimelineItem
                key={milestone.year}
                milestone={milestone}
                isLeft={index % 2 === 0}
              />
            ))}
          </div>
        </div>

        {/* Current State Summary */}
        <div className="mt-20 bg-primary-600 rounded-2xl p-8 text-white text-center">
          <Heading level={3} className="text-2xl font-bold mb-6">{t('currentTitle')}</Heading>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <p className="text-4xl font-bold mb-2">{currentState.yearsActive}</p>
              <p className="text-primary-100">{t('yearsActive')}</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">{currentState.teamSize}</p>
              <p className="text-primary-100">{t('teamMembers')}</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">{currentState.devicesPerYear}</p>
              <p className="text-primary-100">{t('devicesPerYear')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { Wrench, RefreshCw, Recycle, Heart, ArrowDown, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { ZERO_WASTE_PRINCIPLES, getEnvironmentalSummary, type ZeroWastePrinciple } from '@/data/impact-metrics'

const getIcon = (icon: ZeroWastePrinciple['icon']) => {
  switch (icon) {
    case 'wrench':  return <Wrench className="h-8 w-8" />
    case 'refresh': return <RefreshCw className="h-8 w-8" />
    case 'recycle': return <Recycle className="h-8 w-8" />
    case 'heart':   return <Heart className="h-8 w-8" />
  }
}

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1: return 'bg-action text-white'
    case 2: return 'bg-action text-white'
    case 3: return 'bg-action text-white'
    case 4: return 'bg-action text-white'
    default: return 'bg-action-muted text-action'
  }
}

function PrincipleCard({
  principle,
  isLast,
  title,
  description,
  priorityLabel,
}: {
  principle: ZeroWastePrinciple
  isLast: boolean
  title: string
  description: string
  priorityLabel: string
}) {
  return (
    <div className="relative">
      <div className="bg-surface-base rounded-xl p-6 border border-strong dark:border-white/6 hover:border-strong dark:hover:border-white/12 transition-colors">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${getPriorityColor(principle.priority)}`}>
            {getIcon(principle.icon)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getPriorityColor(principle.priority)}`}>
                {priorityLabel}
              </span>
            </div>
            <Heading level={3} className="text-xl font-bold text-text-primary mb-2">{title}</Heading>
            <p className="text-text-secondary">{description}</p>
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="flex justify-center py-3">
          <ArrowDown className="h-6 w-6 text-action" />
        </div>
      )}
    </div>
  )
}

export default function ZeroWasteSolutionSection() {
  const t = useTranslations('components.zeroWaste')
  const envSummary = getEnvironmentalSummary()
  const sortedPrinciples = [...ZERO_WASTE_PRINCIPLES].sort((a, b) => a.priority - b.priority)

  return (
    <section className="py-20 bg-surface-raised">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-action-muted text-action px-4 py-2 rounded-full text-sm font-medium mb-6">
            <CheckCircle className="h-4 w-4" />
            {t('badge')}
          </div>
          <Heading level={2} className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            {t('heading')}
          </Heading>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            {t('description')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-0">
            {sortedPrinciples.map((principle, index) => (
              <PrincipleCard
                key={principle.id}
                principle={principle}
                isLast={index === sortedPrinciples.length - 1}
                title={t(`principles.${principle.id}.title`)}
                description={t(`principles.${principle.id}.description`)}
                priorityLabel={t('priority', { priority: principle.priority })}
              />
            ))}
          </div>

          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-action rounded-2xl p-8 text-white">
              <Heading level={3} className="text-2xl font-bold mb-6">{t('impactTitle')}</Heading>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-surface-base/20 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold">{envSummary.devicesSaved}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{t('devicesSavedLabel')}</p>
                    <p className="text-sm text-white/90">{t('devicesSavedDesc')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-surface-base/20 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold">{Math.round(envSummary.reuseRate * 100)}%</span>
                  </div>
                  <div>
                    <p className="font-semibold">{t('reuseRateLabel')}</p>
                    <p className="text-sm text-white/90">{t('reuseRateDesc')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-surface-base/20 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold">{envSummary.co2SavedTons}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{t('co2Label')}</p>
                    <p className="text-sm text-white/90">{t('co2Desc')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-base rounded-xl p-6 border border-strong dark:border-white/6">
              <Heading level={4} className="font-bold text-text-primary mb-3">{t('whyRepairTitle')}</Heading>
              <p className="text-text-secondary text-sm mb-4">
                {t('whyRepairText')}
              </p>
              <div className="flex items-center gap-2 text-sm text-action font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>{t('whyRepairConclusion')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

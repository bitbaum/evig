/**
 * Zero-Waste Solution Section
 *
 * Displays RevampIT's approach to solving the e-waste problem.
 * Green/hopeful theme to show the positive path forward.
 * Presents the Repair > Refurbish > Recycle hierarchy.
 */

import { Wrench, RefreshCw, Recycle, Heart, ArrowDown, CheckCircle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Heading from '@/components/ui/Heading'
import { ZERO_WASTE_PRINCIPLES, getEnvironmentalSummary, type ZeroWastePrinciple } from '@/data/impact-metrics'

const getIcon = (icon: ZeroWastePrinciple['icon']) => {
  switch (icon) {
    case 'wrench': return <Wrench className="h-8 w-8" />
    case 'refresh': return <RefreshCw className="h-8 w-8" />
    case 'recycle': return <Recycle className="h-8 w-8" />
    case 'heart': return <Heart className="h-8 w-8" />
  }
}

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1: return 'bg-primary-600 text-white'
    case 2: return 'bg-primary-500 text-white'
    case 3: return 'bg-primary-400 text-white'
    case 4: return 'bg-primary-300 text-primary-900'
    default: return 'bg-primary-200 text-primary-900'
  }
}

function PrincipleCard({ principle, isLast, priorityLabel }: { principle: ZeroWastePrinciple; isLast: boolean; priorityLabel: string }) {
  return (
    <div className="relative">
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-white/[0.06] hover:border-neutral-300 dark:hover:border-white/[0.12] transition-colors">
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
            <Heading level={3} className="text-xl font-bold text-neutral-900 mb-2">{principle.title}</Heading>
            <p className="text-neutral-600">{principle.description}</p>
          </div>
        </div>
      </div>
      {/* Arrow connector */}
      {!isLast && (
        <div className="flex justify-center py-3">
          <ArrowDown className="h-6 w-6 text-primary-400" />
        </div>
      )}
    </div>
  )
}

export default async function ZeroWasteSolutionSection() {
  const t = await getTranslations('components.zeroWaste')
  const envSummary = getEnvironmentalSummary()
  const sortedPrinciples = [...ZERO_WASTE_PRINCIPLES].sort((a, b) => a.priority - b.priority)

  return (
    <section className="py-20 bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <CheckCircle className="h-4 w-4" />
            {t('badge')}
          </div>
          <Heading level={2} className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
            {t('heading')}
          </Heading>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Principles Hierarchy */}
          <div className="space-y-0">
            {sortedPrinciples.map((principle, index) => (
              <PrincipleCard
                key={principle.id}
                principle={principle}
                isLast={index === sortedPrinciples.length - 1}
                priorityLabel={t('priority', { priority: principle.priority })}
              />
            ))}
          </div>

          {/* Impact Summary */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-primary-600 rounded-2xl p-8 text-white">
              <Heading level={3} className="text-2xl font-bold mb-6">{t('impactTitle')}</Heading>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold">{envSummary.devicesSaved}+</span>
                  </div>
                  <div>
                    <p className="font-semibold">{t('devicesSavedLabel')}</p>
                    <p className="text-sm text-white/80">{t('devicesSavedDesc')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold">{Math.round(envSummary.reuseRate * 100)}%</span>
                  </div>
                  <div>
                    <p className="font-semibold">{t('reuseRateLabel')}</p>
                    <p className="text-sm text-white/80">{t('reuseRateDesc')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold">{envSummary.co2SavedTons}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{t('co2Label')}</p>
                    <p className="text-sm text-white/80">{t('co2Desc')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insight */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-white/[0.06]">
              <Heading level={4} className="font-bold text-neutral-900 mb-3">{t('whyRepairTitle')}</Heading>
              <p className="text-neutral-600 text-sm mb-4">
                {t('whyRepairText')}
              </p>
              <div className="flex items-center gap-2 text-sm text-primary-700 font-medium">
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

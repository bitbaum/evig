'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { PageHero } from '@/components/layout/PageHero'
import { ArrowRight, Filter, CheckCircle2, Calendar, Code, Globe, Users, Wrench, Rocket, Layers, Server, Lightbulb } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import { DESIGN_TOKENS } from '@/lib/design/tokens'

// Icon config keyed by slug — no positional coupling
const ICON_BY_SLUG: Record<string, LucideIcon> = {
  kivitendo:    Code,
  linuxola:     Globe,
  freiecomputer: Layers,
  compirat:     Users,
  hardware:     Wrench,
  ltsp:         Server,
  upcycling:    Lightbulb,
}

type ProjectItem = {
  title: string
  description: string
  category: 'software' | 'hardware' | 'community'
  status: 'active' | 'ongoing'
  features: string[]
  slug: string
  year: string
}

export default function ProjectsPage() {
  const t = useTranslations('projects')

  const items = t.raw('items') as ProjectItem[]
  const categoryKeys = ['software', 'hardware', 'community'] as const
  type CategoryKey = typeof categoryKeys[number]

  const allLabel = t('filter.all')
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null)

  const filteredItems = selectedCategory
    ? items.filter(p => p.category === selectedCategory)
    : items

  const handleToggle = (key: CategoryKey) => {
    setSelectedCategory(prev => (prev === key ? null : key))
  }

  const iconBadge = DESIGN_TOKENS.iconBadges.projects

  return (
    <main>
      <PageHero
        theme="projects"
        icon={Rocket}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      <section className="py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="max-w-2xl mx-auto text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-3">
              {t('section.title')}
            </h2>
            <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400">
              {t('section.subtitle')}
            </p>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mb-10 sm:mb-12">
            <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 uppercase tracking-wider">
              <Filter className="h-3.5 w-3.5" />
              {t('filter.label')}
            </span>
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                selectedCategory === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/[0.16]'
              )}
            >
              {t('filter.all')}
            </button>
            {categoryKeys.map((key) => (
              <button
                key={key}
                onClick={() => handleToggle(key)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                  selectedCategory === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/[0.16]'
                )}
              >
                {t(`categories.${key}`)}
              </button>
            ))}
          </div>

          {/* Projects grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredItems.map((project, index) => {
              const Icon = ICON_BY_SLUG[project.slug] ?? Layers
              return (
                <div
                  key={project.slug}
                  className={cn(
                    designPrimitive.surface.card,
                    'group flex flex-col animate-fade-in-up'
                  )}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="p-6 flex flex-col h-full">
                    {/* Card header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={cn(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                        iconBadge.bg,
                        'group-hover:bg-primary-600'
                      )}>
                        <Icon className={cn(
                          'h-5 w-5 transition-colors',
                          iconBadge.text,
                          'group-hover:text-white'
                        )} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-neutral-900 dark:text-white truncate">
                            {project.title}
                          </h3>
                          <span className={cn(
                            designPrimitive.badgeBase,
                            designPrimitive.badge.success
                          )}>
                            {t(`status.${project.status}`)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{t('since', { year: project.year })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4 flex-grow leading-relaxed">
                      {project.description}
                    </p>

                    {/* Features */}
                    {project.features.length > 0 && (
                      <ul className="space-y-2 mb-5">
                        {project.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary-500" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Footer */}
                    <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-white/[0.04] flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        {t(`categories.${project.category}`)}
                      </span>
                      <Link
                        href={`/projects/${project.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        {t('learnMore')}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Result count */}
          <p className="text-center mt-8 text-xs text-neutral-400 dark:text-neutral-500">
            {selectedCategory === null
              ? t('results', { count: filteredItems.length, total: items.length })
              : t('resultsFiltered', {
                  count: filteredItems.length,
                  total: items.length,
                  category: t(`categories.${selectedCategory}`),
                })}
          </p>
        </div>
      </section>
    </main>
  )
}

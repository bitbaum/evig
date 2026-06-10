'use client'

import { useState } from 'react'
import { PageHero } from '@/components/layout/PageHero'
import { Filter, Rocket } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ProjectCard, type ProjectItem } from './ProjectCard'

export default function ProjectsPage() {
  const t = useTranslations('projects')

  const items = t.raw('items') as ProjectItem[]
  const categoryKeys = ['software', 'hardware', 'community'] as const
  type CategoryKey = typeof categoryKeys[number]

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null)

  const filteredItems = selectedCategory
    ? items.filter(p => p.category === selectedCategory)
    : items

  const handleToggle = (key: CategoryKey) => {
    setSelectedCategory(prev => (prev === key ? null : key))
  }

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
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-3">
              {t('section.title')}
            </h2>
            <p className="text-base sm:text-lg text-text-tertiary">
              {t('section.subtitle')}
            </p>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mb-10 sm:mb-12">
            <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted uppercase tracking-wider">
              <Filter className="h-3.5 w-3.5" />
              {t('filter.label')}
            </span>
            <Button
              variant="ghost"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                selectedCategory === null
                  ? 'bg-action text-white'
                  : 'bg-surface-base text-text-secondary border border-default hover:border-strong'
              )}
            >
              {t('filter.all')}
            </Button>
            {categoryKeys.map((key) => (
              <Button
                key={key}
                variant="ghost"
                onClick={() => handleToggle(key)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                  selectedCategory === key
                    ? 'bg-action text-white'
                    : 'bg-surface-base text-text-secondary border hover:border-strong dark:hover:border-white/16'
                )}
              >
                {t(`categories.${key}`)}
              </Button>
            ))}
          </div>

          {/* Projects grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredItems.map((project, index) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>

          {/* Result count */}
          <p className="text-center mt-8 text-xs text-text-muted">
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

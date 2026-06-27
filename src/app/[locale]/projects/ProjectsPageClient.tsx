'use client'

import { useState } from 'react'
import { PageHero } from '@/components/layout/PageHero'
import { Filter, Rocket } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ProjectCard } from './ProjectCard'
import { PROJECTS, PROJECT_CATEGORIES, type ProjectCategory, type ProjectStrings } from './data'

export default function ProjectsPage() {
  const t = useTranslations('projects')

  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | null>(null)

  // Pair each project's structural config (SSOT) with its translated strings by
  // canonical index — translations carry no structural fields to corrupt.
  const strings = t.raw('items') as ProjectStrings[]
  const projects = PROJECTS.map((p, i) => ({ ...p, ...strings[i] }))

  const filteredItems = selectedCategory
    ? projects.filter(p => p.category === selectedCategory)
    : projects

  const handleToggle = (key: ProjectCategory) => {
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
            {PROJECT_CATEGORIES.map((key) => (
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
              ? t('results', { count: filteredItems.length, total: PROJECTS.length })
              : t('resultsFiltered', {
                  count: filteredItems.length,
                  total: PROJECTS.length,
                  category: t(`categories.${selectedCategory}`),
                })}
          </p>
        </div>
      </section>
    </main>
  )
}

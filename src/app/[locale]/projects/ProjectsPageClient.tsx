'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { PageHero } from '@/components/layout/PageHero'
import { ArrowRight, Filter, CheckCircle2, Calendar, Code, Globe, Users, Wrench, Rocket } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'

// Icons are positional — parallel to projects.items translation array
const PROJECT_ICONS = [Code, Globe, CheckCircle2, Users, Wrench, Code]

// Read links are static — parallel to projects.items translation array
const PROJECT_LINKS = [
  '/projects/kivitendo',
  '/projects/linuxola',
  '/projects/freiecomputer',
  '/projects/compirat',
  '/projects/hardware',
  '/projects/ltsp',
]

// Years are not translatable — parallel to projects.items translation array
const PROJECT_YEARS = ['2015', '2005', '2010', '2018', '2020', '2016']

export default function ProjectsPage() {
  const t = useTranslations('projects')

  const items = t.raw('items') as Array<{
    title: string
    description: string
    category: 'software' | 'hardware' | 'community'
    status: 'active' | 'ongoing'
    features: string[]
  }>

  const categoryKeys = ['software', 'hardware', 'community'] as const
  const categoryLabels: Record<string, string> = {
    software: t('categories.software'),
    hardware: t('categories.hardware'),
    community: t('categories.community'),
  }
  const allLabel = t('filter.all')

  const [selectedCategory, setSelectedCategory] = useState<string>(allLabel)

  const filteredItems = selectedCategory === allLabel
    ? items
    : items.filter(p => categoryLabels[p.category] === selectedCategory)

  const handleToggle = (label: string) => {
    setSelectedCategory(prev => prev === label ? allLabel : label)
  }

  const resultText = selectedCategory === allLabel
    ? t('results', { count: filteredItems.length, total: items.length })
    : t('resultsFiltered', { count: filteredItems.length, total: items.length, category: selectedCategory })

  return (
    <main className="min-h-screen bg-neutral-50">
      <PageHero
        theme="projects"
        icon={Rocket}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
            <Heading level={2} className="text-2xl sm:text-3xl mb-4 sm:mb-6">{t('section.title')}</Heading>
            <p className="text-base sm:text-lg text-neutral-600 mb-6 sm:mb-8">
              {t('section.subtitle')}
            </p>

            {/* Project Filter */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
              <div className="flex items-center text-neutral-500 mr-2 sm:mr-4 mb-2 w-full sm:w-auto justify-center sm:justify-start">
                <Filter className="w-4 h-4 mr-2" />
                <span className="text-xs sm:text-sm font-medium">{t('filter.label')}</span>
              </div>
              <button
                onClick={() => setSelectedCategory(allLabel)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === allLabel
                    ? 'bg-primary-600 text-white transform scale-105'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800 dark:hover:bg-neutral-700 dark:hover:text-white'
                }`}
              >
                {allLabel}
              </button>
              {categoryKeys.map((key) => {
                const label = categoryLabels[key]
                return (
                  <button
                    key={key}
                    onClick={() => handleToggle(label)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedCategory === label
                        ? 'bg-primary-600 text-white transform scale-105'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800 dark:hover:bg-neutral-700 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredItems.map((project, index) => {
              const originalIndex = items.indexOf(project)
              const Icon = PROJECT_ICONS[originalIndex] ?? Code
              return (
                <div
                  key={`${project.title}-${selectedCategory}`}
                  className="group bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 transition-all duration-300 overflow-hidden flex flex-col h-full animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-6 sm:p-8 flex flex-col h-full">
                    <div className="flex items-start mb-4 sm:mb-6">
                      <div className="p-2 sm:p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 mr-3 sm:mr-4 transition-colors duration-300 group-hover:bg-primary-600 group-hover:text-white flex-shrink-0">
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Heading level={3} className="text-xl sm:text-2xl">{project.title}</Heading>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                            {t(`status.${project.status}`)}
                          </span>
                        </div>
                        <div className="flex items-center text-neutral-500 mb-3 sm:mb-4">
                          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{t('since', { year: PROJECT_YEARS[originalIndex] })}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6 flex-grow">{project.description}</p>
                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      {project.features.map((feature, i) => (
                        <div key={i} className="flex items-start text-neutral-600">
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0 text-primary-500 mt-0.5" />
                          <span className="text-xs sm:text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto pt-6 border-t border-neutral-200 flex items-center justify-between">
                      <span className="text-sm text-neutral-500">{categoryLabels[project.category]}</span>
                      <Link
                        href={PROJECT_LINKS[originalIndex] ?? '/projects'}
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors duration-300 group"
                      >
                        <span>{t('learnMore')}</span>
                        <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Results count */}
          <div className="text-center mt-8">
            <p className="text-neutral-500 text-sm">{resultText}</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </main>
  )
}

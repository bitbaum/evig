'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, ArrowRight, Filter, Globe, Code, Palette, Shield, Database, Cloud, Layers } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { IconBadge } from '@/components/ui/IconBadge'
import type { TechItem } from './TechnologiesSection'

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  Code, Palette, Database, Layers, Shield, Globe, Cloud,
}

interface TechnologiesClientProps {
  technologies: TechItem[]
  categories: string[]
  allLabel: string
  totalCount: number
  labels: {
    title: string
    subtitle: string
    filterLabel: string
    visitWebsite: string
    showing: string
  }
}

export function TechnologiesClient({ technologies, categories, allLabel, totalCount, labels }: TechnologiesClientProps) {
  const t = useTranslations('services.webDesign.technologies')
  const [selectedCategory, setSelectedCategory] = useState(allLabel)

  const filteredTechnologies = selectedCategory === allLabel
    ? technologies
    : technologies.filter(tech => tech.category === selectedCategory)

  const showingText = selectedCategory === allLabel
    ? labels.showing
    : t('showingFiltered', { count: filteredTechnologies.length, total: totalCount, category: selectedCategory })

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-surface-base">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Heading level={2} className="mb-6">{labels.title}</Heading>
          <p className="text-lg text-text-secondary mb-8">
            {labels.subtitle}
          </p>

          {/* Technology Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <div className="flex items-center text-text-tertiary mr-4 mb-2">
              <Filter className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{labels.filterLabel}</span>
            </div>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white transform scale-105'
                    : 'bg-surface-raised text-text-secondary hover:bg-neutral-200 hover:text-neutral-800'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Technologies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTechnologies.map((tech, index) => {
            const IconComponent = ICON_MAP[tech.iconKey] || ICON_MAP['Globe']
            return (
              <a
                key={`${tech.name}-${selectedCategory}`}
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-surface-raised dark:bg-neutral-900 rounded-xl p-6 border hover:border-neutral-300 dark:hover:border-white/[0.12] transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn block group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start mb-4">
                  <IconBadge icon={IconComponent} theme="services" size="lg" className="mr-4" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-action font-semibold mb-1 truncate">{tech.category}</div>
                    <Heading level={3} className="mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors duration-300">{tech.name}</Heading>
                  </div>
                </div>
                <p className="text-text-secondary mb-4 text-sm leading-relaxed">{tech.description}</p>
                <div className="space-y-2">
                  {tech.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center text-sm text-text-secondary">
                      <CheckCircle2 className="w-4 h-4 text-primary-500 mr-2 flex-shrink-0" />
                      <span className="truncate">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border flex items-center text-sm text-action group-hover:text-primary-700 transition-colors duration-300">
                  <ArrowRight className="w-4 h-4 mr-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                  <span>{labels.visitWebsite}</span>
                </div>
              </a>
            )
          })}
        </div>

        {/* Results count */}
        <div className="text-center mt-8">
          <p className="text-text-tertiary text-sm">
            {showingText}
          </p>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  )
}

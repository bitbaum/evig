'use client'

import { useState } from 'react'
import { CheckCircle2, ArrowRight, Filter } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import type { TechItem } from './TechnologiesSection'

interface TechnologiesClientProps {
  technologies: TechItem[]
  categories: string[]
  allLabel: string
  labels: {
    title: string
    subtitle: string
    filterLabel: string
    visitWebsite: string
    showing: string
    showingFiltered: (count: number, category: string) => string
  }
  iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>
}

export function TechnologiesClient({ technologies, categories, allLabel, labels, iconMap }: TechnologiesClientProps) {
  const [selectedCategory, setSelectedCategory] = useState(allLabel)

  const filteredTechnologies = selectedCategory === allLabel
    ? technologies
    : technologies.filter(tech => tech.category === selectedCategory)

  const showingText = selectedCategory === allLabel
    ? labels.showing
    : labels.showingFiltered(filteredTechnologies.length, selectedCategory)

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Heading level={2} className="mb-6">{labels.title}</Heading>
          <p className="text-lg text-neutral-600 mb-8">
            {labels.subtitle}
          </p>

          {/* Technology Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <div className="flex items-center text-neutral-500 mr-4 mb-2">
              <Filter className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{labels.filterLabel}</span>
            </div>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800'
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
            const IconComponent = iconMap[tech.iconKey] || iconMap['Globe']
            return (
              <a
                key={`${tech.name}-${selectedCategory}`}
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-neutral-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn block group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start mb-4">
                  <div className="p-3 bg-primary-100 rounded-lg text-primary-600 mr-4 flex-shrink-0 group-hover:bg-primary-200 transition-colors duration-300">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-primary-600 font-semibold mb-1 truncate">{tech.category}</div>
                    <Heading level={3} className="mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors duration-300">{tech.name}</Heading>
                  </div>
                </div>
                <p className="text-neutral-600 mb-4 text-sm leading-relaxed">{tech.description}</p>
                <div className="space-y-2">
                  {tech.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center text-sm text-neutral-600">
                      <CheckCircle2 className="w-4 h-4 text-primary-500 mr-2 flex-shrink-0" />
                      <span className="truncate">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center text-sm text-primary-600 group-hover:text-primary-700 transition-colors duration-300">
                  <ArrowRight className="w-4 h-4 mr-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                  <span>{labels.visitWebsite}</span>
                </div>
              </a>
            )
          })}
        </div>

        {/* Results count */}
        <div className="text-center mt-8">
          <p className="text-neutral-500 text-sm">
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

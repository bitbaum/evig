/**
 * AboutSection Component
 * 
 * Reusable section component for the about page.
 * Handles different layouts and background colors consistently.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Heading from '@/components/ui/Heading'
import { AboutSection as AboutSectionType } from '@/data/about'
import { CheckCircle } from 'lucide-react'

interface AboutSectionProps {
  section: AboutSectionType
}

export default function AboutSection({ section }: AboutSectionProps) {
  const bgClass = {
    white: 'bg-white',
    gray: 'bg-neutral-50'
  }[section.backgroundColor]

  const textColorClass = 'text-neutral-900'
  const textSecondaryClass = 'text-neutral-600'

  return (
    <section className={`py-20 ${bgClass}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            {section.title && (
              <Heading level={2} className={`text-4xl font-bold mb-4 ${textColorClass}`}>
                {section.title}
              </Heading>
            )}
            {section.description && (
              <p className={`text-xl max-w-3xl mx-auto ${textSecondaryClass}`}>
                {section.description}
              </p>
            )}
          </div>

          {/* Cards Grid */}
          {section.cards && section.cards.length > 0 && (
            <div className={`grid gap-8 ${
              section.layout === 'grid-2' ? 'md:grid-cols-2' :
              section.layout === 'grid-3' ? 'md:grid-cols-3' :
              'md:grid-cols-1'
            }`}>
              {section.cards.map((card, index) => (
                <article
                  key={index}
                  className={section.backgroundColor === 'gray'
                    ? 'bg-white p-8 rounded-xl shadow-sm'
                    : 'bg-gradient-to-br from-info-50 to-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300'
                  }
                >
                  {/* Card Title */}
                  {card.title && (
                    <CardHeader className="p-0 mb-4">
                      <CardTitle className={`text-2xl ${textColorClass}`}>
                        {card.title}
                      </CardTitle>
                    </CardHeader>
                  )}

                  {/* Card Content */}
                  <div>
                    {card.description && (
                      <p className={`mb-4 ${textSecondaryClass}`}>
                        {card.description}
                      </p>
                    )}
                    
                    {/* Features List */}
                    {card.features && card.features.length > 0 && (
                      <ul className="space-y-2">
                        {card.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-primary-500 mt-0.5" />
                            <span className={textSecondaryClass}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}



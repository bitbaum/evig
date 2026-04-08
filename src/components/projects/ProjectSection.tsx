/**
 * ProjectSection - Reusable section component for project pages
 * 
 * Handles different layouts and background colors consistently
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Heading from '@/components/ui/Heading'
import { ProjectSection as ProjectSectionType } from './types'
import { CheckCircle } from 'lucide-react'
import { getTextColor, getBackgroundColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'

interface ProjectSectionProps {
  section: ProjectSectionType
}

export function ProjectSection({ section }: ProjectSectionProps) {
  const bgVariant = (section.backgroundColor || 'white') as 'white' | 'neutral' | 'primary' | 'gray'
  const bgClass = cn(
    bgVariant === 'white' ? getBackgroundColor('white') :
    (bgVariant === 'gray' || bgVariant === 'neutral') ? getBackgroundColor('neutral') :
    getBackgroundColor('primary')
  )

  const textColorClass = bgVariant === 'primary' 
    ? getTextColor('primary', 'primary')
    : getTextColor('white', 'primary')
  
  const textSecondaryClass = bgVariant === 'primary' 
    ? getTextColor('primary', 'secondary')
    : getTextColor('white', 'muted')

  return (
    <section className={`py-20 ${bgClass}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          {(section.title || section.description) && (
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
          )}

          {/* Cards Grid */}
          {section.cards && section.cards.length > 0 && (
            <div className={`grid gap-8 ${
              section.layout === 'grid-2' ? 'md:grid-cols-2' :
              section.layout === 'grid-3' ? 'md:grid-cols-3' :
              section.layout === 'grid-4' ? 'md:grid-cols-4' :
              'md:grid-cols-2'
            }`}>
              {section.cards.map((card, index) => (
                <div 
                  key={index}
                  className={section.backgroundColor === 'gray' 
                    ? 'bg-white p-8 rounded-xl shadow-sm' 
                    : 'bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300'
                  }
                >
                  {/* Card Header with Icon */}
                  {card.icon && (
                    <div className="flex items-center mb-4">
                      {typeof card.icon === 'string' ? (
                        <div className={`w-8 h-8 ${card.iconColor || 'text-blue-600'} mr-3`}>
                          {card.icon}
                        </div>
                      ) : typeof card.icon === 'function' ? (
                        <div className={`w-8 h-8 ${card.iconColor || 'text-blue-600'} mr-3`}>
                          {(() => { const Icon = card.icon as React.ComponentType<{ className?: string }>; return <Icon className="w-8 h-8" /> })()}
                        </div>
                      ) : (
                        <div className={`w-8 h-8 ${card.iconColor || 'text-blue-600'} mr-3`}>
                          {card.icon}
                        </div>
                      )}
                      <Heading level={3} className={`text-2xl font-semibold ${textColorClass}`}>
                        {card.title}
                      </Heading>
                    </div>
                  )}
                  
                  {/* Card Title without Icon */}
                  {!card.icon && (
                    <CardHeader className="p-0 mb-4">
                      <CardTitle className={`text-xl ${textColorClass}`}>
                        {card.title}
                      </CardTitle>
                    </CardHeader>
                  )}

                  {/* Card Content */}
                  <div>
                    {card.description && (
                      <p className={`${textSecondaryClass} mb-4`}>
                        {card.description}
                      </p>
                    )}
                    {card.features && card.features.length > 0 && (
                      <ul className={`space-y-3 ${textSecondaryClass}`}>
                        {card.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}


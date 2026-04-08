/**
 * ProjectCallToAction - Standardized CTA section for project pages
 * 
 * Displays action cards for getting involved with the project
 */

import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/Heading'
import Link from 'next/link'
import { ProjectCard } from './types'
import { getTextColor, getBackgroundColor, getButtonVariant } from '@/lib/design-system'
import { cn } from '@/lib/utils'

interface ProjectCallToActionProps {
  title: string
  subtitle?: string
  actions: ProjectCard[]
  backgroundColor?: 'white' | 'gray' | 'primary'
}

export function ProjectCallToAction({ 
  title, 
  subtitle, 
  actions, 
  backgroundColor = 'gray' 
}: ProjectCallToActionProps) {
  const bgClass = cn(
    backgroundColor === 'white' ? getBackgroundColor('white') :
    backgroundColor === 'gray' ? getBackgroundColor('neutral') :
    getBackgroundColor('primary')
  )

  const textColorClass = backgroundColor === 'primary' 
    ? getTextColor('primary', 'primary')
    : getTextColor('white', 'primary')
  
  const textSecondaryClass = backgroundColor === 'primary' 
    ? getTextColor('primary', 'secondary')
    : getTextColor('white', 'muted')

  return (
    <section className={`py-20 ${bgClass}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Heading level={2} className={`text-4xl font-bold mb-8 ${textColorClass}`}>
            {title}
          </Heading>
          {subtitle && (
            <p className={`text-xl mb-12 ${textSecondaryClass}`}>
              {subtitle}
            </p>
          )}
          
          <div className="grid md:grid-cols-3 gap-8">
            {actions.map((action, index) => (
              <div 
                key={index}
                className={`p-6 rounded-lg shadow-sm flex flex-col h-full ${
                  backgroundColor === 'gray' ? 'bg-white' : 'bg-white/10'
                }`}
              >
                <Heading level={3} className={`text-xl font-semibold mb-4 ${textColorClass}`}>
                  {action.title}
                </Heading>
                <p className={`mb-4 flex-grow ${textSecondaryClass}`}>
                  {action.description}
                </p>
                {action.href && (
                  action.href.startsWith('http') ? (
                    <a href={action.href} target="_blank" rel="noopener noreferrer" className="block w-full">
                      <Button
                        variant={backgroundColor === 'primary' ? 'outline-light' : 'outline'}
                        className="w-full"
                      >
                        {action.ctaText || 'Mehr erfahren'}
                      </Button>
                    </a>
                  ) : (
                    <Link href={action.href} className="block w-full">
                      <Button
                        variant={backgroundColor === 'primary' ? 'outline-light' : 'outline'}
                        className="w-full"
                      >
                        {action.ctaText || 'Mehr erfahren'}
                      </Button>
                    </Link>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


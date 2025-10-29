/**
 * ProjectCallToAction - Standardized CTA section for project pages
 * 
 * Displays action cards for getting involved with the project
 */

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ProjectCard } from './types'

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
  const bgClass = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    primary: 'bg-primary text-white'
  }[backgroundColor]

  const textColorClass = backgroundColor === 'primary' ? 'text-white' : 'text-gray-900'
  const textSecondaryClass = backgroundColor === 'primary' ? 'text-gray-100' : 'text-gray-600'

  return (
    <section className={`py-20 ${bgClass}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-4xl font-bold mb-8 ${textColorClass}`}>
            {title}
          </h2>
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
                <h3 className={`text-xl font-semibold mb-4 ${textColorClass}`}>
                  {action.title}
                </h3>
                <p className={`mb-4 flex-grow ${textSecondaryClass}`}>
                  {action.description}
                </p>
                {action.href && (
                  action.href.startsWith('http') ? (
                    <a href={action.href} target="_blank" rel="noopener noreferrer" className="block w-full">
                      <Button 
                        variant="outline" 
                        className={`w-full ${
                          backgroundColor === 'primary' 
                            ? 'border-white text-white hover:bg-white/10' 
                            : ''
                        }`}
                      >
                        {action.ctaText || 'Mehr erfahren'}
                      </Button>
                    </a>
                  ) : (
                    <Link href={action.href} className="block w-full">
                      <Button 
                        variant="outline" 
                        className={`w-full ${
                          backgroundColor === 'primary' 
                            ? 'border-white text-white hover:bg-white/10' 
                            : ''
                        }`}
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


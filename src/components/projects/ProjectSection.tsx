import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import type { ProjectSection as ProjectSectionType } from './types'

interface ProjectSectionProps {
  section: ProjectSectionType
}

const gridClass: Record<string, string> = {
  'grid-2': 'md:grid-cols-2',
  'grid-3': 'md:grid-cols-3',
  'grid-4': 'sm:grid-cols-2 lg:grid-cols-4',
  'single': 'max-w-2xl mx-auto',
}

export function ProjectSection({ section }: ProjectSectionProps) {
  const isGray = section.backgroundColor === 'gray'

  return (
    <section className={cn('py-16 sm:py-20', isGray ? 'bg-neutral-50' : 'bg-white')}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {(section.title || section.description) && (
          <div className="text-center mb-12">
            {section.title && (
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-3">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-3xl mx-auto">
                {section.description}
              </p>
            )}
          </div>
        )}

        {section.cards && section.cards.length > 0 && (
          <div className={cn(
            'grid gap-6',
            section.layout === 'single' ? '' : 'md:grid-cols-2',
            gridClass[section.layout ?? 'grid-2']
          )}>
            {section.cards.map((card, i) => {
              const CardIcon = card.icon
              return (
                <div key={i} className={cn(designPrimitive.surface.card, 'p-6 sm:p-8')}>
                  {CardIcon && (
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-500/15">
                        <CardIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {card.title}
                      </h3>
                    </div>
                  )}

                  {!CardIcon && (
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                      {card.title}
                    </h3>
                  )}

                  {card.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                      {card.description}
                    </p>
                  )}

                  {card.features && card.features.length > 0 && (
                    <ul className="space-y-2.5">
                      {card.features.map((feat, fi) => (
                        <li key={fi} className="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-300">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

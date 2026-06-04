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
    <section className={cn('py-16 sm:py-20', isGray ? 'bg-surface-raised' : 'bg-surface-base')}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {(section.title || section.description) && (
          <div className="text-center mb-12">
            {section.title && (
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-3">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="text-base sm:text-lg text-text-tertiary max-w-3xl mx-auto">
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
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-action-muted/15">
                        <CardIcon className="h-5 w-5 text-action" />
                      </div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        {card.title}
                      </h3>
                    </div>
                  )}

                  {!CardIcon && (
                    <h3 className="text-lg font-semibold text-text-primary mb-3">
                      {card.title}
                    </h3>
                  )}

                  {card.description && (
                    <p className="text-sm text-text-secondary mb-4">
                      {card.description}
                    </p>
                  )}

                  {card.features && card.features.length > 0 && (
                    <ul className="space-y-2.5">
                      {card.features.map((feat, fi) => (
                        <li key={fi} className="flex items-start gap-2.5 text-sm text-text-secondary">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-action" />
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

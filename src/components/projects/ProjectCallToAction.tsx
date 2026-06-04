import Link from 'next/link'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import type { ProjectCTASection } from './types'

interface ProjectCallToActionProps {
  cta: ProjectCTASection
}

export function ProjectCallToAction({ cta }: ProjectCallToActionProps) {
  return (
    <section className="bg-primary-700 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            {cta.title}
          </h2>
          {cta.subtitle && (
            <p className="text-base sm:text-lg text-primary-100 max-w-2xl mx-auto">
              {cta.subtitle}
            </p>
          )}
        </div>

        <div className={cn(
          'grid gap-6',
          cta.actions.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' :
          cta.actions.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' :
          'max-w-sm mx-auto'
        )}>
          {cta.actions.map((action, i) => (
            <div key={i} className="flex flex-col rounded-lg bg-white/10 p-6">
              <h3 className="text-base font-semibold text-white mb-2">
                {action.title}
              </h3>
              <p className="text-sm text-primary-100 grow mb-5">
                {action.description}
              </p>
              {action.href.startsWith('http') ? (
                <a
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    designPrimitive.buttonBase,
                    designPrimitive.buttonSize.default,
                    designPrimitive.button.outlineLight,
                    'w-full justify-center'
                  )}
                >
                  {action.ctaText}
                </a>
              ) : (
                <Link
                  href={action.href}
                  className={cn(
                    designPrimitive.buttonBase,
                    designPrimitive.buttonSize.default,
                    designPrimitive.button.outlineLight,
                    'w-full justify-center'
                  )}
                >
                  {action.ctaText}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

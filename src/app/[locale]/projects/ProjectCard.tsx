'use client'

import { Link } from '@/i18n/navigation'
import { ArrowRight, CheckCircle2, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import { DESIGN_TOKENS } from '@/lib/design/tokens'
import type { ProjectView } from './data'

export function ProjectCard({ project, index = 0 }: { project: ProjectView; index?: number }) {
  const t = useTranslations('projects')
  const Icon = project.icon
  const iconBadge = DESIGN_TOKENS.iconBadges.projects

  // Structural facts (slug/category/status/year/icon) come from the config
  // SSOT; title/description/features are the project's translatable strings.
  const { description, features } = project
  // A branded product's name is a proper noun (config SSOT), not a translated
  // string — prefer it over the locale title.
  const title = project.brandName ?? project.title

  const cardClass = cn(
    designPrimitive.surface.card,
    'group flex flex-col animate-fade-in-up',
    'hover:border-strong transition-colors duration-200',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 rounded-2xl'
  )
  const cardStyle = { animationDelay: `${index * 60}ms` }
  const aria = `${title} — ${t('learnMore')}`

  const inner = (
    <div className="p-6 flex flex-col h-full">
        {/* Card header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            iconBadge.bg
          )}>
            <Icon className={cn('h-5 w-5', iconBadge.text)} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-text-primary truncate">
                {title}
              </h3>
              <span className={cn(
                designPrimitive.badgeBase,
                designPrimitive.badge.success
              )}>
                {t(`status.${project.status}`)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Calendar className="h-3.5 w-3.5" />
              <span>{t('since', { year: project.year })}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary mb-4 grow leading-relaxed">
          {description}
        </p>

        {/* Features */}
        {features.length > 0 && (
          <ul className="space-y-2 mb-5">
            {features.map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-tertiary">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-action" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-subtle flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
            {t(`categories.${project.category}`)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-action transition-colors">
            {t('learnMore')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
  )

  return project.externalHref ? (
    <a href={project.externalHref} aria-label={aria} className={cardClass} style={cardStyle}>
      {inner}
    </a>
  ) : (
    <Link href={`/projects/${project.slug}`} aria-label={aria} className={cardClass} style={cardStyle}>
      {inner}
    </Link>
  )
}

/**
 * ProjectHero Component
 *
 * Reusable hero section for project pages.
 * Follows existing design patterns from the site.
 */

import { ProjectHero as ProjectHeroType } from './types'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getTextColor, getButtonVariant } from '@/lib/design-system'
import { HERO_PATTERN_BACKGROUND } from '@/config/ui-colors'

interface ProjectHeroProps {
  hero: ProjectHeroType
}

export function ProjectHero({ hero }: ProjectHeroProps) {
  const { title, description, backgroundColor = 'bg-primary-700', ctas } = hero

  return (
    <section className={cn(
      'relative text-white py-24 overflow-hidden',
      backgroundColor
    )}>
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: HERO_PATTERN_BACKGROUND,
          backgroundSize: '20px 20px',
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{title}</h1>
          <p className={cn('text-xl mb-8', getTextColor('primary', 'secondary'))}>
            {description}
          </p>
          {ctas && ctas.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {ctas.map((cta, index) => {
                const variant = cta.variant || 'primary'
                const primaryBtn = cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all min-h-[44px] touch-target',
                  'bg-white text-primary-900 hover:bg-primary-50'
                )
                const outlineBtn = cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all min-h-[44px] touch-target',
                  'border-2 border-white text-white hover:bg-white/20'
                )
                const secondaryBtn = cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all min-h-[44px] touch-target',
                  getButtonVariant('primary').bg,
                  getButtonVariant('primary').text,
                  getButtonVariant('primary').hover
                )
                
                return (
                  <Link
                    key={index}
                    href={cta.href}
                    className={cn(
                      variant === 'primary' && primaryBtn,
                      variant === 'outline' && outlineBtn,
                      variant === 'secondary' && secondaryBtn,
                      !variant && primaryBtn
                    )}
                  >
                    {cta.text}
                    {cta.icon}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

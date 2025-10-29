/**
 * ProjectHero Component
 *
 * Reusable hero section for project pages.
 * Follows existing design patterns from the site.
 */

import { ProjectHero as ProjectHeroType } from './types'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ProjectHeroProps {
  hero: ProjectHeroType
}

export function ProjectHero({ hero }: ProjectHeroProps) {
  const { title, description, backgroundColor = 'from-green-700 via-green-800 to-green-900', ctas } = hero

  return (
    <section className={cn(
      'relative text-white py-24 overflow-hidden',
      backgroundColor.startsWith('from-')
        ? `bg-gradient-to-br ${backgroundColor}`
        : backgroundColor
    )}>
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{title}</h1>
          <p className="text-xl text-green-100 mb-8">
            {description}
          </p>
          {ctas && ctas.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {ctas.map((cta, index) => (
                <Link
                  key={index}
                  href={cta.href}
                  className={cn(
                    'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all',
                    cta.variant === 'primary' && 'bg-white text-green-900 hover:bg-green-50',
                    cta.variant === 'outline' && 'border-2 border-white text-white hover:bg-white/10',
                    cta.variant === 'secondary' && 'bg-green-600 text-white hover:bg-green-500',
                    !cta.variant && 'bg-white text-green-900 hover:bg-green-50'
                  )}
                >
                  {cta.text}
                  {cta.icon}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { responsiveSpacing, responsiveTypography } from '@/lib/responsive'

interface HeroBannerProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

/**
 * HeroBanner Component
 * 
 * @deprecated Use ResponsiveHero from @/components/layout/ResponsiveHero instead
 * This component is kept for backward compatibility but uses the new responsive system
 */
export function HeroBanner({
  title,
  description,
  children,
  className = ''
}: HeroBannerProps) {
  return (
    <section className={cn(
      'relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white overflow-hidden',
      responsiveSpacing.sectionLarge,
      className
    )}>
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
      <div className={cn('container mx-auto relative', responsiveSpacing.container)}>
        <div className="max-w-3xl">
          <h1 className={cn(responsiveTypography.hero, 'font-bold mb-4 sm:mb-6 leading-tight')}>
            {title}
          </h1>
          {description && (
            <p className={cn(responsiveTypography.lead, 'text-green-100 mb-6 sm:mb-8')}>
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  )
} 
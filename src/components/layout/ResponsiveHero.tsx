/**
 * ResponsiveHero Component
 * 
 * A reusable hero section component with consistent responsive styling.
 * Replaces manual hero implementations across pages.
 * 
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Created reusable responsive hero component
 */

import { ReactNode } from 'react'
import { responsiveSpacing, responsiveTypography, responsiveButtons } from '@/lib/responsive'
import { cn } from '@/lib/utils'
import { getTextColor, getBackgroundColor, getButtonVariant } from '@/lib/design-system'
import Link from 'next/link'
import { HERO_PATTERN_BACKGROUND } from '@/config/ui-colors'

export interface ResponsiveHeroProps {
  title: string
  subtitle?: string
  description?: string
  children?: ReactNode
  className?: string
  backgroundColor?: 'green' | 'blue' | 'gray' | 'white'
  backgroundPattern?: boolean
  ctas?: Array<{
    text: string
    href: string
    variant?: 'primary' | 'secondary' | 'outline'
  }>
}

export function ResponsiveHero({
  title,
  subtitle,
  description,
  children,
  className,
  backgroundColor = 'green',
  backgroundPattern = true,
  ctas,
}: ResponsiveHeroProps) {
  const bgClasses = {
    green: cn(
      'bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900',
      getTextColor('primary', 'primary')
    ),
    blue: cn(
      'bg-gradient-to-br from-info-700 via-info-800 to-info-900',
      getTextColor('info', 'primary')
    ),
    gray: cn(
      'bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900',
      getTextColor('dark', 'primary')
    ),
    white: cn(
      getBackgroundColor('white'),
      getTextColor('white', 'primary')
    ),
  }

  const buttonClasses = {
    primary: cn(
      'bg-white text-primary-800 hover:bg-primary-50',
      responsiveButtons.primary,
      'rounded-lg font-semibold transition-colors duration-300 text-center min-h-[44px]'
    ),
    secondary: cn(
      getButtonVariant('primary').bg,
      getButtonVariant('primary').text,
      getButtonVariant('primary').hover,
      responsiveButtons.secondary,
      'rounded-lg font-semibold transition-colors duration-300 text-center min-h-[44px]'
    ),
    outline: cn(
      'bg-transparent border-2 border-white text-white hover:bg-white/20',
      responsiveButtons.secondary,
      'rounded-lg font-semibold transition-colors duration-300 text-center min-h-[44px]'
    ),
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden',
        responsiveSpacing.sectionLarge,
        bgClasses[backgroundColor],
        className
      )}
    >
      {backgroundPattern && (
        <>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: HERO_PATTERN_BACKGROUND,
              backgroundSize: '20px 20px',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        </>
      )}
      
      <div className={cn('container mx-auto relative', responsiveSpacing.container)}>
        <div className="max-w-3xl">
          <h1 className={cn(responsiveTypography.hero, 'font-bold mb-4 sm:mb-6 leading-tight')}>
            {title}
          </h1>
          
          {subtitle && (
            <h2 className={cn(
              responsiveTypography.subsection,
              'font-semibold mb-4 sm:mb-6 md:mb-8',
              backgroundColor === 'white' 
                ? getTextColor('white', 'secondary')
                : backgroundColor === 'green'
                ? 'text-primary-100'
                : backgroundColor === 'blue'
                ? 'text-info-100'
                : 'text-neutral-200'
            )}>
              {subtitle}
            </h2>
          )}
          
          {description && (
            <p className={cn(
              responsiveTypography.lead,
              'mb-6 sm:mb-8',
              backgroundColor === 'white' 
                ? getTextColor('white', 'muted')
                : backgroundColor === 'green'
                ? 'text-primary-50'
                : backgroundColor === 'blue'
                ? 'text-info-50'
                : 'text-neutral-300'
            )}>
              {description}
            </p>
          )}

          {ctas && ctas.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {ctas.map((cta, index) => (
                <Link
                  key={index}
                  href={cta.href}
                  className={buttonClasses[cta.variant || 'primary']}
                >
                  {cta.text}
                </Link>
              ))}
            </div>
          )}

          {children}
        </div>
      </div>
    </section>
  )
}

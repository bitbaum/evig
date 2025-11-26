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
import Link from 'next/link'

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
    green: 'bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white',
    blue: 'bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white',
    gray: 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 text-white',
    white: 'bg-white text-gray-900',
  }

  const buttonClasses = {
    primary: cn(
      'bg-white text-green-800 hover:bg-green-50',
      responsiveButtons.primary,
      'rounded-lg font-semibold transition-colors duration-300 text-center'
    ),
    secondary: cn(
      'bg-green-600 text-white hover:bg-green-700',
      responsiveButtons.secondary,
      'rounded-lg font-semibold transition-colors duration-300 text-center'
    ),
    outline: cn(
      'bg-transparent border-2 border-white text-white hover:bg-white/10',
      responsiveButtons.secondary,
      'rounded-lg font-semibold transition-colors duration-300 text-center'
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
              backgroundImage:
                'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
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
              backgroundColor === 'white' ? 'text-gray-700' : 'text-green-200'
            )}>
              {subtitle}
            </h2>
          )}
          
          {description && (
            <p className={cn(
              responsiveTypography.lead,
              'mb-6 sm:mb-8',
              backgroundColor === 'white' ? 'text-gray-600' : 'text-green-100'
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


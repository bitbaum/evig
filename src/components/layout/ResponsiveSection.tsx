/**
 * ResponsiveSection Component
 * 
 * A reusable section wrapper that handles all responsive spacing and layout
 * automatically. Use this instead of manual responsive classes.
 * 
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Created reusable responsive section component
 */

import { ReactNode } from 'react'
import { responsiveSpacing, responsiveTypography } from '@/lib/responsive'
import { cn } from '@/lib/utils'

export interface ResponsiveSectionProps {
  children: ReactNode
  className?: string
  backgroundColor?: 'white' | 'gray' | 'green' | 'gradient'
  padding?: 'default' | 'large' | 'small'
  container?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function ResponsiveSection({
  children,
  className,
  backgroundColor = 'white',
  padding = 'default',
  container = true,
  maxWidth = 'xl',
}: ResponsiveSectionProps) {
  const bgClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    green: 'bg-green-50',
    gradient: 'bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white',
  }

  const paddingClasses = {
    default: responsiveSpacing.section,
    large: responsiveSpacing.sectionLarge,
    small: 'py-8 sm:py-12',
  }

  const maxWidthClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  }

  const sectionClasses = cn(
    paddingClasses[padding],
    bgClasses[backgroundColor],
    className
  )

  if (!container) {
    return <section className={sectionClasses}>{children}</section>
  }

  return (
    <section className={sectionClasses}>
      <div className={cn('container mx-auto', responsiveSpacing.container)}>
        <div className={cn('mx-auto', maxWidthClasses[maxWidth])}>
          {children}
        </div>
      </div>
    </section>
  )
}

export interface ResponsiveHeadingProps {
  children: ReactNode
  level?: 1 | 2 | 3 | 4
  className?: string
  align?: 'left' | 'center' | 'right'
}

export function ResponsiveHeading({
  children,
  level = 2,
  className,
  align = 'left',
}: ResponsiveHeadingProps) {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
  
  const typographyClasses = {
    1: responsiveTypography.hero,
    2: responsiveTypography.section,
    3: responsiveTypography.subsection,
    4: responsiveTypography.cardTitle,
  }

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <HeadingTag
      className={cn(
        'font-bold leading-tight',
        typographyClasses[level],
        alignClasses[align],
        className
      )}
    >
      {children}
    </HeadingTag>
  )
}

export interface ResponsiveTextProps {
  children: ReactNode
  variant?: 'body' | 'bodyLarge' | 'lead' | 'small'
  className?: string
  align?: 'left' | 'center' | 'right'
}

export function ResponsiveText({
  children,
  variant = 'body',
  className,
  align = 'left',
}: ResponsiveTextProps) {
  const typographyClasses = {
    body: responsiveTypography.body,
    bodyLarge: responsiveTypography.bodyLarge,
    lead: responsiveTypography.lead,
    small: responsiveTypography.small,
  }

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <p className={cn(typographyClasses[variant], alignClasses[align], className)}>
      {children}
    </p>
  )
}


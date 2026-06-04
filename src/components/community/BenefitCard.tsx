/**
 * BenefitCard Component
 *
 * Reusable card component for displaying benefits across community pages.
 * Eliminates code duplication across get-involved sub-pages.
 */

import { LucideIcon } from 'lucide-react'
import { responsiveTypography, responsiveSpacing } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'

export interface BenefitCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export function BenefitCard({ icon: Icon, title, description, className = '' }: BenefitCardProps) {
  return (
    <div className={`card-shell ${responsiveSpacing.cardPadding} hover:border-strong transition-colors duration-300 ${className}`}>
      <div className={`text-action ${responsiveSpacing.mbSmall}`}>
        <Icon className="w-10 h-10" />
      </div>
      <Heading level={3} className={`${responsiveTypography.cardTitle} font-semibold ${responsiveSpacing.mbSmall} text-text-primary`}>
        {title}
      </Heading>
      <p className={`${responsiveTypography.body} text-text-secondary leading-relaxed`}>
        {description}
      </p>
    </div>
  )
}

/**
 * BenefitCardGrid Component
 *
 * Grid container for benefit cards with responsive layout.
 */

interface BenefitCardGridProps {
  children: React.ReactNode
  className?: string
}

export function BenefitCardGrid({ children, className = '' }: BenefitCardGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${className}`}>
      {children}
    </div>
  )
}

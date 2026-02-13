/**
 * PageSection Component
 *
 * Reusable component for standard page sections with title and content.
 * Used for overview sections across all get-involved pages.
 */

import { responsiveTypography, responsiveSpacing } from '@/lib/responsive'

interface PageSectionProps {
  title: string
  content: string
  className?: string
}

export function PageSection({ title, content, className = '' }: PageSectionProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      <h2 className={`${responsiveTypography.section} font-bold text-gray-900`}>
        {title}
      </h2>
      <p className={`${responsiveTypography.lead} text-gray-600 leading-relaxed`}>
        {content}
      </p>
    </section>
  )
}

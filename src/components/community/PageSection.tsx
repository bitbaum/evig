/**
 * PageSection Component
 *
 * Reusable component for standard page sections with title and content.
 * Used for overview sections across all get-involved pages.
 */

import { responsiveTypography, responsiveSpacing } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'

interface PageSectionProps {
  title: string
  content: string
  className?: string
}

export function PageSection({ title, content, className = '' }: PageSectionProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      <Heading level={2} className={`${responsiveTypography.section} font-bold text-neutral-900`}>
        {title}
      </Heading>
      <p className={`${responsiveTypography.lead} text-neutral-600 leading-relaxed`}>
        {content}
      </p>
    </section>
  )
}

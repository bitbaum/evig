/**
 * InfoSection Component
 *
 * Reusable component for displaying list sections with checkmark bullets.
 * Used across all get-involved pages for features, requirements, etc.
 */

import { responsiveTypography, responsiveSpacing } from '@/lib/responsive'
import { ListItem } from '@/config/community'
import Heading from '@/components/ui/Heading'

interface InfoSectionProps {
  title: string
  items: ListItem[]
  description?: string
  className?: string
}

export function InfoSection({ title, items, description, className = '' }: InfoSectionProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      <Heading level={2} className={`${responsiveTypography.section} font-bold text-text-primary`}>
        {title}
      </Heading>
      {description && (
        <p className={`${responsiveTypography.lead} text-text-secondary leading-relaxed ${responsiveSpacing.mbMedium}`}>
          {description}
        </p>
      )}
      <div className={`card-shell ${responsiveSpacing.cardPadding}`}>
        <ul className={`space-y-${description ? '4' : '4'}`}>
          {items.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="text-action mr-3">•</span>
              <span className={`${responsiveTypography.body} text-text-secondary`}>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * NumberedSteps Component
 *
 * Reusable component for displaying step-by-step processes.
 * Used for "How to Get Started" sections across pages.
 */

interface NumberedStepsProps {
  title: string
  steps: ListItem[]
  className?: string
}

export function NumberedSteps({ title, steps, className = '' }: NumberedStepsProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      <Heading level={2} className={`${responsiveTypography.section} font-bold text-text-primary`}>
        {title}
      </Heading>
      <div className={`card-shell ${responsiveSpacing.cardPadding}`}>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="text-action font-semibold mr-3">{index + 1}.</span>
              <span className={`${responsiveTypography.body} text-text-secondary`}>{step.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/**
 * Callout Component
 *
 * Reusable component for highlighted callout boxes.
 * Used for important messages, notes, and highlighted content.
 */

interface CalloutProps {
  title: string
  content: string
  className?: string
}

export function Callout({ title, content, className = '' }: CalloutProps) {
  return (
    <section className={`bg-primary-50 dark:bg-primary-900/20 rounded-xl ${responsiveSpacing.cardPadding} space-y-4 ${className}`}>
      <Heading level={3} className={`${responsiveTypography.cardTitle} font-semibold text-text-primary`}>
        {title}
      </Heading>
      <p className={`${responsiveTypography.body} text-text-secondary leading-relaxed`}>
        {content}
      </p>
    </section>
  )
}

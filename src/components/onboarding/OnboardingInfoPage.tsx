'use client'

/**
 * OnboardingInfoPage - Shared component for onboarding info pages
 *
 * Renders onboarding page from config (SSOT pattern).
 * Was intended to be used by seller and repairer onboarding pages.
 *
 * @deprecated Orphaned — zero importers. The only thing that points to
 *   OnboardingConfig is this file itself. Tracked in docs/DEAD_CODE.md.
 */

import { Link } from '@/i18n/navigation'
import { useState } from 'react'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import type { OnboardingConfig } from '@/config/onboarding'
import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/Heading'

interface OnboardingInfoPageProps {
  config: OnboardingConfig
}

export function OnboardingInfoPage({ config }: OnboardingInfoPageProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  const HeaderIcon = config.header.icon

  return (
    <div className="min-h-screen bg-surface-raised">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.header.iconBgColor} mb-4`}>
            <HeaderIcon className={`w-8 h-8 ${config.header.iconColor}`} />
          </div>
          <Heading level={1} className="text-3xl font-bold text-text-primary mb-4">
            {config.header.title}
          </Heading>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            {config.header.subtitle}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {config.benefits.map((benefit, index) => {
            const BenefitIcon = benefit.icon
            return (
              <div
                key={index}
                className="card-shell rounded-lg p-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="shrink-0">
                    <BenefitIcon className={`w-6 h-6 ${benefit.iconColor}`} />
                  </div>
                  <div>
                    <Heading level={3} className="font-semibold text-text-primary mb-2">
                      {benefit.title}
                    </Heading>
                    <p className="text-text-secondary text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Requirements Section */}
        <div className="card-shell rounded-lg p-6 mb-8">
          <Heading level={2} className="text-xl font-semibold text-text-primary mb-4">
            {config.requirements.title}
          </Heading>
          <ul className="space-y-4">
            {config.requirements.items.map((item, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-surface-raised text-text-secondary flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-text-primary">{item.title}</p>
                  <p className="text-sm text-text-secondary">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing Info Box */}
        <div className="bg-surface-raised rounded-lg p-6 border border-strong dark:border-white/6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <config.pricing.icon className={`w-6 h-6 ${config.pricing.iconColor}`} />
            <Heading level={2} className="text-xl font-semibold text-text-primary">
              {config.pricing.title}
            </Heading>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.pricing.items.map((item, index) => (
              <div key={index} className="flex items-baseline space-x-2">
                <span className="font-bold text-action">{item.label}</span>
                <span className="text-text-secondary text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges (optional) */}
        {config.trustBadges && config.trustBadges.length > 0 && (
          <div className="flex justify-center space-x-8 mb-8">
            {config.trustBadges.map((badge, index) => {
              const BadgeIcon = badge.icon
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-raised mb-2">
                    <BadgeIcon className={`w-6 h-6 ${badge.iconColor}`} />
                  </div>
                  <p className="font-medium text-text-primary text-sm">{badge.title}</p>
                  <p className="text-text-tertiary text-xs">{badge.subtitle}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mb-12">
          <Link
            href={config.cta.href}
            className={`inline-flex items-center px-8 py-3 rounded-lg text-white font-medium ${config.cta.buttonColor} transition-colors`}
          >
            {config.cta.label}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <p className="mt-4 text-text-secondary">
            {config.cta.loginText}{' '}
            <Link href={config.cta.loginHref} className={config.cta.linkColor}>
              Anmelden
            </Link>
          </p>
        </div>

        {/* FAQ Section */}
        <div className="card-shell rounded-lg p-6">
          <Heading level={2} className="text-xl font-semibold text-text-primary mb-6">
            {config.faq.title}
          </Heading>
          <div className="space-y-4">
            {config.faq.items.map((item, index) => (
              <div key={index} className="border-b border-subtle last:border-0 pb-4 last:pb-0">
                <Button
                  variant="ghost"
                  onClick={() => toggleFaq(index)}
                  className="flex items-center justify-between w-full text-left h-auto px-0"
                >
                  <span className="font-medium text-text-primary">{item.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-text-tertiary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-tertiary" />
                  )}
                </Button>
                {expandedFaq === index && (
                  <p className="mt-2 text-text-secondary text-sm">{item.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

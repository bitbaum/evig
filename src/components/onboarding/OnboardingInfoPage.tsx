'use client'

/**
 * OnboardingInfoPage - Shared component for onboarding info pages
 *
 * Renders onboarding page from config (SSOT pattern).
 * Used by both seller and repairer onboarding pages.
 */

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import type { OnboardingConfig } from '@/config/onboarding'
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.header.iconBgColor} mb-4`}>
            <HeaderIcon className={`w-8 h-8 ${config.header.iconColor}`} />
          </div>
          <Heading level={1} className="text-3xl font-bold text-gray-900 mb-4">
            {config.header.title}
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <BenefitIcon className={`w-6 h-6 ${benefit.iconColor}`} />
                  </div>
                  <div>
                    <Heading level={3} className="font-semibold text-gray-900 mb-2">
                      {benefit.title}
                    </Heading>
                    <p className="text-gray-600 text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Requirements Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <Heading level={2} className="text-xl font-semibold text-gray-900 mb-4">
            {config.requirements.title}
          </Heading>
          <ul className="space-y-4">
            {config.requirements.items.map((item, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <config.pricing.icon className={`w-6 h-6 ${config.pricing.iconColor}`} />
            <Heading level={2} className="text-xl font-semibold text-gray-900">
              {config.pricing.title}
            </Heading>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.pricing.items.map((item, index) => (
              <div key={index} className="flex items-baseline space-x-2">
                <span className="font-bold text-blue-600">{item.label}</span>
                <span className="text-gray-600 text-sm">{item.value}</span>
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
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-2">
                    <BadgeIcon className={`w-6 h-6 ${badge.iconColor}`} />
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{badge.title}</p>
                  <p className="text-gray-500 text-xs">{badge.subtitle}</p>
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
          <p className="mt-4 text-gray-600">
            {config.cta.loginText}{' '}
            <Link href={config.cta.loginHref} className={config.cta.linkColor}>
              Anmelden
            </Link>
          </p>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <Heading level={2} className="text-xl font-semibold text-gray-900 mb-6">
            {config.faq.title}
          </Heading>
          <div className="space-y-4">
            {config.faq.items.map((item, index) => (
              <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium text-gray-900">{item.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <p className="mt-2 text-gray-600 text-sm">{item.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import {
  MapPin,
  Store,
  GraduationCap,
  Cpu,
  Music2,
  Users,
  Coffee,
  Wrench,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getFormattedAddress } from '@/data/impact-metrics'
import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/Heading'

const offeringIcons: Record<number, React.ReactNode> = {
  0: <Store className="h-5 w-5" />,
  1: <Cpu className="h-5 w-5" />,
  2: <Users className="h-5 w-5" />,
  3: <Wrench className="h-5 w-5" />,
}

const visionIcons: Record<number, React.ReactNode> = {
  0: <Cpu className="h-5 w-5" />,
  1: <Music2 className="h-5 w-5" />,
  2: <Wrench className="h-5 w-5" />,
  3: <GraduationCap className="h-5 w-5" />,
  4: <Coffee className="h-5 w-5" />,
}

export default function CommunitySpaceSection() {
  const t = useTranslations('components.communitySpace')
  const address = getFormattedAddress()

  const offerings = t.raw('offerings') as string[]
  const workshopsTopics = t.raw('workshops.topics') as string[]
  const visionFeatures = t.raw('vision.features') as string[]

  return (
    <section className="py-20 bg-surface-overlay text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-action rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-action rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-action/20 text-action px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MapPin className="h-4 w-4" />
            {t('badge')}
          </div>
          <Heading level={2} className="text-4xl md:text-5xl font-bold mb-6">
            {t('heading')}
          </Heading>
          <p className="text-xl text-text-tertiary max-w-3xl mx-auto">
            {t('intro')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Current Location */}
          <div className="bg-surface-overlay rounded-2xl p-8 border border-strong">
            <Heading level={3} className="text-2xl font-bold mb-2">{t('locationName')}</Heading>
            <p className="text-action font-medium mb-6 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {address}
            </p>

            <Heading level={4} className="text-lg font-semibold mb-4 text-text-muted">{t('offeringsTitle')}</Heading>
            <ul className="space-y-3">
              {offerings.map((offering, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="p-2 bg-action/20 rounded-lg text-action">
                    {offeringIcons[index] || <Store className="h-5 w-5" />}
                  </div>
                  <span className="text-text-muted">{offering}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button
                className="w-full sm:w-auto"
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {t('planRoute')}
              </Button>
            </div>
          </div>

          {/* Workshops */}
          <div className="bg-surface-overlay/50 rounded-2xl p-8 border border-strong">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-action/20 rounded-lg text-action">
                <GraduationCap className="h-6 w-6" />
              </div>
              <Heading level={3} className="text-2xl font-bold">{t('workshops.title')}</Heading>
            </div>

            <p className="text-text-muted mb-6">
              {t('workshopDesc')}
            </p>

            <ul className="space-y-2 mb-6">
              {workshopsTopics.map((topic, index) => (
                <li key={index} className="flex items-center gap-2 text-text-muted">
                  <ArrowRight className="h-4 w-4 text-action shrink-0" />
                  {topic}
                </li>
              ))}
            </ul>

            <Button variant="outline-light" className="border-action text-action hover:bg-action hover:text-white w-full sm:w-auto">
              {t('workshopLink')}
            </Button>
          </div>
        </div>

        {/* Vision Section */}
        <div className="bg-action-muted rounded-2xl p-8 md:p-12 border border-action">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-action/20 rounded-lg text-action">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <span className="text-sm text-action font-medium">{t('visionLabel')}</span>
              <Heading level={3} className="text-2xl font-bold">{t('vision.title')}</Heading>
            </div>
          </div>

          <p className="text-lg text-text-muted mb-8 max-w-3xl">
            {t('vision.description')}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visionFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-surface-overlay/50 rounded-xl p-4 flex items-start gap-3 border border-strong/50"
              >
                <div className="p-2 bg-action/10 rounded-lg text-action shrink-0">
                  {visionIcons[index] || <Sparkles className="h-5 w-5" />}
                </div>
                <span className="text-text-muted text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-strong/50 text-center">
            <p className="text-text-muted mb-4">
              {t('visionCta')}
            </p>
            <Button>
              {t('supportProject')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

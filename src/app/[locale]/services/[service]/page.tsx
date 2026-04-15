import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ServiceHero from '@/components/services/ServiceHero'
import ServiceFeatures from '@/components/services/ServiceFeatures'
import ServicePricing from '@/components/services/ServicePricing'
import ServiceProcessSection from '@/components/services/ServiceProcess'
import ServiceCTA from '@/components/services/ServiceCTA'
import { getService, getAllServiceSlugs } from '@/lib/services'
import { Clock } from 'lucide-react'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

/**
 * Generate static paths for all featured services
 */
export async function generateStaticParams() {
  const slugs = await getAllServiceSlugs()
  return slugs.map((slug) => ({ service: slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service: slug } = await params
  const service = await getService(slug)

  if (!service) {
    return {
      title: `Service Not Found | ${ORG.name}`,
      description: 'The requested service could not be found.',
    }
  }

  // Special SEO metadata for data recovery
  if (slug === 'data-recovery-transfer') {
    return {
      title: `Data Recovery & Transfer Services Zurich | ${ORG.name}`,
      description: 'Professional data recovery and transfer services in Zurich. Recover data from old computers, transfer files between devices, access legacy media (floppy disks, ZIP drives, MO drives). Base fee CHF 30.',
      keywords: [
        'data recovery zurich',
        'data transfer service',
        'floppy disk data recovery',
        'ZIP drive data recovery',
        'legacy data recovery',
        'old computer data recovery',
        'data migration service',
        'file transfer service',
        'MO drive data recovery',
        'SCSI IDE data recovery'
      ],
      openGraph: {
        title: `Data Recovery & Transfer Services Zurich | ${ORG.name}`,
        description: 'Professional data recovery and transfer services in Zurich. Recover data from old computers, transfer files between devices, access legacy media.',
        type: 'website',
        url: 'https://revampit.org/services/data-recovery-transfer',
      },
    }
  }

  return {
    title: `${service.name} | ${ORG.name}`,
    description: service.description,
    openGraph: {
      title: `${service.name} | ${ORG.name}`,
      description: service.description,
      type: 'website',
    },
  }
}

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service: slug } = await params
  const service = await getService(slug)
  const t = await getTranslations('services.servicePage')

  if (!service) {
    notFound()
  }

  const isComingSoon = !service.isActive

  return (
    <>
      {slug === 'data-recovery-transfer' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              'name': 'Data Recovery & Transfer Services',
              'description': 'Professional data recovery and transfer services for all types of storage media.',
              'provider': {
                '@type': 'Organization',
                'name': ORG.name,
                'url': ORG.website,
                'logo': `${ORG.website}/logo.png`,
                'address': {
                  '@type': 'PostalAddress',
                  'addressLocality': 'Zurich',
                  'addressRegion': 'ZH',
                  'addressCountry': 'CH'
                }
              },
              'serviceType': [
                'Data Recovery',
                'Data Transfer',
                'Legacy Media Access',
                'File Migration'
              ],
              'areaServed': {
                '@type': 'City',
                'name': 'Zurich'
              },
              'hasOfferCatalog': {
                '@type': 'OfferCatalog',
                'name': 'Data Recovery Services',
                'itemListElement': [
                  {
                    '@type': 'Offer',
                    'itemOffered': {
                      '@type': 'Service',
                      'name': 'Data Recovery Base Service',
                      'description': 'Base data recovery service with assessment'
                    },
                    'price': '30',
                    'priceCurrency': 'CHF'
                  }
                ]
              }
            })
          }}
        />
      )}
      <main>
        {/* Coming Soon Banner */}
        {isComingSoon && (
          <div className="bg-yellow-100 border-b border-yellow-200">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-semibold">{t('comingSoonBanner')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <ServiceHero hero={service.hero} />

        {/* Features Section */}
        <ServiceFeatures features={service.features} />

        {/* Pricing Section */}
        <ServicePricing pricing={service.pricing} />

        {/* Process Section */}
        {service.process && <ServiceProcessSection process={service.process} />}

        {/* CTA Section */}
        <ServiceCTA
          serviceTitle={service.name}
          serviceSlug={service.isBookable ? slug : undefined}
          pricing={service.pricing.base}
        />
      </main>
    </>
  )
} 
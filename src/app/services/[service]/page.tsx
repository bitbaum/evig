import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ServiceHero from '@/components/services/ServiceHero'
import ServiceFeatures from '@/components/services/ServiceFeatures'
import ServicePricing from '@/components/services/ServicePricing'
import ServiceProcessSection from '@/components/services/ServiceProcess'
import ServiceCTA from '@/components/services/ServiceCTA'
import { getService, getAllServiceSlugs } from '@/lib/services'
import { Clock } from 'lucide-react'
import { ORG, ORG_IMAGES, LOCATIONS } from '@/config/org'

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
      title: 'Service Not Found',
      description: 'The requested service could not be found.',
    }
  }

  // Special SEO metadata for data recovery
  if (slug === 'data-recovery-transfer') {
    const city = LOCATIONS.store.city
    return {
      title: { absolute: `Data Recovery & Transfer Services ${city} | ${ORG.name}` },
      description: `Professional data recovery and transfer services in ${city}. Recover data from old computers, transfer files between devices, access legacy media (floppy disks, ZIP drives, MO drives). Base fee CHF 30.`,
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
        title: `Data Recovery & Transfer Services ${city} | ${ORG.name}`,
        description: `Professional data recovery and transfer services in ${city}. Recover data from old computers, transfer files between devices, access legacy media.`,
        type: 'website',
        url: `${ORG.website}/services/data-recovery-transfer`,
      },
    }
  }

  return {
    title: `${service.name}`,
    description: service.description,
    openGraph: {
      title: `${service.name}`,
      description: service.description,
      type: 'website',
    },
  }
}

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service: slug } = await params
  const service = await getService(slug)

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
                'logo': `${ORG.website}${ORG_IMAGES.logo}`,
                'address': {
                  '@type': 'PostalAddress',
                  'addressLocality': LOCATIONS.store.city,
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
                'name': LOCATIONS.store.city,
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
          <div className="bg-warning-100 dark:bg-warning-900/30 border-b border-warning-200 dark:border-warning-800/30">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning-600 mr-2" />
                <span className="text-warning-800 font-semibold">Dieser Service kommt bald. Kontaktieren Sie uns, um Ihr Interesse zu bekunden und benachrichtigt zu werden, wenn er verfügbar ist.</span>
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
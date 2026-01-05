import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ServiceHero from '@/components/services/ServiceHero'
import ServiceFeatures from '@/components/services/ServiceFeatures'
import ServicePricing from '@/components/services/ServicePricing'
import ServiceProcessSection from '@/components/services/ServiceProcess'
import ServiceCTA from '@/components/services/ServiceCTA'
import { services } from '@/data/services'
import { Clock } from 'lucide-react'

export async function generateMetadata({ params }: { params: { service: string } }): Promise<Metadata> {
  const service = services[params.service as keyof typeof services]
  
  if (!service) {
    return {
      title: 'Service Not Found | RevampIT',
      description: 'The requested service could not be found.',
    }
  }

  if (params.service === 'data-recovery-transfer') {
    return {
      title: 'Data Recovery & Transfer Services Zurich | RevampIT',
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
        title: 'Data Recovery & Transfer Services Zurich | RevampIT',
        description: 'Professional data recovery and transfer services in Zurich. Recover data from old computers, transfer files between devices, access legacy media.',
        type: 'website',
        url: 'https://revampit.org/services/data-recovery-transfer',
      },
    }
  }

  return {
    title: `${service.title} | RevampIT`,
    description: service.description,
    openGraph: {
      title: `${service.title} | RevampIT`,
      description: service.description,
      type: 'website',
    },
  }
}

export default function ServicePage({ params }: { params: { service: string } }) {
  const service = services[params.service as keyof typeof services]
  
  if (!service) {
    notFound()
  }

  const isComingSoon = false

  return (
    <>
      {params.service === 'data-recovery-transfer' && (
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
                'name': 'RevampIT',
                'url': 'https://revampit.org',
                'logo': 'https://revampit.org/logo.png',
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
                <span className="text-yellow-800 font-semibold">Dieser Service kommt bald. Kontaktieren Sie uns, um Ihr Interesse zu bekunden und benachrichtigt zu werden, wenn er verfügbar ist.</span>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <ServiceHero hero={service.hero} />

        {/* Features Section */}
        <ServiceFeatures features={service.features} />

        {/* Pricing Section */}
        {service.pricing && <ServicePricing pricing={service.pricing} />}

        {/* Process Section */}
        {service.process && <ServiceProcessSection process={service.process} />}

        {/* CTA Section */}
        <ServiceCTA
          serviceTitle={service.title}
          serviceSlug={params.service}
          pricing={service.pricing?.base}
        />
      </main>
    </>
  )
} 
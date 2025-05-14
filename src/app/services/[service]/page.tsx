import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { 
  HardDrive, 
  Server, 
  Database, 
  Archive, 
  CheckCircle2, 
  Clock, 
  Zap,
  FolderInput,
  Disc
} from 'lucide-react'
import Link from 'next/link'

const services = {
  'computer-repair-upgrades': {
    title: 'Computer Repair & Upgrades',
    description: 'Expert computer repairs and upgrades. We specialize in fixing what others can\'t, including motherboard repairs and component-level fixes.',
    icon: HardDrive,
    hero: {
      title: 'Computer Repair & Upgrades',
      subtitle: 'Expert Repairs You Can Trust',
      description: 'We combine technical expertise with sustainable practices to extend the life of your devices. Our repair services focus on fixing what others can\'t, saving you money and reducing electronic waste.'
    },
    features: [
      {
        title: 'Component-Level Repairs',
        description: 'We don\'t just replace parts - we fix them. Our technicians can repair motherboards, power supplies, and other components at the circuit level.',
        icon: HardDrive
      },
      {
        title: 'Hardware Upgrades',
        description: 'Extend the life of your computer with strategic upgrades. We can help you choose and install the right components to meet your needs.',
        icon: Zap
      },
      {
        title: 'Diagnostic Services',
        description: 'Comprehensive diagnostics to identify and fix issues quickly. We use professional tools and years of experience to pinpoint problems accurately.',
        icon: Database
      },
      {
        title: 'Professional Assessment',
        description: 'All repairs start with a thorough evaluation to determine the best course of action and provide an accurate estimate.',
        icon: Clock
      }
    ],
    pricing: {
      base: 'CHF 70/hour + parts',
      details: [
        'CHF 30 evaluation fee included in final cost',
        'CHF 70 per hour labor rate',
        'Parts cost additional',
        'Professional assessment required'
      ]
    },
    process: [
      {
        step: 1,
        title: 'Evaluation',
        description: 'We\'ll examine your device and provide a detailed assessment of the issue. The CHF 30 evaluation fee will be included in your final repair cost.'
      },
      {
        step: 2,
        title: 'Quote',
        description: 'You\'ll receive a transparent quote for the repair, including parts and labor costs.'
      },
      {
        step: 3,
        title: 'Repair',
        description: 'Our technicians will fix your device using high-quality parts. Typical repair time is a few weeks due to parts availability.'
      },
      {
        step: 4,
        title: 'Testing',
        description: 'We thoroughly test all repairs to ensure your device is working perfectly before return.'
      }
    ]
  },
  'data-recovery-transfer': {
    title: 'Data Recovery & Transfer',
    description: 'Professional data transfer and recovery services for all types of storage media. We help you access and transfer your valuable data from any device or format.',
    icon: HardDrive,
    hero: {
      title: 'Data Recovery & Transfer',
      subtitle: 'Access Your Data, Preserve Your History',
      description: 'Whether you need to recover data from a non-working device, transfer data between computers, or access data from legacy storage media, we have the expertise and equipment to help.'
    },
    features: [
      {
        title: 'Media Support',
        description: 'Our Dino server features 14 front-accessible drives and multiple interfaces, ready to handle almost any data transfer task.',
        icon: Server
      },
      {
        title: 'Data Transfer',
        description: 'Transfer data between computers, migrate settings, or create backups. We can handle large data volumes efficiently.',
        icon: FolderInput
      },
      {
        title: 'Legacy Media Access',
        description: 'Access data from any storage media, even if you no longer have the necessary drive. We support all formats including floppy disks, ZIP drives, MO drives, and more.',
        icon: Disc
      },
      {
        title: 'Custom Solutions',
        description: 'Need a similar server setup for your location? We can build a custom solution tailored to your specific needs.',
        icon: Database
      }
    ],
    pricing: {
      base: 'CHF 30 per job + media cost',
      details: [
        'Base fee: CHF 30 per job',
        'Media cost additional if not provided',
        'Legacy media support available',
        'Custom solutions on request'
      ],
      mediaPrices: [
        'Floppy disks (3.5" and 5.25"): CHF 10 per disk',
        'ZIP/Syquest/EZ Drive/Jazz: CHF 20 per disk',
        'MO drives (3.5"-5.25"): CHF 30 per disk',
        'Hard disks: CHF 40 per disk',
        'Tape drives: CHF 50 per tape',
        'VHS/Records: Price on request'
      ]
    },
    process: [
      {
        step: 1,
        title: 'Assessment',
        description: 'We\'ll evaluate your storage media and determine the best approach for data transfer or recovery.'
      },
      {
        step: 2,
        title: 'Transfer',
        description: 'Using our specialized equipment, we\'ll transfer your data to the media of your choice.'
      },
      {
        step: 3,
        title: 'Verification',
        description: 'We verify the integrity of the transferred data to ensure everything is copied correctly.'
      },
      {
        step: 4,
        title: 'Delivery',
        description: 'Your data is returned to you on the media of your choice, ready to use.'
      }
    ]
  },
  'linux-open-source': {
    title: 'Linux & Open Source',
    description: 'Professional Linux installation, support, and training. We help you transition to open-source software and provide ongoing support.',
    icon: Server,
    hero: {
      title: 'Linux & Open Source Solutions',
      subtitle: 'Expert Open Source Support',
      description: 'We help you transition to and maintain Linux and open-source software solutions, providing expert support and training.'
    },
    features: [
      {
        title: 'Linux Installation',
        description: 'Professional installation and setup of Linux distributions.',
        icon: Server
      },
      {
        title: 'Open Source Migration',
        description: 'Smooth transition from proprietary to open-source software.',
        icon: Zap
      },
      {
        title: 'Technical Support',
        description: 'Expert support for all your Linux and open-source needs.',
        icon: Database
      },
      {
        title: 'Training & Workshops',
        description: 'Comprehensive training and workshops for individuals and teams.',
        icon: Clock
      }
    ],
    pricing: {
      base: 'Support from CHF 70/hour',
      details: [
        'Free initial consultation',
        'Custom training programs',
        'Ongoing support',
        'Workshop scheduling'
      ]
    }
  },
  'hardware-recycling': {
    title: 'Hardware Recycling',
    description: 'Responsible recycling and refurbishment of IT equipment. We give your old devices a new life while ensuring secure data deletion.',
    icon: Archive,
    hero: {
      title: 'Hardware Recycling',
      subtitle: 'Sustainable IT Solutions',
      description: 'We provide responsible recycling and refurbishment services for IT equipment, helping reduce electronic waste while ensuring secure data deletion.'
    },
    features: [
      {
        title: 'Secure Data Deletion',
        description: 'Complete and secure deletion of all data from devices.',
        icon: Archive
      },
      {
        title: 'Equipment Refurbishment',
        description: 'Professional refurbishment of IT equipment.',
        icon: HardDrive
      },
      {
        title: 'Component Recycling',
        description: 'Responsible recycling of electronic components.',
        icon: Zap
      },
      {
        title: 'Free Pickup Service',
        description: 'Convenient pickup service for your old equipment.',
        icon: Clock
      }
    ],
    pricing: {
      base: 'Free for most items',
      details: [
        'Free pickup service',
        'Secure data deletion',
        'Environmentally responsible',
        'Certificate of destruction'
      ]
    }
  },
  'build-your-computer': {
    title: 'Build Your Computer',
    description: 'Get a custom-built computer tailored to your specific needs, powered by AI analysis of our extensive inventory.',
    icon: Server,
    hero: {
      title: 'Build Your Computer',
      subtitle: 'AI-Powered Custom Builds',
      description: 'Our advanced AI system analyzes our inventory to suggest the perfect build for your specific use case. Whether you need a computer for business, gaming, music production, video/photo editing, or everyday use, we\'ll find the optimal combination of components for your needs.'
    },
    features: [
      {
        title: 'AI-Powered Recommendations',
        description: 'Smart analysis of our inventory to suggest the perfect build for your specific needs and use case.',
        icon: Server
      },
      {
        title: 'Global Parts Network',
        description: 'Access to parts worldwide at competitive prices through our international network.',
        icon: Database
      },
      {
        title: 'Expert Assembly',
        description: 'Professional assembly and testing by experienced technicians.',
        icon: CheckCircle2
      },
      {
        title: 'Quality Guarantee',
        description: 'All builds come with our quality assurance and warranty.',
        icon: Zap
      }
    ],
    pricing: {
      base: 'Starting from CHF 500',
      details: [
        'Free initial consultation',
        'AI-powered build recommendations',
        'Parts sourced from global network',
        'Professional assembly and testing',
        'Quality guarantee and warranty'
      ]
    },
    process: [
      {
        step: 1,
        title: 'Consultation',
        description: 'We\'ll discuss your needs and use case to understand your requirements.'
      },
      {
        step: 2,
        title: 'AI Analysis',
        description: 'Our AI system analyzes our inventory to suggest the optimal build for your needs.'
      },
      {
        step: 3,
        title: 'Parts Sourcing',
        description: 'We source all necessary parts from our inventory and global network.'
      },
      {
        step: 4,
        title: 'Assembly & Testing',
        description: 'Your computer is professionally assembled and thoroughly tested before delivery.'
      }
    ]
  }
}

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
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{service.hero.title}</h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-200">{service.hero.subtitle}</h2>
              <p className="text-xl text-green-100">{service.hero.description}</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {service.features.map((feature, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="flex items-start mb-6">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <feature.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-lg">
              <h2 className="text-3xl font-bold mb-8 text-center">Pricing</h2>
              <div className="text-center mb-8">
                <p className="text-2xl font-bold text-green-600">{service.pricing.base}</p>
              </div>
              <div className="space-y-4">
                {service.pricing.details.map((detail, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
              Contact us today to learn more about our {service.title.toLowerCase()} services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Contact Us
              </Link>
              <Link
                href="/services"
                className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
              >
                Back to Services
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
} 
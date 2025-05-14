import { Metadata } from 'next'
import { 
  Wrench, 
  HardDrive, 
  Server, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Clock,
  ShieldCheck,
  Code
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Computer Repair & Recycling Services | RevampIT',
  description: 'Professional computer repair, data recovery, Linux support, and hardware recycling services. Affordable and eco-friendly solutions for your tech needs.',
  openGraph: {
    title: 'Computer Repair & Recycling Services | RevampIT',
    description: 'Professional computer repair, data recovery, Linux support, and hardware recycling services. Affordable and eco-friendly solutions for your tech needs.',
    type: 'website',
    url: 'https://revampit.org/services',
  },
}

const services = {
  hero: {
    title: 'Expert IT Services',
    subtitle: 'Sustainable Solutions for Your Technology Needs',
    description: 'We combine technical expertise with environmental responsibility to provide comprehensive IT solutions that save you money and reduce electronic waste.'
  },
  coreServices: [
    {
      title: 'Build Your Computer',
      description: 'Get a custom-built computer tailored to your specific needs, powered by AI analysis of our extensive inventory. We source parts globally and provide professional assembly.',
      icon: Server,
      features: [
        'AI-powered build recommendations',
        'Global parts sourcing network',
        'Professional assembly and testing',
        'Quality guarantee and warranty'
      ],
      pricing: 'Starting from CHF 500',
      highlight: 'Free initial consultation'
    },
    {
      title: 'Computer Repair & Upgrades',
      description: 'Expert repairs for all types of computers and components. We specialize in fixing what others can\'t, including motherboard repairs and component-level fixes.',
      icon: Wrench,
      features: [
        'Component-level repairs',
        'Hardware upgrades',
        'Diagnostic services',
        'Professional assessment'
      ],
      pricing: 'CHF 70/hour + parts',
      highlight: 'Professional assessment required'
    },
    {
      title: 'Data Recovery & Transfer',
      description: 'Secure and reliable data transfer services for all types of storage media. We can recover data from damaged devices and transfer it to modern storage solutions.',
      icon: HardDrive,
      features: [
        'Secure data transfer',
        'Data recovery from damaged devices',
        'Legacy media support (Floppy disks, ZIP drives, MO drives, SCSI/IDE drives)',
        'Complete data security'
      ],
      pricing: 'CHF 70/hour',
      highlight: 'Evaluation required before recovery'
    },
    {
      title: 'Linux Support',
      description: 'Professional Linux installation, configuration, and support services. We help you get the most out of your Linux system with expert guidance and maintenance.',
      icon: Server,
      features: [
        'Linux installation & configuration',
        'System optimization & maintenance',
        'Security hardening',
        'Performance tuning'
      ],
      pricing: 'CHF 70/hour',
      highlight: 'Professional assessment required'
    },
    {
      title: 'Open Source Solutions',
      description: 'Expert implementation and support for open source software. We help you transition to and maintain open source solutions for your business needs.',
      icon: Code,
      features: [
        'Open source consulting',
        'Custom development',
        'Community integration',
        'Security & compliance'
      ],
      pricing: 'CHF 70/hour',
      highlight: 'Free initial consultation'
    },
    {
      title: 'Hardware Recycling',
      description: 'Responsible recycling and refurbishment of IT equipment. We give your old devices a new life while ensuring secure data deletion.',
      icon: Shield,
      features: [
        'Secure data deletion',
        'Equipment refurbishment',
        'Component recycling',
        'Free pickup service'
      ],
      pricing: 'Free for most items',
      highlight: 'Free pickup service available'
    }
  ],
  additionalServices: [
    {
      title: 'Web Hosting & Development',
      description: 'Reliable web hosting and development services using open-source solutions.',
      pricing: 'From CHF 10/month'
    },
    {
      title: 'VoIP Solutions',
      description: 'Modern VoIP phone systems for businesses and individuals.',
      pricing: 'Custom pricing'
    }
  ],
  cta: {
    title: 'Ready to Revamp Your Technology?',
    description: 'Contact us today for a free consultation and discover how we can help you get the most out of your devices.',
    button: 'Get Started'
  }
}

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Computer Repair & Recycling Services',
            'description': 'Professional computer repair, data recovery, Linux support, and hardware recycling services.',
            'provider': {
              '@type': 'Organization',
              'name': 'RevampIT',
              'url': 'https://revampit.org',
              'logo': 'https://revampit.org/logo.png'
            },
            'serviceType': [
              'Computer Repair',
              'Data Recovery',
              'Linux Support',
              'Hardware Recycling'
            ],
            'areaServed': {
              '@type': 'City',
              'name': 'Your City'
            }
          })
        }}
      />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{services.hero.title}</h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-200">{services.hero.subtitle}</h2>
              <p className="text-xl text-green-100">{services.hero.description}</p>
            </div>
          </div>
        </section>

        {/* Core Services */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center max-w-3xl mx-auto">
              <p className="text-gray-600">
                Repair time varies based on parts availability, typically taking a few weeks.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.coreServices.map((service, index) => (
                <div key={index} className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full">
                  <div className="p-8 flex flex-col h-full">
                    <div className="flex items-start mb-6">
                      <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                        <service.icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                        <div className="flex items-center text-green-600 font-semibold mb-4">
                          <Zap className="w-4 h-4 mr-2" />
                          <span>{service.highlight}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6 flex-grow">{service.description}</p>
                    <div className="space-y-3 mb-6">
                      {service.features.map((feature, i) => (
                        <div key={i} className="flex items-center text-gray-600">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto pt-6 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-lg font-semibold text-green-600">{service.pricing}</span>
                      <Link
                        href={`/services/${service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                        className="inline-block text-green-600 hover:text-green-700 font-medium transition-colors duration-300"
                      >
                        View details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Services */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Additional Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {services.additionalServices.map((service, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <p className="text-green-600 font-semibold">{service.pricing}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">{services.cta.title}</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">{services.cta.description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Contact Us
              </Link>
              <Link
                href="/shop"
                className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
              >
                Browse Inventory
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
} 
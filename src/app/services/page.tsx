'use client'

import { useState } from 'react'
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
  Code,
  Globe,
  Brain,
  Filter,
  Monitor,
  Cloud,
  Cpu,
  Settings
} from 'lucide-react'
import Link from 'next/link'

const services = [
  // Hardware Services
  {
    title: 'Computer Repair & Upgrades',
    description: 'Expert repairs for all types of computers and components. We specialize in fixing what others can\'t, including motherboard repairs and component-level fixes.',
    icon: Wrench,
    category: 'Hardware Services',
    features: [
      'Component-level repairs',
      'Hardware upgrades',
      'Diagnostic services',
      'Professional assessment'
    ],
    pricing: 'CHF 70/hour + parts',
    highlight: 'Professional assessment required',
    href: '/services/computer-repair-upgrades',
    available: true
  },
  {
    title: 'Data Recovery & Transfer',
    description: 'Secure and reliable data transfer services for all types of storage media. We can recover data from damaged devices and transfer it to modern storage solutions.',
    icon: HardDrive,
    category: 'Hardware Services',
    features: [
      'Secure data transfer',
      'Data recovery from damaged devices',
      'Legacy media support (Floppy disks, ZIP drives, MO drives, SCSI/IDE drives)',
      'Complete data security'
    ],
    pricing: 'CHF 70/hour',
    highlight: 'Evaluation required before recovery',
    href: '/services/data-recovery-transfer',
    available: true
  },
  {
    title: 'Hardware Recycling',
    description: 'Responsible recycling and refurbishment of IT equipment. We give your old devices a new life while ensuring secure data deletion.',
    icon: Shield,
    category: 'Hardware Services',
    features: [
      'Secure data deletion',
      'Equipment refurbishment',
      'Component recycling',
      'Free pickup service'
    ],
    pricing: 'Free for most items',
    highlight: 'Free pickup service available',
    href: '/services/hardware-recycling',
    available: true
  },

  // Software Solutions
  {
    title: 'Web Design & Development',
    description: 'Professional web design and development services using modern open source technologies. Fast, responsive websites built with Next.js, headless CMS, and sustainable practices.',
    icon: Globe,
    category: 'Software Solutions',
    features: [
      'Modern frameworks (Next.js, React)',
      'Headless CMS (Strapi, Payload, Tina)',
      'Responsive design & Tailwind CSS',
      'E-commerce solutions (Medusa.js, Shopware 6)',
      'SEO optimization & performance'
    ],
    pricing: 'CHF 70/hour',
    highlight: 'Free initial consultation',
    href: '/services/web-design-development',
    available: true
  },
  {
    title: 'Linux & Open Source',
    description: 'Professional Linux installation, configuration, and support services. We help you get the most out of your Linux system with expert guidance and maintenance.',
    icon: Server,
    category: 'Software Solutions',
    features: [
      'Linux installation & configuration',
      'System optimization & maintenance',
      'Security hardening',
      'Performance tuning'
    ],
    pricing: 'CHF 70/hour',
    highlight: 'Professional assessment required',
    href: '/services/linux-open-source',
    available: true
  },
  {
    title: 'Open Source Solutions',
    description: 'Expert implementation and support for open source software. We help you transition to and maintain open source solutions for your business needs.',
    icon: Code,
    category: 'Software Solutions',
    features: [
      'Open source consulting',
      'Custom development',
      'Community integration',
      'Security & compliance'
    ],
    pricing: 'CHF 70/hour',
    highlight: 'Free initial consultation',
    href: '/services/open-source-solutions',
    available: true
  },

  // Coming Soon
  {
    title: 'Build Your Computer',
    description: 'Get a custom-built computer tailored to your specific needs, powered by AI analysis of our extensive inventory. We source parts globally and provide professional assembly.',
    icon: Cpu,
    category: 'Coming Soon',
    features: [
      'AI-powered build recommendations',
      'Global parts sourcing network',
      'Professional assembly and testing',
      'Quality guarantee and warranty'
    ],
    pricing: '',
    highlight: 'Coming Soon',
    href: '/services/build-your-computer',
    available: false,
    badge: 'Soon'
  },
  {
    title: 'Enterprise AI Solutions',
    description: 'Private, on-premises AI systems for professional firms. GPT-4 level performance with complete data privacy and GDPR compliance.',
    icon: Brain,
    category: 'Coming Soon',
    features: [
      'Self-hosted Llama 3 70B deployment',
      'RAG-powered document search',
      'Complete data privacy & GDPR compliance',
      'Custom training on your documents'
    ],
    pricing: '',
    highlight: 'Coming Soon',
    href: '/services/enterprise-ai-solutions',
    available: false,
    badge: 'Soon'
  },
  {
    title: 'Cloud Infrastructure',
    description: 'Sustainable cloud hosting and infrastructure solutions. We provide scalable, eco-friendly hosting with renewable energy and open source technologies.',
    icon: Cloud,
    category: 'Coming Soon',
    features: [
      'Renewable energy hosting',
      'Open source infrastructure',
      'Scalable solutions',
      'Professional monitoring'
    ],
    pricing: '',
    highlight: 'Coming Soon',
    href: '/services/cloud-infrastructure',
    available: false,
    badge: 'Soon'
  },
  {
    title: 'Server Management',
    description: 'Professional server setup and maintenance services. We manage your servers so you can focus on your business.',
    icon: Monitor,
    category: 'Coming Soon',
    features: [
      'Server setup & configuration',
      '24/7 monitoring',
      'Security management',
      'Performance optimization'
    ],
    pricing: '',
    highlight: 'Coming Soon',
    href: '/services/server-management',
    available: false,
    badge: 'Soon'
  },
  {
    title: 'IoT Solutions',
    description: 'Internet of Things solutions with open source hardware. Create connected devices that respect your privacy and data ownership.',
    icon: Settings,
    category: 'Coming Soon',
    features: [
      'Open source hardware',
      'Privacy-focused design',
      'Custom IoT development',
      'Data ownership guaranteed'
    ],
    pricing: '',
    highlight: 'Coming Soon',
    href: '/services/iot-solutions',
    available: false,
    badge: 'Soon'
  }
]

// Get unique categories for filtering
const getUniqueCategories = () => {
  // Define the order we want: All, Hardware Services, Software Solutions, Coming Soon
  const categoryOrder = ['All', 'Hardware Services', 'Software Solutions', 'Coming Soon']
  const categories = services.map(service => service.category)
  const uniqueCategories = Array.from(new Set(categories))
  
  // Return categories in the specified order
  return categoryOrder.filter(cat => cat === 'All' || uniqueCategories.includes(cat))
}

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const categories = getUniqueCategories()
  
  const filteredServices = selectedCategory === 'All' 
    ? services 
    : services.filter(service => service.category === selectedCategory)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Computer Repair & IT Services',
            'description': 'Professional computer repair, web development, data recovery, Linux support, and hardware recycling services.',
            'provider': {
              '@type': 'Organization',
              'name': 'RevampIT',
              'url': 'https://revampit.org',
              'logo': 'https://revampit.org/logo.png'
            },
            'serviceType': [
              'Computer Repair',
              'Web Design & Development',
              'Data Recovery',
              'Linux Support',
              'Hardware Recycling',
              'Open Source Solutions',
              'Enterprise AI Solutions'
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
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Expert IT Services</h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-200">Sustainable Solutions for Your Technology Needs</h2>
              <p className="text-xl text-green-100">We combine technical expertise with environmental responsibility to provide comprehensive IT solutions that save you money and reduce electronic waste.</p>
            </div>
          </div>
        </section>

        {/* Services Section with Filtering */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-6">Our Services</h2>
              <p className="text-lg text-gray-600 mb-8">
                Repair time varies based on parts availability, typically taking a few weeks.
              </p>
              
              {/* Service Filter */}
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                <div className="flex items-center text-gray-500 mr-4 mb-2">
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Filter by category:</span>
                </div>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedCategory === category
                        ? 'bg-green-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Services Grid with Animation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredServices.map((service, index) => (
                <div 
                  key={`${service.title}-${selectedCategory}`}
                  className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-8 flex flex-col h-full">
                    <div className="flex items-start mb-6">
                      <div className={`p-3 rounded-lg mr-4 transition-colors duration-300 ${
                        service.available 
                          ? 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <service.icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-bold">{service.title}</h3>
                          {service.badge && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              {service.badge}
                            </span>
                          )}
                        </div>
                        <div className={`flex items-center font-semibold mb-4 ${
                          service.available ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <Zap className="w-4 h-4 mr-2" />
                          <span>{service.highlight}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6 flex-grow">{service.description}</p>
                    <div className="space-y-3 mb-6">
                      {service.features.map((feature, i) => (
                        <div key={i} className="flex items-center text-gray-600">
                          <CheckCircle2 className={`w-5 h-5 mr-3 flex-shrink-0 ${
                            service.available ? 'text-green-500' : 'text-gray-400'
                          }`} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto pt-6 border-t border-gray-200 flex items-center justify-between">
                      {service.pricing ? (
                        <span className={`text-lg font-semibold ${
                          service.available ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {service.pricing}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Pricing TBD</span>
                      )}
                      <Link
                        href={service.href}
                        className={`inline-flex items-center font-medium transition-colors duration-300 group ${
                          service.available 
                            ? 'text-green-600 hover:text-green-700' 
                            : 'text-gray-400 hover:text-gray-500'
                        }`}
                      >
                        <span>{service.available ? 'View details' : 'Learn more'}</span>
                        <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Results count */}
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">
                Showing {filteredServices.length} of {services.length} services
                {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Revamp Your Technology?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">Contact us today for a free consultation and discover how we can help you get the most out of your devices.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Contact Us
              </Link>
              <Link
                href="https://www.revamp-it.ch/index.php/de/shop-de"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
              >
                Browse Inventory
              </Link>
            </div>
          </div>
        </section>

        {/* Add custom CSS for animations */}
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out forwards;
          }
        `}</style>
      </main>
    </>
  )
} 
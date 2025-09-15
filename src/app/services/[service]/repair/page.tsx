import { Metadata } from 'next'
import { Wrench, CheckCircle2, Clock, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Computer Repair & Upgrades | RevampIT',
  description: 'Expert computer repairs and upgrades. We specialize in fixing what others can\'t, including motherboard repairs and component-level fixes.',
}

const repairDetails = {
  hero: {
    title: 'Computer Repair & Upgrades',
    subtitle: 'Expert Repairs You Can Trust',
    description: 'We combine technical expertise with sustainable practices to extend the life of your devices. Our repair services focus on fixing what others can\'t, saving you money and reducing electronic waste.'
  },
  features: [
    {
      title: 'Component-Level Repairs',
      description: 'We don\'t just replace parts - we fix them. Our technicians can repair motherboards, power supplies, and other components at the circuit level.',
      icon: Wrench
    },
    {
      title: 'Hardware Upgrades',
      description: 'Extend the life of your computer with strategic upgrades. We can help you choose and install the right components to meet your needs.',
      icon: Zap
    },
    {
      title: 'Diagnostic Services',
      description: 'Comprehensive diagnostics to identify and fix issues quickly. We use professional tools and years of experience to pinpoint problems accurately.',
      icon: Shield
    },
    {
      title: 'Same-Day Service',
      description: 'Need your device back quickly? We offer same-day repairs for many common issues. Just bring it in during our opening hours.',
      icon: Clock
    }
  ],
  pricing: {
    base: 'Starting from CHF 70/hour',
    details: [
      'Free initial diagnosis',
      'No fix, no fee policy',
      'Transparent pricing',
      'Warranty on repairs'
    ]
  },
  process: [
    {
      step: 1,
      title: 'Diagnosis',
      description: 'We\'ll examine your device and provide a detailed assessment of the issue.'
    },
    {
      step: 2,
      title: 'Quote',
      description: 'You\'ll receive a transparent quote for the repair, with no hidden fees.'
    },
    {
      step: 3,
      title: 'Repair',
      description: 'Our technicians will fix your device using high-quality parts and proven techniques.'
    },
    {
      step: 4,
      title: 'Testing',
      description: 'We thoroughly test all repairs to ensure your device is working perfectly.'
    }
  ]
}

export default function RepairPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{repairDetails.hero.title}</h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-200">{repairDetails.hero.subtitle}</h2>
            <p className="text-xl text-green-100">{repairDetails.hero.description}</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {repairDetails.features.map((feature, index) => (
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

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Repair Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {repairDetails.process.map((step) => (
              <div key={step.step} className="bg-gray-50 rounded-xl p-8">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
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
              <p className="text-2xl font-bold text-green-600">{repairDetails.pricing.base}</p>
            </div>
            <div className="space-y-4">
              {repairDetails.pricing.details.map((detail, index) => (
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
          <h2 className="text-4xl font-bold mb-6">Ready to Repair Your Device?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Contact us today for a free diagnosis and quote. We'll help you get your device back in working order quickly and affordably.
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
  )
} 
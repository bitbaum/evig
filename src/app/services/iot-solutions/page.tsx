import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, Cpu, Wifi, Zap, Layers, Smartphone, Clock, AlertTriangle, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'IoT Solutions - Future Vision | RevampIT',
  description: 'Our vision for ethical IoT development with open source hardware. Part of our long-term mission as a non-profit. Not currently offered - targeted for 2026-2028.',
  openGraph: {
    title: 'IoT Solutions - Future Vision | RevampIT',
    description: 'Our vision for ethical IoT development with open source hardware. Part of our long-term mission as a non-profit. Not currently offered - targeted for 2026-2028.',
    type: 'website',
  },
}

export default function IoTSolutionsPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'IoT Solutions - Future Vision',
            'description': 'Ethical IoT development vision for 2026-2028',
            'provider': {
              '@type': 'Organization',
              'name': 'RevampIT',
              'url': 'https://revampit.org'
            },
            'serviceType': 'IoT Solutions',
            'areaServed': {
              '@type': 'Country',
              'name': 'Switzerland'
            },
            'availability': 'FutureVision'
          })
        }}
      />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Not Currently Offered
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">IoT Solutions</h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-200">Future Vision: Ethical IoT for Community Good</h2>
              <p className="text-xl text-green-100 mb-8">
                <strong>This service is not currently available.</strong> As a mission-driven, self-sustaining non-profit, 
                we envision creating IoT solutions that empower communities while protecting privacy and the environment.
              </p>
              
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-300 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-100 mb-2">Service Not Available</h3>
                    <p className="text-red-200">
                      We do not currently offer IoT development services. This represents our long-term vision 
                      for creating technology that serves people and planet over profit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-800/50 border border-green-600 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-green-300 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-100 mb-2">Vision Timeline: 2026-2028</h3>
                    <p className="text-green-200">
                      Through community collaboration and sustainable development practices, we aim to create 
                      IoT solutions that are transparent, privacy-respecting, and environmentally responsible.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Alignment Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Heart className="w-8 h-8 text-green-600" />
                <h2 className="text-4xl font-bold text-gray-900">IoT for Social Good</h2>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our future IoT solutions will prioritize community empowerment, environmental monitoring, 
                and digital sovereignty over surveillance and data extraction.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart,
                  title: 'Community-Controlled Data',
                  description: 'Local data ownership and processing to protect community privacy'
                },
                {
                  icon: Cpu,
                  title: 'Open Source Hardware',
                  description: 'Transparent, modifiable designs that communities can understand and repair'
                },
                {
                  icon: Zap,
                  title: 'Environmental Monitoring',
                  description: 'Helping communities track and respond to environmental changes'
                },
                {
                  icon: Wifi,
                  title: 'Cooperative Networks',
                  description: 'Community-owned mesh networks for digital independence'
                },
                {
                  icon: Layers,
                  title: 'Right to Repair',
                  description: 'Designs that prioritize repairability and long-term sustainability'
                },
                {
                  icon: Smartphone,
                  title: 'Digital Literacy',
                  description: 'Educational components to build technical capacity in communities'
                }
              ].map((feature, index) => (
                <div key={index} className="bg-green-50 rounded-xl p-6 shadow-lg border-l-4 border-green-600">
                  <div className="flex items-start mb-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Not Now Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Ethical Development Takes Time</h2>
              <div className="bg-gray-50 rounded-xl p-8 border">
                <p className="text-lg text-gray-700 mb-6">
                  Unlike profit-driven IoT companies that prioritize fast deployment and data collection, 
                  we're committed to responsible development that considers long-term community impact:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Community Consultation</h4>
                        <p className="text-gray-600">Extensive engagement to understand real community needs and concerns</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Privacy-First Design</h4>
                        <p className="text-gray-600">Developing systems that protect rather than exploit user data</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Sustainable Supply Chains</h4>
                        <p className="text-gray-600">Researching ethical sourcing and circular economy approaches</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Open Source Development</h4>
                        <p className="text-gray-600">Building collaborative development processes with transparency</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Applications */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Community-Centered Applications</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                When we're ready, our IoT solutions will address real community challenges, 
                not create new forms of surveillance or dependency.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Community Environmental Monitoring',
                  description: 'Citizen science networks for tracking air quality, water health, and climate impacts',
                  applications: ['Community-owned sensors', 'Open data platforms', 'Early warning systems', 'Environmental justice documentation']
                },
                {
                  title: 'Cooperative Infrastructure',
                  description: 'Shared technology infrastructure that reduces costs and increases community control',
                  applications: ['Community mesh networks', 'Shared monitoring systems', 'Collective resource management', 'Democratic governance tools']
                },
                {
                  title: 'Elder and Disability Support',
                  description: 'Privacy-respecting assistance technology that empowers rather than surveils',
                  applications: ['Personal safety alerts', 'Health monitoring', 'Community connection tools', 'Accessibility enhancements']
                },
                {
                  title: 'Urban Gardening & Food Security',
                  description: 'Supporting community food systems with appropriate technology',
                  applications: ['Community garden monitoring', 'Resource sharing platforms', 'Harvest coordination', 'Soil health tracking']
                }
              ].map((useCase, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                  <p className="text-gray-600 mb-6">{useCase.description}</p>
                  <div className="space-y-2">
                    {useCase.applications.map((app, appIndex) => (
                      <div key={appIndex} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                        {app}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Community Involvement */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Shape Our Research</h2>
              <p className="text-xl text-gray-600 mb-8">
                Help us research and develop IoT solutions that truly serve community needs. 
                Your input is essential for ethical technology development.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-green-800 mb-4">Community Research Partnership</h3>
                <p className="text-green-700 mb-6">
                  Join our research process to explore how IoT technology can support your community 
                  without compromising privacy or autonomy. We need diverse voices to build better solutions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">Community</div>
                    <div className="text-green-700">Led design process</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">Open</div>
                    <div className="text-green-700">Source everything</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">Privacy</div>
                    <div className="text-green-700">First architecture</div>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 text-lg"
                >
                  Join Research Community
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Current Services CTA */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Need Tech Support Today?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
              While we develop our IoT vision, we're actively supporting communities with 
              open source solutions and hardware refurbishment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/open-source-solutions"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Open Source Solutions
              </Link>
              <Link
                href="/get-involved"
                className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
              >
                Get Involved
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
} 
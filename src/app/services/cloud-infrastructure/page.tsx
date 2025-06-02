import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, Cloud, Server, Zap, Shield, Globe, Clock, AlertTriangle, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cloud Infrastructure - Future Vision | RevampIT',
  description: 'Our vision for sustainable cloud hosting. Part of our long-term mission as a non-profit. Not currently offered - targeted for 2026-2028.',
  openGraph: {
    title: 'Cloud Infrastructure - Future Vision | RevampIT',
    description: 'Our vision for sustainable cloud hosting. Part of our long-term mission as a non-profit. Not currently offered - targeted for 2026-2028.',
    type: 'website',
  },
}

export default function CloudInfrastructurePage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Cloud Infrastructure - Future Vision',
            'description': 'Sustainable cloud hosting vision for 2026-2028',
            'provider': {
              '@type': 'Organization',
              'name': 'RevampIT',
              'url': 'https://revampit.org'
            },
            'serviceType': 'Cloud Infrastructure',
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
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Cloud Infrastructure</h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-200">Future Vision: Sustainable Cloud for Good</h2>
              <p className="text-xl text-green-100 mb-8">
                <strong>This service is not currently available.</strong> As a mission-driven, self-sustaining non-profit, 
                we envision building ethical cloud infrastructure that serves communities while protecting our planet.
              </p>
              
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-300 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-100 mb-2">Service Not Available</h3>
                    <p className="text-red-200">
                      We do not currently offer cloud infrastructure services. This page represents our long-term vision 
                      as we build sustainable capacity to serve our community's digital needs.
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
                      Through community partnerships and sustainable growth, we aim to develop truly ethical cloud 
                      infrastructure that prioritizes environmental responsibility and digital equity.
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
                <h2 className="text-4xl font-bold text-gray-900">Mission-Driven Technology</h2>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                As a non-profit organization, our future cloud infrastructure will be built on principles of 
                sustainability, community empowerment, and digital justice.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart,
                  title: 'Community First',
                  description: 'Designed to serve underserved communities and promote digital inclusion'
                },
                {
                  icon: Zap,
                  title: '100% Renewable Energy',
                  description: 'Powered entirely by clean, renewable energy sources with carbon-negative goals'
                },
                {
                  icon: Globe,
                  title: 'Open Source Foundation',
                  description: 'Built on open source technologies to ensure transparency and community ownership'
                },
                {
                  icon: Shield,
                  title: 'Privacy by Design',
                  description: 'Privacy-first architecture protecting user data and digital rights'
                },
                {
                  icon: Server,
                  title: 'Cooperative Model',
                  description: 'Community-owned infrastructure supporting local digital sovereignty'
                },
                {
                  icon: Cloud,
                  title: 'Circular Economy',
                  description: 'Using refurbished hardware and promoting sustainable technology lifecycles'
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
              <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Why We're Not Ready Yet</h2>
              <div className="bg-gray-50 rounded-xl p-8 border">
                <p className="text-lg text-gray-700 mb-6">
                  As a mission-driven non-profit, we believe in building technology infrastructure responsibly and sustainably. 
                  Rather than rushing to market, we're taking the time to:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Build Community Partnerships</h4>
                        <p className="text-gray-600">Collaborate with local organizations and communities to understand real needs</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Ensure Financial Sustainability</h4>
                        <p className="text-gray-600">Develop a self-sustaining model that doesn't compromise our mission</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Research Sustainable Technologies</h4>
                        <p className="text-gray-600">Identify and test the most environmentally responsible solutions</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Train Our Team</h4>
                        <p className="text-gray-600">Build internal expertise while creating meaningful employment opportunities</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Get Involved Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Help Shape Our Vision</h2>
              <p className="text-xl text-gray-600 mb-8">
                Want to be part of building ethical, sustainable cloud infrastructure? 
                Join our community and help us plan for the future.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-green-800 mb-4">Community Input Needed</h3>
                <p className="text-green-700 mb-6">
                  Share your thoughts on sustainable cloud infrastructure and help us understand community needs. 
                  Your input will directly influence our development roadmap.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 text-lg"
                >
                  Share Your Vision
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Current Services CTA */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Need Technology Help Today?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
              While we develop our long-term vision, we're actively providing these services to our community right now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                View Current Services
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
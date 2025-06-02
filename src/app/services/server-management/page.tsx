import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, Server, Database, Monitor, Shield, Settings, Clock, AlertTriangle, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Server Management - Future Vision | RevampIT',
  description: 'Our vision for ethical server management services. Part of our long-term mission as a non-profit. Not currently offered - targeted for 2026-2028.',
  openGraph: {
    title: 'Server Management - Future Vision | RevampIT',
    description: 'Our vision for ethical server management services. Part of our long-term mission as a non-profit. Not currently offered - targeted for 2026-2028.',
    type: 'website',
  },
}

export default function ServerManagementPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Server Management - Future Vision',
            'description': 'Ethical server management vision for 2026-2028',
            'provider': {
              '@type': 'Organization',
              'name': 'RevampIT',
              'url': 'https://revampit.org'
            },
            'serviceType': 'Server Management',
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
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Server Management</h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-200">Future Vision: Ethical Infrastructure Management</h2>
              <p className="text-xl text-green-100 mb-8">
                <strong>This service is not currently available.</strong> As a mission-driven, self-sustaining non-profit, 
                we envision providing server management services that prioritize community needs and environmental responsibility.
              </p>
              
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-300 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-100 mb-2">Service Not Available</h3>
                    <p className="text-red-200">
                      We do not currently offer server management services. This represents our long-term vision 
                      for supporting community technology infrastructure sustainably.
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
                      Through careful capacity building and community partnerships, we aim to provide ethical 
                      server management that serves social good rather than pure profit.
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
                <h2 className="text-4xl font-bold text-gray-900">Community-Centered Infrastructure</h2>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our future server management will prioritize community organizations, non-profits, 
                and mission-driven businesses that can't afford traditional enterprise solutions.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart,
                  title: 'Mission-Driven Clients First',
                  description: 'Priority support for non-profits, cooperatives, and community organizations'
                },
                {
                  icon: Server,
                  title: 'Refurbished Hardware Focus',
                  description: 'Extending server lifespans through expert refurbishment and optimization'
                },
                {
                  icon: Shield,
                  title: 'Privacy & Security by Default',
                  description: 'Protecting community data with privacy-first security practices'
                },
                {
                  icon: Settings,
                  title: 'Open Source Solutions',
                  description: 'Using and contributing to open source server management tools'
                },
                {
                  icon: Monitor,
                  title: 'Transparent Operations',
                  description: 'Clear documentation and knowledge sharing with our community'
                },
                {
                  icon: Database,
                  title: 'Sliding Scale Pricing',
                  description: 'Affordable rates based on organization size and social impact'
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
              <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Building Capacity Responsibly</h2>
              <div className="bg-gray-50 rounded-xl p-8 border">
                <p className="text-lg text-gray-700 mb-6">
                  As a non-profit organization, we're committed to sustainable growth that doesn't compromise our values. 
                  We're currently focusing on:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Developing Internal Expertise</h4>
                        <p className="text-gray-600">Training our team in sustainable server management practices</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Community Needs Assessment</h4>
                        <p className="text-gray-600">Understanding what server management services our community actually needs</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Sustainable Business Model</h4>
                        <p className="text-gray-600">Creating a pricing model that supports our mission while remaining accessible</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-3"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Partnership Development</h4>
                        <p className="text-gray-600">Building relationships with other mission-driven organizations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Planned Service Model */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Future Service Model</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                When we're ready, our server management will be structured to serve community needs, 
                not maximize profit.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Community Organizations',
                  description: 'Special rates for non-profits and community groups',
                  features: ['Sliding scale pricing', 'Basic monitoring', 'Community support forum', 'Educational resources']
                },
                {
                  name: 'Mission-Driven Businesses',
                  description: 'Support for social enterprises and B-Corps',
                  features: ['Affordable professional rates', 'Priority support', 'Sustainability reporting', 'Green hosting options']
                },
                {
                  name: 'Cooperative Model',
                  description: 'Shared infrastructure for multiple organizations',
                  features: ['Shared costs and resources', 'Community governance', 'Mutual support network', 'Knowledge sharing']
                }
              ].map((plan, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Get Involved Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Help Us Plan</h2>
              <p className="text-xl text-gray-600 mb-8">
                Are you part of a community organization that could benefit from ethical server management? 
                Help us understand what you need.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-green-800 mb-4">Community Planning Session</h3>
                <p className="text-green-700 mb-6">
                  Share your server management challenges and help us design services that truly serve 
                  community needs. Your input is invaluable for our planning process.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 text-lg"
                >
                  Share Your Needs
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Current Services CTA */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Need Server Help Today?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
              While we develop our server management vision, we can help with Linux installation and open source solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/linux-open-source"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Linux Services
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
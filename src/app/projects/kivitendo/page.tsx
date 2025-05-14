'use client'

import { HeroBanner } from '@/components/ui/hero-banner'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Code, Users, Globe, Shield, Zap, Package, FileText, Settings, ShoppingCart } from 'lucide-react'
import React from 'react'

export default function KivitendoPage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="Kivitendo"
        description="The unique Open Source CRM & ERP that meets the highest quality standards through constant personalized development"
        className="bg-gradient-to-r from-blue-600 to-blue-800"
      />

      {/* Key Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Kivitendo?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                A comprehensive solution for order processing, inventory management, and financial accounting
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <Code className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">Open Source Benefits</h3>
                </div>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Highly adaptable to your needs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Full access to code and developments</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>No fixed license costs</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <Package className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">Order Processing</h3>
                </div>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Complete quote to invoice workflow</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Customizable document templates</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Direct email integration</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <FileText className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">Financial Accounting</h3>
                </div>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Complete or modular accounting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Customizable chart of accounts</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Bank statement import</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive features for your business needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <h3 className="text-2xl font-semibold mb-6">Business Configuration</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">Multiple Currencies & Languages</span>
                      <p className="text-gray-600 mt-1">Support for various currencies and customer languages</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">Multi-tenant Capability</span>
                      <p className="text-gray-600 mt-1">Manage multiple companies in one system</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">Custom User Groups</span>
                      <p className="text-gray-600 mt-1">Define specific permissions for different roles</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <h3 className="text-2xl font-semibold mb-6">Integration & Customization</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">Webshop Integration</span>
                      <p className="text-gray-600 mt-1">Seamless connection with your online store</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">Custom Variables</span>
                      <p className="text-gray-600 mt-1">Define custom fields for customers, articles, and projects</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">Process Automation</span>
                      <p className="text-gray-600 mt-1">Automate background processes and periodic tasks</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Pricing Structure</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Flexible options to suit your business needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-semibold mb-4">Hosting Package</h3>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-300 mr-3" />
                    <span>Internet access from anywhere</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-300 mr-3" />
                    <span>Unlimited users</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-300 mr-3" />
                    <span>Daily data backup</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-300 mr-3" />
                    <span>Standard version upgrades</span>
                  </li>
                </ul>
                <div className="text-3xl font-bold mb-2">CHF 100.- / month</div>
                <p className="text-blue-100">CHF 50.- for non-profit organizations</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-2xl font-semibold mb-4">Custom Development</h3>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Configuration & Support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Individual Adaptations</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Personal Consultation</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Detailed Quotation</span>
                  </li>
                </ul>
                <div className="text-3xl font-bold mb-2">CHF 100.- / hour</div>
                <p className="text-gray-600">Custom solutions for your specific needs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Resources & Community</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Join our active community and access comprehensive resources
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  title: 'Kivitendo Switzerland',
                  description: 'Official Swiss Kivitendo website',
                  href: 'https://www.kivitendo.ch',
                  icon: 'swiss'
                },
                { 
                  title: 'Kivitendo Germany',
                  description: 'Official German Kivitendo website',
                  href: 'https://www.kivitendo.de',
                  icon: 'german'
                },
                { 
                  title: 'Community Forum',
                  description: 'Get help and share knowledge with other users',
                  href: 'https://forum.kivitendo.de/',
                  icon: 'forum'
                },
                { 
                  title: 'Feature Requests',
                  description: 'View and contribute to upcoming features',
                  href: 'https://wiki.revamp-it.ch/index.php?title=Wunschliste_Kivitendo',
                  icon: 'features'
                }
              ].map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{link.title}</h3>
                      <p className="text-gray-600 text-sm">{link.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 
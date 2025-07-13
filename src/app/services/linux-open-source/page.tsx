import { Metadata } from 'next'
import { 
  Terminal, 
  Shield, 
  Users, 
  Zap, 
  Code, 
  Server, 
  Laptop, 
  Download,
  Cpu,
  HardDrive,
  Globe,
  FileCode,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Linux | RevampIT',
  description: 'Experten-Linux-Installation, Support und Schulungsdienstleistungen. Entdecken Sie die perfekte Linux-Distribution für Ihre Bedürfnisse.'
}

const benefits = [
  {
    title: 'Sicherheit & Stabilität',
    description: 'Linux ist bekannt für seine robusten Sicherheitsfunktionen und Systemstabilität, was es ideal für den privaten und gewerblichen Einsatz macht.'
    icon: Shield
  },
  {
    title: 'Leistung',
    description: 'Effiziente Ressourcennutzung und optimierte Leistung, auch auf älterer Hardware, mit minimalen Systemanforderungen.'
    icon: Zap
  },
  {
    title: 'Anpassung',
    description: 'Vollständige Kontrolle über Ihr System mit unendlichen Anpassungsmöglichkeiten, um Ihren Workflow und Ihre Präferenzen zu entsprechen.'
    icon: Code
  },
  {
    title: 'Community-Support',
    description: 'Zugang zu einer grossen globalen Gemeinschaft von Benutzern und Entwicklern für Unterstützung, Dokumentation und kontinuierliche Verbesserung.'
    icon: Users
  }
]

const distributions = [
  {
    name: 'Ubuntu',
    description: 'User-friendly distribution perfect for beginners and professionals alike. Features a polished desktop environment and extensive software repository.',
    icon: Laptop,
    useCases: ['Desktop computing', 'Development', 'Server deployment'],
    pros: ['Easy to use', 'Large community', 'Regular updates', 'Extensive documentation'],
    cons: ['Some proprietary software', 'Heavier than some alternatives'],
    website: 'https://ubuntu.com'
  },
  {
    name: 'Linux Mint',
    description: 'Based on Ubuntu but with a more traditional desktop experience. Known for its stability and ease of use.',
    icon: Laptop,
    useCases: ['Desktop computing', 'Office work', 'Multimedia'],
    pros: ['Windows-like interface', 'Excellent hardware support', 'Stable and reliable', 'Great for beginners'],
    cons: ['Less frequent updates', 'Limited enterprise features'],
    website: 'https://linuxmint.com'
  },
  {
    name: 'Fedora',
    description: 'Cutting-edge distribution that showcases the latest open source technologies. Backed by Red Hat.',
    icon: Cpu,
    useCases: ['Development', 'Enterprise', 'Innovation'],
    pros: ['Latest software', 'Strong security', 'Enterprise-ready', 'Excellent development tools'],
    cons: ['Frequent updates', 'Shorter support cycles'],
    website: 'https://fedoraproject.org'
  },
  {
    name: 'Debian',
    description: 'One of the most stable and reliable distributions, serving as the foundation for many other Linux systems.',
    icon: Server,
    useCases: ['Servers', 'Enterprise', 'Stable systems'],
    pros: ['Extremely stable', 'Large package repository', 'Long support cycles', 'Strong security'],
    cons: ['Older software versions', 'Less user-friendly'],
    website: 'https://www.debian.org'
  },
  {
    name: 'MX Linux',
    description: 'Lightweight distribution based on Debian, known for its excellent performance and user-friendly interface.',
    icon: HardDrive,
    useCases: ['Older hardware', 'Desktop computing', 'Resource efficiency'],
    pros: ['Lightweight', 'Fast performance', 'User-friendly', 'Stable base'],
    cons: ['Smaller community', 'Limited enterprise features'],
    website: 'https://mxlinux.org'
  }
]

const services = [
  {
    title: 'Linux Installation',
    description: 'Professional installation of your chosen Linux distribution, with full hardware compatibility testing and optimization.',
    icon: Download
  },
  {
    title: 'System Configuration',
    description: 'Custom configuration of your Linux system to match your specific needs and workflow requirements.',
    icon: Terminal
  },
  {
    title: 'Training & Support',
    description: 'Comprehensive training programs and ongoing support to help you get the most out of your Linux system.',
    icon: Users
  },
  {
    title: 'Server Setup',
    description: 'Enterprise-grade Linux server configuration and optimization for businesses and organizations.',
    icon: Server
  }
]

export default function LinuxPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Linux</h1>
            <p className="text-xl text-green-100">
              Professional Linux installation, support, and training services. Find the perfect distribution for your needs.
            </p>
            <div className="mt-8">
              <p className="text-green-200">
                Linux is a powerful, secure, and flexible operating system that powers everything from personal computers to enterprise servers.
                <Link href="/services/open-source-solutions" className="inline-flex items-center text-white hover:text-green-200 ml-2">
                  Learn more about open source <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services & Pricing Section - Immediately after hero */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Our Linux Services</h2>
            <p className="text-lg text-gray-600 mb-4">
              Comprehensive support for all your Linux needs, from installation to ongoing maintenance.
            </p>
            <div className="text-green-600 font-semibold text-xl mb-8">
              Professional Linux Support from CHF 70/hour
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                    <service.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                    <p className="text-gray-600">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Value Proposition Section */}
          <div className="mt-20">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold mb-6">Your Linux Advantage</h2>
              <p className="text-lg text-gray-600">
                Get expert support and maximize the benefits of Linux for your needs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-lg border-l-4 border-green-600">
                <h3 className="text-xl font-bold mb-4">Save Money</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>No expensive licenses or subscriptions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Extend the life of your existing hardware</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Reduce maintenance and upgrade costs</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-lg border-l-4 border-green-600">
                <h3 className="text-xl font-bold mb-4">Boost Performance</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Faster system performance on any hardware</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Optimized for your specific needs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Reliable and stable operation</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-lg border-l-4 border-green-600">
                <h3 className="text-xl font-bold mb-4">Expert Support</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Professional installation and setup</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Ongoing technical support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Training and documentation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Contact CTA */}
          <div className="mt-12 bg-green-50 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              We offer professional Linux support and solutions for both businesses and individuals. Contact us for a free consultation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Schedule Consultation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="tel:+41223334455"
                className="inline-flex items-center border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                Call Us Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Why Choose Linux?</h2>
            <p className="text-lg text-gray-600">
              Linux offers superior performance, security, and flexibility compared to other operating systems.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <benefit.icon className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold">{benefit.title}</h3>
                </div>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Distributions Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Popular Linux Distributions</h2>
            <p className="text-lg text-gray-600">
              Each distribution has its own strengths and is suited for different use cases.
            </p>
          </div>
          <div className="space-y-8">
            {distributions.map((distro, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start mb-6">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                    <distro.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{distro.name}</h3>
                    <a 
                      href={distro.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 text-sm mb-4 inline-flex items-center"
                    >
                      Visit Website <ArrowRight className="w-4 h-4 ml-1" />
                    </a>
                    <p className="text-gray-600 mb-4">{distro.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Best For:</h4>
                        <ul className="space-y-2">
                          {distro.useCases.map((useCase, i) => (
                            <li key={i} className="flex items-start">
                              <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-gray-600">{useCase}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Advantages:</h4>
                        <ul className="space-y-2">
                          {distro.pros.map((pro, i) => (
                            <li key={i} className="flex items-start">
                              <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-gray-600">{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {distro.cons && distro.cons.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-2">Considerations:</h4>
                        <ul className="space-y-2">
                          {distro.cons.map((con, i) => (
                            <li key={i} className="flex items-start">
                              <div className="p-1 bg-red-100 rounded-full mr-3 mt-0.5">
                                <XCircle className="w-4 h-4 text-red-600" />
                              </div>
                              <span className="text-gray-600">{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Switch to Linux?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Let our experts help you find and set up the perfect Linux distribution for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
            >
              Get Started
            </Link>
            <Link
              href="/services"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
} 
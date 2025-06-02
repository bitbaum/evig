'use client'

import { Metadata } from 'next'
import { useState } from 'react'
import { 
  Globe, 
  Code, 
  Palette, 
  Smartphone, 
  Search, 
  Shield, 
  Zap, 
  Users, 
  CheckCircle2,
  ArrowRight,
  Monitor,
  Layers,
  Rocket,
  Heart,
  Database,
  Cloud,
  Filter
} from 'lucide-react'
import Link from 'next/link'

// Remove metadata export since this is now a client component
// export const metadata: Metadata = {
//   title: 'Web Design & Development | RevampIT',
//   description: 'Professional web design and development services using open source technologies. Modern, responsive websites built with sustainability and performance in mind.',
//   openGraph: {
//     title: 'Web Design & Development | RevampIT',
//     description: 'Professional web design and development services using open source technologies. Modern, responsive websites built with sustainability and performance in mind.',
//     type: 'website',
//     url: 'https://revampit.org/services/web-design-development',
//   },
// }

const benefits = [
  {
    title: 'Open Source First',
    description: 'We prioritize open source technologies that give you freedom, flexibility, and long-term sustainability without vendor lock-in.',
    icon: Code
  },
  {
    title: 'Performance Optimized',
    description: 'Fast-loading, efficient websites that provide excellent user experience while minimizing environmental impact.',
    icon: Zap
  },
  {
    title: 'Mobile-First Design',
    description: 'Responsive designs that work perfectly on all devices, ensuring your audience can reach you anywhere.',
    icon: Smartphone
  },
  {
    title: 'SEO & Accessibility',
    description: 'Built-in search engine optimization and accessibility features to reach the widest possible audience.',
    icon: Search
  }
]

const technologies = [
  {
    name: 'Next.js & React',
    description: 'Modern React framework for building fast, scalable web applications with excellent developer experience and built-in optimization.',
    icon: Code,
    category: 'Frontend',
    benefits: ['Server-side rendering', 'Excellent performance', 'Great SEO', 'Active community'],
    url: 'https://nextjs.org'
  },
  {
    name: 'Tailwind CSS',
    description: 'Utility-first CSS framework for rapidly building modern, responsive user interfaces with consistent design.',
    icon: Palette,
    category: 'Frontend',
    benefits: ['Rapid development', 'Consistent design', 'Responsive by default', 'Highly customizable'],
    url: 'https://tailwindcss.com'
  },
  {
    name: 'Supabase',
    description: 'Open source Firebase alternative providing instant APIs, realtime subscriptions, authentication, and edge functions.',
    icon: Database,
    category: 'Backend',
    benefits: ['Instant APIs', 'Real-time updates', 'Built-in authentication', 'Edge functions'],
    url: 'https://supabase.com'
  },
  {
    name: 'Strapi',
    description: 'Leading open-source headless CMS that gives developers the freedom to choose their favorite tools and frameworks.',
    icon: Layers,
    category: 'CMS',
    benefits: ['API-first approach', 'Flexible content types', 'Developer-friendly', 'Self-hosted'],
    url: 'https://strapi.io'
  },
  {
    name: 'Payload CMS',
    description: 'TypeScript-first headless CMS and application framework built with Node.js, React, and MongoDB.',
    icon: Shield,
    category: 'CMS',
    benefits: ['TypeScript native', 'Admin UI included', 'Highly extensible', 'Developer experience focused'],
    url: 'https://payloadcms.com'
  },
  {
    name: 'Tina CMS',
    description: 'Git-based headless CMS that allows content editing directly on your website with real-time visual editing.',
    icon: Code,
    category: 'CMS',
    benefits: ['Visual editing', 'Git-based workflow', 'Real-time preview', 'Developer-friendly'],
    url: 'https://tina.io'
  },
  {
    name: 'WordPress',
    description: 'Mature content management system, still popular for certain use cases. We can work with existing WordPress sites.',
    icon: Globe,
    category: 'CMS',
    benefits: ['Large ecosystem', 'Easy content management', 'Extensive plugins', 'Familiar to many users'],
    url: 'https://wordpress.org'
  },
  {
    name: 'Joomla',
    description: 'Flexible content management system with robust user management and multilingual capabilities. Great for complex websites.',
    icon: Globe,
    category: 'CMS',
    benefits: ['User management', 'Multilingual support', 'Flexible templates', 'Strong community'],
    url: 'https://www.joomla.org'
  },
  {
    name: 'Medusa.js',
    description: 'Modern, open-source e-commerce platform built for developers. Headless commerce with powerful APIs and customization.',
    icon: Globe,
    category: 'E-commerce',
    benefits: ['Headless architecture', 'Developer-friendly', 'Highly customizable', 'Modern tech stack'],
    url: 'https://medusajs.com'
  },
  {
    name: 'Shopware 6',
    description: 'Modern, API-first e-commerce platform with powerful customization capabilities. Open source core with commercial extensions.',
    icon: Globe,
    category: 'E-commerce',
    benefits: ['API-first design', 'Flexible architecture', 'Rich admin interface', 'German engineering'],
    url: 'https://www.shopware.com'
  },
  {
    name: 'Deployment & Hosting',
    description: 'Flexible hosting from open source solutions on Linux servers to modern platforms like Vercel and Netlify (proprietary but generous free tiers).',
    icon: Cloud,
    category: 'Infrastructure',
    benefits: ['Multiple hosting options', 'Global CDN', 'Automatic scaling', 'Git-based workflow'],
    url: 'https://vercel.com'
  }
]

const services = [
  {
    title: 'Custom Web Development',
    description: 'Tailored web applications built with modern open source technologies to meet your specific business needs.',
    icon: Code,
    features: [
      'Custom web applications',
      'E-commerce solutions',
      'API development',
      'Database design',
      'Performance optimization'
    ]
  },
  {
    title: 'Responsive Web Design',
    description: 'Beautiful, user-friendly designs that work perfectly across all devices and screen sizes.',
    icon: Palette,
    features: [
      'Mobile-first design',
      'User experience (UX) design',
      'User interface (UI) design',
      'Brand identity integration',
      'Accessibility compliance'
    ]
  },
  {
    title: 'CMS Development',
    description: 'Modern content management systems that give you full control over your website content with developer-friendly APIs.',
    icon: Globe,
    features: [
      'Headless CMS solutions (Strapi, Payload, Tina)',
      'WordPress development (legacy support)',
      'Custom CMS solutions',
      'Content migration',
      'Training and support'
    ]
  },
  {
    title: 'Website Maintenance',
    description: 'Ongoing support and maintenance to keep your website secure, updated, and performing optimally.',
    icon: Shield,
    features: [
      'Security updates',
      'Performance monitoring',
      'Content updates',
      'Backup management',
      'Technical support'
    ]
  }
]

const whyOpenSource = [
  {
    title: 'Freedom & Flexibility',
    description: 'Open source software gives you complete control over your website without vendor lock-in. You own your code and can modify it as needed.',
    icon: Heart
  },
  {
    title: 'Cost-Effective',
    description: 'No expensive licensing fees means more budget for features and functionality that matter to your business.',
    icon: Zap
  },
  {
    title: 'Security & Transparency',
    description: 'Open source code is reviewed by thousands of developers worldwide, making it more secure and trustworthy.',
    icon: Shield
  },
  {
    title: 'Community Support',
    description: 'Benefit from a global community of developers contributing improvements, fixes, and innovations.',
    icon: Users
  },
  {
    title: 'Future-Proof',
    description: 'Open source technologies evolve with the community and won\'t disappear if a company goes out of business.',
    icon: Rocket
  },
  {
    title: 'Environmental Impact',
    description: 'Open source promotes resource sharing and reduces waste, aligning with our sustainability mission.',
    icon: Globe
  }
]

// Get unique categories for filtering
const getUniqueCategories = () => {
  const categories = technologies.map(tech => tech.category)
  return ['All', ...Array.from(new Set(categories)).sort()]
}

export default function WebDesignDevelopmentPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const categories = getUniqueCategories()
  
  const filteredTechnologies = selectedCategory === 'All' 
    ? technologies 
    : technologies.filter(tech => tech.category === selectedCategory)

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Web Design & Development</h1>
            <p className="text-xl text-green-100 mb-8">
              Professional web design and development services using open source technologies. 
              We create modern, responsive websites that are sustainable, performant, and built to last.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Start Your Project
              </Link>
              <Link
                href="#services"
                className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
              >
                Explore Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services & Pricing Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Our Web Development Services</h2>
            <p className="text-lg text-gray-600 mb-4">
              Comprehensive web solutions built with open source technologies and sustainable practices.
            </p>
            <div className="text-green-600 font-semibold text-xl mb-8">
              Professional Web Development from CHF 70/hour
            </div>
            <div className="bg-green-50 rounded-lg p-6 text-left">
              <h3 className="font-semibold text-green-800 mb-2">Free Initial Consultation</h3>
              <p className="text-green-700">
                We start every project with a comprehensive consultation to understand your needs, 
                goals, and technical requirements. This helps us provide accurate estimates and 
                ensure we're the right fit for your project.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start mb-6">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                    <service.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {service.features.map((feature, i) => (
                    <div key={i} className="flex items-center text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Open Source Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Why We Prioritize Open Source</h2>
            <p className="text-lg text-gray-600">
              Open source software isn't just a technical choice—it's a philosophy that aligns with our values 
              of sustainability, transparency, and community collaboration.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyOpenSource.map((reason, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                    <reason.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">{reason.title}</h3>
                </div>
                <p className="text-gray-600">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies Section with Filtering */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-6">Technologies We Use</h2>
            <p className="text-lg text-gray-600 mb-8">
              We work with proven open source technologies that provide reliability, 
              performance, and long-term sustainability.
            </p>
            
            {/* Technology Filter */}
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

          {/* Technologies Grid with Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTechnologies.map((tech, index) => (
              <a 
                key={`${tech.name}-${selectedCategory}`}
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn block group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start mb-4">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4 flex-shrink-0 group-hover:bg-green-200 transition-colors duration-300">
                    <tech.icon className="w-8 h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-green-600 font-semibold mb-1 truncate">{tech.category}</div>
                    <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-green-700 transition-colors duration-300">{tech.name}</h3>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{tech.description}</p>
                <div className="space-y-2">
                  {tech.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="truncate">{benefit}</span>
                    </div>
                  ))}
                </div>
                
                {/* Link indicator */}
                <div className="mt-4 pt-3 border-t border-gray-200 flex items-center text-sm text-green-600 group-hover:text-green-700 transition-colors duration-300">
                  <ArrowRight className="w-4 h-4 mr-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                  <span>Visit website</span>
                </div>
              </a>
            ))}
          </div>

          {/* Results count */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Showing {filteredTechnologies.length} of {technologies.length} technologies
              {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Why Choose Our Web Development Services</h2>
            <p className="text-lg text-gray-600">
              We combine technical expertise with sustainable practices to deliver websites 
              that perform excellently while supporting your values.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                    <benefit.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
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
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Our Development Process</h2>
            <p className="text-lg text-gray-600">
              We follow a collaborative, transparent process that ensures your project 
              meets your needs and exceeds your expectations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Discovery',
                description: 'We start with a comprehensive consultation to understand your goals, requirements, and target audience.'
              },
              {
                step: '02',
                title: 'Planning',
                description: 'We create a detailed project plan, including timeline, technology stack, and design approach.'
              },
              {
                step: '03',
                title: 'Development',
                description: 'We build your website using agile methodology with regular updates and feedback sessions.'
              },
              {
                step: '04',
                title: 'Launch & Support',
                description: 'We launch your website and provide ongoing support, maintenance, and optimization.'
              }
            ].map((phase, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {phase.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{phase.title}</h3>
                <p className="text-gray-600">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Build Your Website?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Let's create a website that reflects your values and achieves your goals. 
            Contact us today for a free consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
            >
              Start Your Project
            </Link>
            <Link
              href="/services"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
            >
              Explore All Services
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
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  )
} 
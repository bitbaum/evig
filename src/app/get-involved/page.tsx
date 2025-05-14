import { Metadata } from 'next'
import { Users, Code, Building2, GraduationCap, Handshake, Heart, Globe, Recycle, Lightbulb, Gift } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { ContactLink } from '@/components/ui/contact-link'
import { HeroBanner } from '@/components/ui/hero-banner'

export const metadata: Metadata = {
  title: 'Get Involved | RevampIT',
  description: 'Join our mission to reduce electronic waste and make technology accessible to everyone. Volunteer, intern, or partner with us.'
}

const coreValues = [
  {
    title: 'Sustainability',
    description: 'We believe in creating a sustainable future through responsible technology use and waste reduction.',
    icon: Recycle
  },
  {
    title: 'Community',
    description: 'Building strong communities through technology education and inclusive participation.',
    icon: Users
  },
  {
    title: 'Innovation',
    description: 'Finding creative solutions to make technology accessible and environmentally friendly.',
    icon: Lightbulb
  },
  {
    title: 'Global Impact',
    description: 'Making a difference in local and global communities through technology.',
    icon: Globe
  }
]

const involvementOptions = [
  {
    title: 'Volunteer',
    description: 'Join our team of dedicated volunteers. No previous expertise required - just bring your interest and enthusiasm for our mission.',
    icon: Users,
    features: [
      'Work with hardware and software',
      'Learn new skills',
      'Make a difference in your community',
      'Meet like-minded people'
    ],
    cta: 'Start Volunteering',
    href: '/get-involved/volunteer'
  },
  {
    title: 'Technical Experts',
    description: 'If you have experience in open source software, hardware, or electronics, we\'d love to have you join our team or help realize your own ideas.',
    icon: Code,
    features: [
      'Work on meaningful projects',
      'Share your expertise',
      'Collaborate with the community',
      'Develop new solutions'
    ],
    cta: 'Share Your Expertise',
    href: '/get-involved/technical-experts'
  },
  {
    title: 'Internships',
    description: 'We offer internship opportunities for those looking to gain experience in technology and sustainability.',
    icon: GraduationCap,
    features: [
      'Hands-on experience',
      'Professional development',
      'Mentorship opportunities',
      'Flexible arrangements'
    ],
    cta: 'Apply for Internship',
    href: '/get-involved/internships'
  },
  {
    title: 'Work Reintegration',
    description: 'We collaborate with institutions to provide work reintegration opportunities for people looking to re-enter the workforce.',
    icon: Handshake,
    features: [
      'Skill development',
      'Social integration',
      'Professional support',
      'Meaningful work'
    ],
    cta: 'Learn More',
    href: '/get-involved/work-reintegration'
  },
  {
    title: 'Partnerships',
    description: 'We work with educational institutions and organizations to create meaningful programs and opportunities.',
    icon: Building2,
    features: [
      'Educational programs',
      'Work experience placements',
      'Community initiatives',
      'Sustainable solutions'
    ],
    cta: 'Partner With Us',
    href: '/get-involved/partnerships'
  },
  {
    title: 'Donate',
    description: 'Support our mission to make technology sustainable and accessible for everyone. Your contribution helps us continue our important work.',
    icon: Gift,
    features: [
      'Support sustainable technology',
      'Help reduce e-waste',
      'Enable community programs',
      'Make technology accessible'
    ],
    cta: 'Donate Now',
    href: '/get-involved/donate'
  }
]

const testimonials = [
  {
    quote: "As a refugee, RevampIT gave me the opportunity to work with them. I learn a lot and have the freedom to develop skills aligned with my goals. Now I write code and can learn anything I find interesting, as everyone is willing to share knowledge. This is a real community.",
    author: "G.",
    role: "Volunteer"
  }
]

const partnerInstitutions = [
  {
    name: 'Verein für berufliche und soziale Integration Bezirk Uster',
    url: 'https://www.integration-uster.ch'
  },
  {
    name: 'Arbeitsintegrationsstelle der Gemeinde Rüti',
    url: 'https://www.rueti.ch'
  },
  {
    name: 'HEKS',
    url: 'https://www.heks.ch/'
  },
  {
    name: 'AOZ (Asylorganisation Zürich)',
    url: 'https://www.stadt-zuerich.ch/aoz/de/index.html'
  }
]

export default function GetInvolvedPage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="Join Our Mission"
        description="Be part of a community that's making technology sustainable and accessible for everyone."
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#get-started"
            className="bg-white text-green-800 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-center"
          >
            Get Started
          </a>
          <a
            href="#learn-more"
            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-center"
          >
            Learn More
          </a>
        </div>
      </HeroBanner>

      {/* Core Values Section */}
      <section id="learn-more" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreValues.map((value, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-green-600 mb-4">
                  <value.icon className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Involvement Options */}
      <section id="get-started" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Ways to Get Involved</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {involvementOptions.map((option, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col h-full">
                <div className="text-green-600 mb-6">
                  <option.icon className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{option.title}</h3>
                <p className="text-gray-600 mb-6 flex-grow">{option.description}</p>
                <ul className="space-y-3 mb-8">
                  {option.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={option.href}
                  className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 w-full text-center mt-auto"
                >
                  {option.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">What Our Community Says</h2>
          <div className="max-w-3xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                <div className="text-green-600 mb-4">
                  <Heart className="w-8 h-8" />
                </div>
                <blockquote className="text-gray-600 mb-6 italic text-lg">"{testimonial.quote}"</blockquote>
                <div className="font-semibold text-lg">{testimonial.author}</div>
                <div className="text-gray-500">{testimonial.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Institutions */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Our Partner Institutions</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {partnerInstitutions.map((institution, index) => (
                <a
                  key={index}
                  href={institution.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-green-200 group"
                >
                  <svg className="w-6 h-6 mr-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 group-hover:text-green-600 transition-colors duration-300">{institution.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Join our community of changemakers and help us create a more sustainable future through technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ContactLink variant="outline" size="lg" className="bg-white text-green-800 hover:bg-green-50">
              Contact Us Today
            </ContactLink>
            <a
              href="/workshops"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
            >
              Explore Workshops
            </a>
          </div>
        </div>
      </section>
    </main>
  )
} 
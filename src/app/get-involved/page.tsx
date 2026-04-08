import { Metadata } from 'next'
import Link from 'next/link'
import { Heart, Globe, Recycle, Lightbulb, Users } from 'lucide-react'
import { ContactLink } from '@/components/ui/contact-link'
import { PageHero } from '@/components/layout/PageHero'
import { responsiveTypography, responsiveSpacing, responsiveButtons, responsiveGrid } from '@/lib/responsive'
import { INVOLVEMENT_OPTIONS, TESTIMONIALS, PARTNER_INSTITUTIONS, GET_INVOLVED_CONFIG } from '@/config/community'

export const metadata: Metadata = {
  title: 'Mitmachen | RevampIT',
  description: 'Schliess dich unserer Mission an, Elektroschrott zu reduzieren und Technologie für alle zugänglich zu machen. Werde Freiwilliger, Praktikant oder Partner.'
}

const coreValues = [
  {
    title: 'Nachhaltigkeit',
    description: 'Wir glauben an die Schaffung einer nachhaltigen Zukunft durch verantwortungsvolles Technologieeinsatz und Abfallreduzierung.',
    icon: Recycle
  },
  {
    title: 'Gemeinschaft',
    description: 'Starke Gemeinschaften durch Technologiebildung und inklusive Teilnahme aufbauen.',
    icon: Lightbulb
  },
  {
    title: 'Innovation',
    description: 'Kreative Lösungen finden, um Technologie zugänglich und umweltfreundlich zu machen.',
    icon: Lightbulb
  },
  {
    title: 'Globale Wirkung',
    description: 'Einen Unterschied in lokalen und globalen Gemeinschaften durch Technologie machen.',
    icon: Globe
  }
]

export default function GetInvolvedPage() {
  return (
    <main className="min-h-screen">
      <PageHero
        theme="getInvolved"
        icon={Users}
        title={GET_INVOLVED_CONFIG.hero.title}
        subtitle={GET_INVOLVED_CONFIG.hero.description}
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
          <a
            href="#get-started"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            Loslegen
          </a>
          <a
            href="#learn-more"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium px-6 py-3 bg-white text-purple-600 hover:bg-gray-50 border-2 border-purple-600 transition-colors"
          >
            Mehr erfahren
          </a>
        </div>
      </PageHero>

      {/* Core Values Section */}
      <section id="learn-more" className={`${responsiveSpacing.section} bg-gray-50`}>
        <div className={`${responsiveSpacing.container} mx-auto`}>
          <h2 className={`${responsiveTypography.section} font-bold text-center ${responsiveSpacing.mbLarge}`}>
            {GET_INVOLVED_CONFIG.coreValues.title}
          </h2>
          <div className={responsiveGrid.cards}>
            {coreValues.map((value, index) => (
              <div key={index} className={`bg-white rounded-xl ${responsiveSpacing.cardPadding} shadow-lg hover:shadow-xl transition-all duration-300`}>
                <div className={`text-green-600 ${responsiveSpacing.mbMedium}`}>
                  <value.icon className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>
                <h3 className={`${responsiveTypography.cardTitle} font-semibold ${responsiveSpacing.mbSmall}`}>
                  {value.title}
                </h3>
                <p className={`${responsiveTypography.body} text-gray-600`}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Involvement Options */}
      <section id="get-started" className={responsiveSpacing.section}>
        <div className={`${responsiveSpacing.container} mx-auto`}>
          <h2 className={`${responsiveTypography.section} font-bold text-center ${responsiveSpacing.mbLarge}`}>
            Wege zum Mitmachen
          </h2>
          <div className={responsiveGrid.cards}>
            {INVOLVEMENT_OPTIONS.map((option, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-lg ${responsiveSpacing.cardPadding} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col h-full`}>
                <div className={`text-green-600 ${responsiveSpacing.mbMedium}`}>
                  <option.icon className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>
                <h3 className={`${responsiveTypography.cardTitle} font-semibold ${responsiveSpacing.mbSmall}`}>
                  {option.title}
                </h3>
                <p className={`${responsiveTypography.body} text-gray-600 ${responsiveSpacing.mbMedium} flex-grow`}>
                  {option.description}
                </p>
                <ul className={`space-y-2 sm:space-y-3 ${responsiveSpacing.mbMedium}`}>
                  {option.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-gray-600">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={responsiveTypography.small}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={option.href}
                  className={`${responsiveButtons.primary} bg-green-600 text-white hover:bg-green-700 w-full text-center mt-auto`}
                >
                  {option.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`${responsiveSpacing.section} bg-gray-50`}>
        <div className={`${responsiveSpacing.container} mx-auto`}>
          <h2 className={`${responsiveTypography.section} font-bold text-center ${responsiveSpacing.mbLarge}`}>
            Was unsere Gemeinschaft sagt
          </h2>
          <div className="max-w-3xl mx-auto">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className={`bg-white rounded-xl ${responsiveSpacing.cardPadding} shadow-lg`}>
                <div className={`text-green-600 ${responsiveSpacing.mbSmall}`}>
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <blockquote className={`${responsiveTypography.lead} text-gray-600 ${responsiveSpacing.mbMedium} italic`}>
                  "{testimonial.quote}"
                </blockquote>
                <div className={`${responsiveTypography.cardTitle} font-semibold`}>{testimonial.author}</div>
                <div className={`${responsiveTypography.body} text-gray-500`}>{testimonial.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Institutions */}
      <section className={responsiveSpacing.section}>
        <div className={`${responsiveSpacing.container} mx-auto`}>
          <h2 className={`${responsiveTypography.section} font-bold text-center ${responsiveSpacing.mbLarge}`}>
            Unsere Partnerorganisationen
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {PARTNER_INSTITUTIONS.map((institution, index) => (
                <a
                  key={index}
                  href={institution.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center ${responsiveSpacing.cardPadding} bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-green-200 group`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`${responsiveTypography.body} text-gray-700 group-hover:text-green-600 transition-colors duration-300`}>
                    {institution.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${responsiveSpacing.section} bg-gradient-to-br from-green-600 to-emerald-700 text-white`}>
        <div className={`${responsiveSpacing.container} mx-auto text-center`}>
          <h2 className={`${responsiveTypography.section} font-bold ${responsiveSpacing.mbSmall}`}>
            Bereit, einen Unterschied zu machen?
          </h2>
          <p className={`${responsiveTypography.lead} ${responsiveSpacing.mbMedium} max-w-2xl mx-auto text-green-100`}>
            Schliess dich unserer Gemeinschaft von Veränderern an und hilf uns, eine nachhaltigere Zukunft durch Technologie zu schaffen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <ContactLink variant="outline" size="lg" className="bg-white text-green-800 hover:bg-green-50">
              {GET_INVOLVED_CONFIG.cta.contactButton}
            </ContactLink>
            <Link
              href="/workshops"
              className={`${responsiveButtons.large} bg-transparent border-2 border-white text-white hover:bg-white/10`}
            >
              Workshops entdecken
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
} 
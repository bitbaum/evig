'use client'

import Link from 'next/link'
import { mainNavigation, socialLinks } from '@/config/navigation'
import { Logo } from '@/components/ui/Logo'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { ORG, CONTACT, LOCATIONS, OPENING_HOURS } from '@/config/org'

const footerLocations = [
  {
    name: LOCATIONS.store.name,
    addressLines: [LOCATIONS.store.street, `${LOCATIONS.store.postalCode} ${LOCATIONS.store.city}`, LOCATIONS.store.country],
  },
  {
    name: LOCATIONS.warehouse.name,
    addressLines: [LOCATIONS.warehouse.street, `${LOCATIONS.warehouse.postalCode} ${LOCATIONS.warehouse.city}`],
    extra: LOCATIONS.warehouse.note,
  },
]
import { NewsletterSignup } from '@/components/community/NewsletterSignup'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'

export default function Footer() {
  const tFooter = useTranslations('footer')
  const tNav = useTranslations('nav')

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <Logo className="mb-4" showText={true} />
            <p className="text-sm text-gray-300">
              {tFooter('mission')}
            </p>
          </div>

          {/* Navigation Section */}
          <nav aria-label={tFooter('navigation')}>
            <Heading level={3} className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              {tFooter('navigation')}
            </Heading>
            <ul className="space-y-2">
              {mainNavigation.map((item) => (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.href}
                      className="text-sm text-gray-300 hover:text-white transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.nameKey ? tNav(item.nameKey as never) : item.name}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      {item.nameKey ? tNav(item.nameKey as never) : item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact Section */}
          <div>
            <Heading level={3} className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              {tNav('contact')}
            </Heading>
            <address className="space-y-4 not-italic">
              {footerLocations.map((location) => (
                <div className="flex items-start" key={location.name}>
                  <MapPin className="w-4 h-4 mt-0.5 mr-3 flex-shrink-0 text-gray-300" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">{location.name}</p>
                    {location.addressLines.map((line) => (
                      <p className="text-sm text-gray-300" key={line}>{line}</p>
                    ))}
                    {'extra' in location && location.extra && (
                      <p className="text-xs text-gray-300 mt-0.5">{location.extra}</p>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <a href={`tel:${CONTACT.phone}`} className="text-sm text-gray-300 hover:text-white transition-colors">
                  {CONTACT.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <a href={`mailto:${CONTACT.email}`} className="text-sm text-gray-300 hover:text-white transition-colors">
                  {CONTACT.email}
                </a>
              </div>
            </address>
          </div>

          {/* Opening Hours */}
          <div>
            <Heading level={3} className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              <Clock className="inline w-4 h-4 mr-1.5 mb-0.5" />
              {tFooter('openingHours')}
            </Heading>
            <div className="space-y-1 text-sm text-gray-300">
              <p>{tFooter('openingHoursMonday', { hours: OPENING_HOURS.monday })}</p>
              <p>{tFooter('openingHoursTueFri', { hours: OPENING_HOURS.tuesdayToFriday })}</p>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-10 pt-8 border-t border-gray-800">
          <NewsletterSignup
            source="footer"
            variant="dark"
          />
        </div>

        {/* Social Links */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex justify-center gap-4">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.href}
              className="p-2 text-gray-300 hover:text-white transition-colors rounded-md hover:bg-gray-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">{social.name}</span>
              <social.icon className="h-5 w-5" />
            </a>
          ))}
        </div>

        {/* Legal Links */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <nav aria-label={tFooter('legal')} className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-300">
            <Link href="/impressum" className="hover:text-white transition-colors">
              {tFooter('impressum')}
            </Link>
            <Link href="/datenschutz" className="hover:text-white transition-colors">
              {tFooter('privacyPolicy')}
            </Link>
            <Link href="/agb" className="hover:text-white transition-colors">
              {tFooter('termsOfService')}
            </Link>
            <Link href="/transparenz" className="hover:text-white transition-colors">
              {tFooter('transparency')}
            </Link>
            <Link href="/mitglied-werden" className="hover:text-white transition-colors">
              {tNav('membership')}
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-xs text-gray-300">
          &copy; {new Date().getFullYear()} {ORG.name}. {tFooter('allRightsReserved')}
        </div>
      </div>
    </footer>
  )
}

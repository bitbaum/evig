'use client'

import { Link } from '@/i18n/navigation'
import { mainNavigation, socialLinks } from '@/config/navigation'
import { Logo } from '@/components/ui/Logo'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { ORG, CONTACT, OPENING_HOURS, getLocationsDisplay } from '@/config/org'
import { ROUTES } from '@/config/routes'
import { NewsletterSignup } from '@/components/community/NewsletterSignup'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'

const footerLocations = getLocationsDisplay()

/**
 * Footer — flips with theme like the rest of the site. The legacy
 * "always dark" treatment broke the visual rhythm of the page in
 * light mode. Surface uses neutral-50 / neutral-950 to match the
 * canvas, with border-only separators (no shadows, no gradients —
 * consistent with the design system rules).
 */
export default function Footer() {
  const tFooter = useTranslations('footer')
  const tNav = useTranslations('nav')

  return (
    <footer className="bg-surface-raised dark:bg-neutral-950 text-text-primary dark:text-neutral-100 border-t border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <Logo className="mb-4" showText={true} />
            <p className="text-sm text-text-secondary">
              {tFooter('mission')}
            </p>
          </div>

          {/* Navigation Section */}
          <nav aria-label={tFooter('navigation')}>
            <Heading level={3} className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-4">
              {tFooter('navigation')}
            </Heading>
            <ul className="space-y-2">
              {mainNavigation.map((item) => (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.href}
                      className="text-sm text-text-secondary hover:text-neutral-900 dark:hover:text-white transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.nameKey ? tNav(item.nameKey as never) : item.name}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-sm text-text-secondary hover:text-neutral-900 dark:hover:text-white transition-colors"
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
            <Heading level={3} className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-4">
              {tNav('contact')}
            </Heading>
            <address className="space-y-4 not-italic">
              {footerLocations.map((location) => (
                <div className="flex items-start" key={location.key}>
                  <MapPin className="w-4 h-4 mt-0.5 mr-3 shrink-0 text-text-tertiary" />
                  <div>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{location.name}</p>
                    {location.addressLines.map((line) => (
                      <p className="text-sm text-text-secondary" key={line}>{line}</p>
                    ))}
                    {location.note && (
                      <p className="text-xs text-text-tertiary dark:text-neutral-500 mt-0.5">{location.note}</p>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-text-tertiary shrink-0" />
                <a href={`tel:${CONTACT.phone}`} className="text-sm text-text-secondary hover:text-neutral-900 dark:hover:text-white transition-colors">
                  {CONTACT.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-text-tertiary shrink-0" />
                <a href={`mailto:${CONTACT.email}`} className="text-sm text-text-secondary hover:text-neutral-900 dark:hover:text-white transition-colors">
                  {CONTACT.email}
                </a>
              </div>
            </address>
          </div>

          {/* Opening Hours */}
          <div>
            <Heading level={3} className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-4">
              <Clock className="inline w-4 h-4 mr-1.5 mb-0.5" />
              {tFooter('openingHours')}
            </Heading>
            <div className="space-y-1 text-sm text-text-secondary">
              <p>{tFooter('openingHoursMonday', { hours: OPENING_HOURS.monday })}</p>
              <p>{tFooter('openingHoursTueFri', { hours: OPENING_HOURS.tuesdayToFriday })}</p>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-10 pt-8 border-t border">
          <NewsletterSignup
            source="footer"
          />
        </div>

        {/* Social Links */}
        <div className="mt-8 pt-6 border-t border flex justify-center gap-4">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.href}
              className="p-2 text-text-tertiary hover:text-neutral-900 dark:hover:text-white transition-colors rounded-md hover:bg-neutral-100 dark:hover:bg-white/4"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">{social.name}</span>
              <social.icon className="h-5 w-5" />
            </a>
          ))}
        </div>

        {/* Legal Links — routes from ROUTES.public SSOT */}
        <div className="mt-6 pt-6 border-t border">
          <nav aria-label={tFooter('legal')} className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-text-tertiary">
            <Link href={ROUTES.public.impressum} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              {tFooter('impressum')}
            </Link>
            <Link href={ROUTES.public.datenschutz} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              {tFooter('privacyPolicy')}
            </Link>
            <Link href={ROUTES.public.agb} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              {tFooter('termsOfService')}
            </Link>
            <Link href={ROUTES.public.transparenz} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              {tFooter('transparency')}
            </Link>
            <Link href={ROUTES.public.mitgliedWerden} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              {tNav('membership')}
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-xs text-text-tertiary dark:text-neutral-500">
          &copy; {new Date().getFullYear()} {ORG.name}. {tFooter('allRightsReserved')}
        </div>
      </div>
    </footer>
  )
}

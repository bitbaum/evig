'use client'

import Link from 'next/link'
import { mainNavigation, socialLinks } from '@/config/navigation'
import { Logo } from '@/components/ui/Logo'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { ORG } from '@/config/org'
import { NewsletterSignup } from '@/components/community/NewsletterSignup'
import Heading from '@/components/ui/Heading'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <Logo className="mb-4" showText={true} />
            <p className="text-sm text-gray-300">
              Die Zukunft der IT durch nachhaltige Aufarbeitung und Recycling gestalten.
            </p>
          </div>

          {/* Navigation Section */}
          <nav aria-label="Footer-Navigation">
            <Heading level={3} className="text-xl font-bold mb-4">Navigation</Heading>
            <ul className="space-y-2">
              {mainNavigation.map((item) => (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.href}
                      className="text-gray-300 hover:text-white transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact Section */}
          <div>
            <Heading level={3} className="text-xl font-bold mb-4">Kontakt</Heading>
            <address className="space-y-4 not-italic">
              {siteConfig.contact.locations.map((location) => (
                <div className="flex items-start" key={location.name}>
                  <MapPin className="w-5 h-5 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{location.name}</p>
                    {location.addressLines.map((line) => (
                      <p className="text-gray-300" key={line}>{line}</p>
                    ))}
                    {'extra' in location && location.extra && <p className="text-gray-300 text-sm">{location.extra}</p>}
                  </div>
                </div>
              ))}
              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-3" />
                <a href={`tel:${siteConfig.contact.phone}`} className="text-gray-300 hover:text-white transition-colors">
                  {siteConfig.contact.phone}
                </a>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-3" />
                <a href={`mailto:${siteConfig.contact.email}`} className="text-gray-300 hover:text-white transition-colors">
                  {siteConfig.contact.email}
                </a>
              </div>
            </address>
          </div>

          {/* Opening Hours Section */}
          <div>
            <Heading level={3} className="text-xl font-bold mb-4">Öffnungszeiten</Heading>
            <div className="flex items-start">
              <Clock className="w-5 h-5 mt-1 mr-3 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-gray-300">Montag: {siteConfig.openingHours.monday}</p>
                <p className="text-gray-300">Dienstag - Freitag: {siteConfig.openingHours.tuesdayToFriday}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-10 pt-8 border-t border-gray-800">
          <NewsletterSignup
            title="Newsletter"
            description="Updates zu unserer Arbeit — keine Werbung."
            source="footer"
            variant="dark"
          />
        </div>

        {/* Social Links */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex justify-center space-x-6">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">{social.name}</span>
                <social.icon className="h-6 w-6" />
              </a>
            ))}
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <nav aria-label="Rechtliche Hinweise" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/impressum" className="text-gray-400 hover:text-white transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" className="text-gray-400 hover:text-white transition-colors">
              Datenschutz
            </Link>
            <Link href="/agb" className="text-gray-400 hover:text-white transition-colors">
              AGB
            </Link>
            <Link href="/transparenz" className="text-gray-400 hover:text-white transition-colors">
              Transparenz
            </Link>
            <Link href="/mitglied-werden" className="text-gray-400 hover:text-white transition-colors">
              Mitglied werden
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} {ORG.name}. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  )
} 
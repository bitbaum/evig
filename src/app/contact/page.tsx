import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Phone, MapPin, Clock, Map as MapIcon, Shield } from 'lucide-react'
import { STORE_GOOGLE_MAPS_URL, STORE_OSM_URL, WAREHOUSE_GOOGLE_MAPS_URL, WAREHOUSE_OSM_URL } from '@/lib/constants'
import Heading from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: 'Kontakt | RevampIT',
  description: 'Kontaktieren Sie RevampIT für Linux-Support, Workshops und Open-Source-Lösungen.'
}

const contactInfo = [
  {
    title: 'E-Mail',
    value: 'empfang@revamp-it.ch',
    icon: Mail,
    link: 'mailto:empfang@revamp-it.ch'
  },
  {
    title: 'Telefon',
    value: '+41 (0)43 960 32 64',
    icon: Phone,
    link: 'tel:+41439603264'
  },
  {
    title: 'Adresse',
    value: 'Birmensdorferstr. 379\n8055 Zürich\nSchweiz',
    icon: MapPin,
    link: 'https://www.google.com/maps/place/Birmensdorferstrasse+379,+8055+Z%C3%BCrich'
  },
  {
    title: 'Öffnungszeiten',
    value: 'Montag: 9:00 - 12:00\nDienstag - Freitag: 13:00 - 17:00',
    icon: Clock
  }
]

import ContactForm from './ContactForm'

export default function ContactPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-3xl">
            <Heading level={1} className="mb-4 sm:mb-6 leading-tight">Kontakt</Heading>
            <p className="text-base sm:text-lg md:text-xl text-green-100">
              Haben Sie Fragen zu unseren Dienstleistungen, Workshops oder Linux-Lösungen? Wir helfen gerne!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-green-50 rounded-xl p-4 sm:p-6 text-center">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <info.icon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-green-700 mb-2">{info.title}</h3>
                {info.link ? (
                  <a 
                    href={info.link}
                    className="text-gray-600 hover:text-green-600 transition-colors duration-200"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="text-gray-600">{info.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <Heading level={2} className="mb-6 sm:mb-8 text-center">Finden Sie uns</Heading>
            <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2701.1234567890123!2d8.5237!3d47.3815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479aa0a7e8c7b8b9%3A0x1234567890abcdef!2sBirmensdorferstrasse%20379%2C%208055%20Z%C3%BCrich!5e0!3m2!1sen!2sch!4v1234567890123"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <div className="mt-6 sm:mt-8 text-center space-y-3 sm:space-y-4">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <a
                  href={STORE_GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  <MapPin className="w-4 h-4 mr-2" /> In Google Maps öffnen
                </a>
                <a
                  href={STORE_OSM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  <MapIcon className="w-4 h-4 mr-2" /> In OpenStreetMap öffnen
                </a>
              </div>
              
              {/* Explanation about map choices */}
              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 w-4 h-4 text-green-700 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Warum zwei Kartenoptionen?</p>
                    <p>
                      OpenStreetMap ist community‑getrieben und datensparsam. Google/Apple Maps bieten oft bessere Navigation, Live‑Verkehr und POIs. 
                      Wählen Sie, was für Sie am besten passt – Transparenz und Wahlfreiheit sind uns wichtig.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-600 mb-3">Wir haben auch einen Lagerstandort in der Badenerstr. 816, 8048 Zürich (nur nach Terminvereinbarung)</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a
                    href={WAREHOUSE_GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-700"
                  >
                    <MapPin className="w-4 h-4 mr-1" /> Lager in Google Maps
                  </a>
                  <a
                    href={WAREHOUSE_OSM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-700"
                  >
                    <MapIcon className="w-4 h-4 mr-1" /> Lager in OpenStreetMap
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 

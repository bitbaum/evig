import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

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
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Kontakt</h1>
            <p className="text-xl text-green-100">
              Haben Sie Fragen zu unseren Dienstleistungen, Workshops oder Linux-Lösungen? Wir helfen gerne!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-green-50 rounded-xl p-6 text-center">
                <div className="flex justify-center mb-4">
                  <info.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-700 mb-2">{info.title}</h3>
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Finden Sie uns</h2>
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
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">Wir haben auch einen Lagerstandort in der Badenerstr. 816, 8048 Zürich (nur nach Terminvereinbarung)</p>
              <Link
                href="https://www.google.com/maps/place/RevampIT/@47.3815,8.5237,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-green-600 hover:text-green-700"
              >
                <MapPin className="w-5 h-5 mr-2" />
                In Google Maps öffnen
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 

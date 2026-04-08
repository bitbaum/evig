import Link from 'next/link'
import Heading from '@/components/ui/Heading'

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
      <div className="container mx-auto px-4 text-center">
        <Heading level={2} className="mb-6">Bereit, deine Website zu erstellen?</Heading>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
          Lass uns eine Website erstellen, die deine Werte widerspiegelt und deine Ziele erreicht.
          Kontaktiere uns noch heute für eine kostenlose Beratung.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
          >
            Starte dein Projekt
          </Link>
          <Link
            href="/services"
            className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
          >
            Alle Dienstleistungen entdecken
          </Link>
        </div>
      </div>
    </section>
  )
}

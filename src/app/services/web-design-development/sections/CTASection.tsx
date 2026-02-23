import Link from 'next/link'

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6">Bereit, Ihre Website zu erstellen?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
          Lassen Sie uns eine Website erstellen, die Ihre Werte widerspiegelt und Ihre Ziele erreicht.
          Kontaktieren Sie uns noch heute für eine kostenlose Beratung.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
          >
            Starten Sie Ihr Projekt
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

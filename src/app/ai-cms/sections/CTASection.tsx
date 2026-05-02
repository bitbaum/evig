import Link from 'next/link'

export function CTASection() {
  return (
    <section className="py-20 px-4 bg-green-600">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Machen Sie Ihre Website besser — gemeinsam
        </h2>
        <p className="text-green-100 mb-8">
          Registrieren Sie sich kostenlos und helfen Sie mit, revamp-it.ch kontinuierlich zu verbessern.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
          >
            Kostenlos registrieren
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 border border-green-400 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Kontakt aufnehmen
          </Link>
        </div>
      </div>
    </section>
  )
}

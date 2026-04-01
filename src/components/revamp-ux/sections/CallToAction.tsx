/**
 * Call to Action Section
 * @fileoverview Marketing-focused CTA with clear next steps
 */

import Link from 'next/link'

export function CallToAction() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Bereit für bessere Website-Verbesserungen?
        </h2>
        <p className="mt-6 text-lg leading-8 text-gray-600 mb-8">
          Starten Sie noch heute mit Revamp-UX und revolutionieren Sie Ihre Feedback-Kultur.
        </p>

        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Was Sie erwartet:</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              Sofort einsatzbereit
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              Kostenlose Testphase
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              Persönliche Einführung
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              Laufender Support
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
          >
            Kostenlose Demo vereinbaren
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/get-involved"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
          >
            Mehr Informationen
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-600">
          Keine Kreditkarte erforderlich • 30 Tage kostenlos testen • Jederzeit kündbar
        </p>
      </div>
    </div>
  )
}

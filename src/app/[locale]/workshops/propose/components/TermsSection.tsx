'use client'

import Link from 'next/link'
import Heading from '@/components/ui/Heading'

interface TermsSectionProps {
  termsAccepted: boolean
  onChange: (accepted: boolean) => void
}

export function TermsSection({ termsAccepted, onChange }: TermsSectionProps) {
  return (
    <div className="mb-8">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <Heading level={3} className="text-lg font-semibold text-gray-900 mb-4">
          Nutzungsbedingungen für Workshop-Veranstalter
        </Heading>

        <div className="space-y-3 text-sm text-gray-700 mb-4">
          <p>• Ich verpflichte mich, Workshops mit hoher Qualität und Engagement durchzuführen</p>
          <p>• Ich werde alle Teilnehmer respektvoll und professionell behandeln</p>
          <p>• Ich bin für die Sicherheit und den reibungslosen Ablauf des Workshops verantwortlich</p>
          <p>• Ich werde angemessene Vorkenntnisse und klare Lernziele kommunizieren</p>
          <p>• Ich akzeptiere das Bewertungssystem und die Plattformgebühren</p>
          <p>• Meine Angaben sind wahrheitsgemäss und ich werde sie aktuell halten</p>
        </div>

        <div className="mt-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => onChange(e.target.checked)}
              className="mt-1 mr-3 text-green-600 focus:ring-green-500"
              required
              aria-required="true"
            />
            <span className="text-sm font-medium text-gray-700">
              Ich akzeptiere die{' '}
              <Link href="/terms" className="text-green-600 hover:text-green-700 underline">
                Nutzungsbedingungen
              </Link>{' '}
              und die{' '}
              <Link href="/privacy" className="text-green-600 hover:text-green-700 underline">
                Datenschutzerklärung
              </Link>
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}

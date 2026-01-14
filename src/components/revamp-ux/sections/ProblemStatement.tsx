/**
 * Problem Statement Section
 * @fileoverview Marketing-focused problem statement with progressive disclosure
 */

import { useState } from 'react'
import { AlertTriangle, Clock, Users } from 'lucide-react'

export function ProblemStatement() {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="py-16 sm:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Warum Website-Verbesserungen scheitern
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Die Kluft zwischen Nutzer-Feedback und erfolgreichen Verbesserungen ist grösser als je zuvor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Technische Barrieren</h3>
            <p className="text-gray-600 text-sm">
              Nutzer haben keine einfache Möglichkeit, Probleme zu melden.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Zeitaufwändig</h3>
            <p className="text-gray-600 text-sm">
              Von Feedback bis Umsetzung vergehen oft Wochen oder Monate.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Feedback-Verlust</h3>
            <p className="text-gray-600 text-sm">
              Wertvolles Wissen von Nutzern geht verloren.
            </p>
          </div>
        </div>

        {!showDetails && (
          <div className="text-center">
            <button
              onClick={() => setShowDetails(true)}
              className="inline-flex items-center px-4 py-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
            >
              Mehr erfahren
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {showDetails && (
          <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              Das Problem im Detail
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Für Website-Betreiber:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Nutzer-Feedback erreicht sie nicht direkt</li>
                  <li>• Technische Hürden verhindern Beteiligung</li>
                  <li>• Feedback ist oft unstrukturiert und vage</li>
                  <li>• Priorisierung von Verbesserungen ist schwierig</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Für Nutzer:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Keine einfache Möglichkeit, Probleme zu melden</li>
                  <li>• Technisches Know-how wird vorausgesetzt</li>
                  <li>• Feedback verschwindet oft im Nirvana</li>
                  <li>• Keine Rückmeldung über Umsetzung</li>
                </ul>
              </div>
            </div>
            <div className="text-center mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Weniger anzeigen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



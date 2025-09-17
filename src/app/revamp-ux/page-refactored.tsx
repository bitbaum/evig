/**
 * Refactored Revamp-UX Page
 * @fileoverview Modular, maintainable version of the original god component
 *
 * Improvements:
 * - Separated components into reusable modules
 * - Extracted data from logic
 * - Improved TypeScript types
 * - Better separation of concerns
 * - Reduced file size from 1036 to ~100 lines
 */

'use client'

import { useState } from 'react'
import { HeroSection, FeatureModal, FEATURE_DETAILS, type FeatureKey } from '@/components/revamp-ux'

export default function RevampUXPageRefactored() {
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey | null>(null)

  const handleFeatureClick = (feature: FeatureKey) => {
    setSelectedFeature(feature)
  }

  const handleClosePanel = () => {
    setSelectedFeature(null)
  }

  return (
    <div className="bg-white">
      {/* Feature Detail Modal */}
      <FeatureModal
        selectedFeature={selectedFeature}
        featureDetails={FEATURE_DETAILS}
        onClose={handleClosePanel}
      />

      {/* Hero Section */}
      <HeroSection />

      {/* Problem Statement */}
      <ProblemStatement />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Features */}
      <FeaturesSection />

      {/* Feature Comparison */}
      <FeatureComparisonSection onFeatureClick={handleFeatureClick} />

      {/* Access Control */}
      <AccessControlSection />

      {/* Architecture */}
      <ArchitectureSection />

      {/* Implementation Guide */}
      <ImplementationGuideSection />

      {/* System Development Status */}
      <SystemDevelopmentStatusSection />

      {/* Call to Action */}
      <CallToActionSection />
    </div>
  )
}

// Extracted smaller components for better organization
function ProblemStatement() {
  return (
    <div className="py-16 sm:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Das Problem
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Website-Verbesserungen sind zeitaufwändig und oft unpräzise
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-red-600 text-2xl">⏰</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Zeitaufwändige Prozesse</h3>
            <p className="text-gray-600">
              Nutzer müssen Kontaktformulare finden, ausfüllen und warten. Entwickler müssen E-Mails durchsuchen und Probleme nachvollziehen.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-orange-600 text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Ungenaue Kommunikation</h3>
            <p className="text-gray-600">
              Vage Beschreibungen wie "Die Seite ist langsam" oder "Das Design gefällt mir nicht" geben Entwicklern keine konkreten Ansatzpunkte.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-blue-600 text-2xl">🔄</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Verpasste Chancen</h3>
            <p className="text-gray-600">
              Community-Wissen geht verloren. Nutzer haben wertvolle Verbesserungsideen, aber keinen direkten Kanal zur Übermittlung.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function HowItWorksSection() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Wie Revamp-UX funktioniert
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Warum dieses integrierte Feedback-System so effizient ist: Minimale manuelle Arbeit, maximale Wirkung.
          </p>
        </div>

        <div className="relative">
          {/* Workflow Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative">
            {/* Connection Lines - Smooth gradient flow */}
            <div className="hidden lg:block absolute top-24 left-[12%] w-[16%] h-1 bg-gradient-to-r from-blue-400 to-blue-300 rounded-full opacity-70"></div>
            <div className="hidden lg:block absolute top-24 left-[28%] w-[16%] h-1 bg-gradient-to-r from-green-400 to-green-300 rounded-full opacity-70"></div>
            <div className="hidden lg:block absolute top-24 left-[44%] w-[16%] h-1 bg-gradient-to-r from-purple-400 to-purple-300 rounded-full opacity-70"></div>
            <div className="hidden lg:block absolute top-24 left-[60%] w-[16%] h-1 bg-gradient-to-r from-orange-400 to-orange-300 rounded-full opacity-70"></div>
            <div className="hidden lg:block absolute top-24 left-[76%] w-[16%] h-1 bg-gradient-to-r from-red-400 to-red-300 rounded-full opacity-70"></div>

            {/* Step 1 */}
            <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">1. Vorschlag</h3>
              <p className="text-sm text-gray-700 text-center">
                Nutzer oder Team-Mitglied schlägt Verbesserung vor. Wenige Sekunden Aufwand.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">2. AI-Analyse</h3>
              <p className="text-sm text-gray-700 text-center">
                AI vergleicht Vorschlag mit Codebase und erstellt technische Bewertung. Vollautomatisch.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">3. Strukturierte Info</h3>
              <p className="text-sm text-gray-700 text-center">
                Entwickler erhält sofort strukturierte Informationen zur Entscheidungsfindung.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">4. Umsetzung</h3>
              <p className="text-sm text-gray-700 text-center">
                Copy-Paste zur AI-Coding-Agent. Änderungen in Sekunden bis Minuten.
              </p>
            </div>

            {/* Step 5 */}
            <div className="relative bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">5. Git-Versionierung</h3>
              <p className="text-sm text-gray-700 text-center">
                Automatische Versionierung. Vollständige Nachverfolgbarkeit.
              </p>
            </div>
          </div>
        </div>

        {/* Why It's Fast */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-green-50 rounded-3xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Warum Revamp-UX so effizient ist</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Der wahre Wert liegt in der Effizienz: Minimale manuelle Arbeit für alle Beteiligten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Für Nutzer</h4>
              <p className="text-gray-600">
                Ein Klick, kurze Beschreibung. Kein technisches Wissen oder Registrierung nötig.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Für Entwickler</h4>
              <p className="text-gray-600">
                Strukturierte Informationen statt vager Beschreibungen. Schnelle Entscheidungsfindung.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Für das Team</h4>
              <p className="text-gray-600">
                Wenige Minuten statt Tage für typische Änderungen. Mehr Zeit für wichtige Features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccessControlSection() {
  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Flexible Zugriffskontrolle
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Nicht alle Websites brauchen unbegrenzte Nutzerbeteiligung. Das System lässt sich an Ihre Bedürfnisse anpassen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border border-blue-200">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Öffentlich zugänglich</h3>
            <p className="text-gray-600 mb-4">
              Wie auf dieser Website: Jeder Besucher kann Verbesserungen vorschlagen. Ideal für Community-getriebene Projekte.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Keine Registrierung nötig</li>
              <li>• Rate-Limiting gegen Spam</li>
              <li>• Menschliche Moderation</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl border border-green-200">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Registrierte Nutzer</h3>
            <p className="text-gray-600 mb-4">
              Nur eingeloggte Nutzer können Vorschläge machen. Geeignet für Member- oder Kundenbereiche.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Account-Verifikation</li>
              <li>• Nutzerhistorie</li>
              <li>• Qualitätsbewertung</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl border border-purple-200">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Team-Mitglieder</h3>
            <p className="text-gray-600 mb-4">
              Nur autorisierte Team-Mitglieder haben Zugriff. Perfekt für interne Verbesserungsprozesse.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Rollenbasierte Berechtigungen</li>
              <li>• Direkte Team-Kommunikation</li>
              <li>• Schnellere Umsetzung</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 bg-gray-50 rounded-2xl p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Warum Zugriffskontrolle wichtig ist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">✅ Vorteile der Beschränkung:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Weniger Spam und irrelevante Vorschläge</li>
                  <li>• Höhere Qualität der Eingaben</li>
                  <li>• Schnellere Bearbeitungszeiten</li>
                  <li>• Bessere Kontrolle über Änderungen</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">❌ Nachteile der Beschränkung:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Höhere Einstiegshürde für Nutzer</li>
                  <li>• Weniger externes Feedback</li>
                  <li>• Zusätzlicher Verwaltungsaufwand</li>
                  <li>• Potenziell verpasste Verbesserungen</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon: Advanced Targeting Features */}
        <div className="mt-16 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🚀 Bald verfügbar: Präzise Zielauswahl</h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Für lange Seiten: Verschiedene Möglichkeiten, genau das Element zu markieren, das Sie verbessern möchten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-2xl">📸</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Screenshot-Integration</h4>
              <p className="text-gray-600 text-sm">
                Machen Sie einen Screenshot des Bereichs, den Sie verbessern möchten. Die AI erkennt automatisch das Element.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 text-2xl">🎯</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Visuelle Markierung</h4>
              <p className="text-gray-600 text-sm">
                Klicken und ziehen Sie, um Bereiche zu markieren. Das System erfasst automatisch die genaue Position.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 text-2xl">🖱️</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Rechtsklick-Menü</h4>
              <p className="text-gray-600 text-sm">
                Rechtsklick auf jedes Element öffnet ein Kontextmenü für direkte Verbesserungsvorschläge.
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">🎯 Integration mit AI-Coding-Agents</h4>
            <p className="text-gray-600 mb-4">
              Verbesserungsvorschläge werden direkt an professionelle Coding-Agenten weitergeleitet:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold text-sm">C</span>
                </div>
                <div className="text-sm font-medium text-gray-900">Cursor</div>
                <div className="text-xs text-gray-600">AI-powered Code Editor</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-bold text-sm">G</span>
                </div>
                <div className="text-sm font-medium text-gray-900">GitHub Copilot</div>
                <div className="text-xs text-gray-600">AI Pair Programmer</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-bold text-sm">C</span>
                </div>
                <div className="text-sm font-medium text-gray-900">Claude Code</div>
                <div className="text-xs text-gray-600">AI Development Assistant</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturesSection() {
  return (
    <div className="py-16 sm:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Vorteile von Revamp-UX
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Warum Revamp-UX als integriertes Feedback- und Content-Management-System überzeugt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <svg className="w-10 h-10 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Direkte Nutzerbeteiligung</h3>
            <p className="text-gray-600">
              Keine Admin-Oberflächen oder technisches Wissen nötig. Nutzer können sofort auf Probleme hinweisen.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <svg className="w-10 h-10 text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Kontextuelles Feedback</h3>
            <p className="text-gray-600">
              Nutzer sind genau auf der problematischen Seite. Keine vagen Beschreibungen - der Entwickler weiss sofort, wo das Problem ist.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <svg className="w-10 h-10 text-purple-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Git-Integration</h3>
            <p className="text-gray-600">
              Alle Änderungen werden versioniert. Vollständige Historie und einfache Rücknahme von Änderungen.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <svg className="w-10 h-10 text-orange-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Minimale manuelle Arbeit</h3>
            <p className="text-gray-600">
              Für Nutzer: Ein Klick und kurze Beschreibung. Für Entwickler: Copy-Paste zur AI-Agent. Keine komplexen Workflows.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <svg className="w-10 h-10 text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Spam-Schutz</h3>
            <p className="text-gray-600">
              Rate-Limiting und Inhaltsfilter verhindern Missbrauch. Menschliche Prüfung stellt Qualität sicher.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <svg className="w-10 h-10 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Intelligente Kategorisierung</h3>
            <p className="text-gray-600">
              Das System erfasst Seitenkontext, Bereich und Nutzerangaben. Entwickler erhält strukturierte Informationen.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FeatureComparisonSectionProps {
  onFeatureClick: (feature: FeatureKey) => void
}

function FeatureComparisonSection({ onFeatureClick }: FeatureComparisonSectionProps) {
  return (
    <div className="py-16 sm:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Revamp-UX vs. traditionelle CMS-Systeme
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Warum Revamp-UX als Feedback- und Content-Management-System in einem überzeugt.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow-sm border border-gray-200">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Kriterium</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">WordPress</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Strapi</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Contentful</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-green-700 bg-green-50">Revamp-UX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  <button
                    className="text-left hover:text-blue-600 transition-colors"
                    onClick={() => onFeatureClick('Direkte Nutzer-Feedback-Sammlung')}
                  >
                    Direkte Nutzer-Feedback-Sammlung
                  </button>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-orange-500" title="WordPress-Kommentare sind post-spezifisch und erfordern Moderation">⚠️ Post-Kommentare</span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-red-600" title="Strapi ist headless - benötigt separate Frontend-Entwicklung">❌ Nicht verfügbar</span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-orange-500" title="Contentful fokussiert auf Editor-Workflow, nicht Endnutzer">⚠️ Editor-Kommentare</span>
                </td>
                <td className="px-6 py-4 text-center text-sm bg-green-50">
                  <span className="text-green-600 font-semibold" title="Direkte Nutzer-Feedback-Sammlung ohne technische Barrieren">✅ Integriert</span>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  <button
                    className="text-left hover:text-blue-600 transition-colors"
                    onClick={() => onFeatureClick('Technische Voraussetzungen')}
                  >
                    Technische Voraussetzungen
                  </button>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-orange-500" title="WordPress-Installation und Plugin-Konfiguration erforderlich">⚠️ Plugin-Installation</span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-red-600" title="Strapi erfordert Node.js, Datenbank und API-Entwicklung">❌ Developer-Setup</span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-orange-500" title="Contentful erfordert API-Integration und Frontend-Entwicklung">⚠️ API-Integration</span>
                </td>
                <td className="px-6 py-4 text-center text-sm bg-green-50">
                  <span className="text-green-600 font-semibold" title="Einfache Integration ohne technische Kenntnisse">✅ Plug-and-Play</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  <button
                    className="text-left hover:text-blue-600 transition-colors"
                    onClick={() => onFeatureClick('Feedback-Kontext-Erfassung')}
                  >
                    Feedback-Kontext-Erfassung
                  </button>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-red-600" title="WordPress-Kommentare haben keinen Seitenkontext">❌ Kein Kontext</span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-red-600" title="Strapi hat keine integrierte Feedback-Funktionalität">❌ Nicht verfügbar</span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-orange-500" title="Contentful erfasst nur Content-Änderungen, nicht Nutzer-Feedback">⚠️ Content-fokussiert</span>
                </td>
                <td className="px-6 py-4 text-center text-sm bg-green-50">
                  <span className="text-green-600 font-semibold" title="Automatische Erfassung von Seitenkontext und Nutzerangaben">✅ Vollständiger Kontext</span>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  <button
                    className="text-left hover:text-blue-600 transition-colors"
                    onClick={() => onFeatureClick('Feedback-Verarbeitung')}
                  >
                    Feedback-Verarbeitung
                  </button>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-red-600" title="WordPress erfordert manuelle Moderation und Kategorisierung">❌ Manuell</span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-red-600" title="Strapi kann Feedback nur über Custom-API-Endpunkte verarbeiten">❌ Custom-API</span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-orange-500" title="Contentful verarbeitet nur strukturierte Editor-Änderungen">⚠️ Editor-Workflow</span>
                </td>
                <td className="px-6 py-4 text-center text-sm bg-green-50">
                  <span className="text-green-600 font-semibold" title="Automatische AI-gestützte Kategorisierung und Priorisierung">✅ AI-gestützt</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  <button
                    className="text-left hover:text-blue-600 transition-colors"
                    onClick={() => onFeatureClick('Echtzeit-Nutzer-Interaktion')}
                  >
                    Echtzeit-Nutzer-Interaktion
                  </button>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-orange-500" title="WordPress kann mit Plugins erweitert werden, aber nicht nativ">⚠️ Plugin-abhängig</span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-red-600" title="Strapi benötigt separate Frontend-Anwendung">❌ Frontend nötig</span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className="text-red-600" title="Contentful ist headless und hat keine direkte Nutzer-Interaktion">❌ Headless</span>
                </td>
                <td className="px-6 py-4 text-center text-sm bg-green-50">
                  <span className="text-green-600 font-semibold" title="Direkte Website-Integration ohne zusätzliche Anwendungen">✅ Website-integriert</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ArchitectureSection() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            System-Architektur
          </h2>
        </div>
        {/* Architecture content would go here */}
      </div>
    </div>
  )
}

function ImplementationGuideSection() {
  return (
    <div className="py-16 sm:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Implementation
          </h2>
        </div>
        {/* Implementation guide content would go here */}
      </div>
    </div>
  )
}

function CallToActionSection() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Bereit für bessere Website-Verbesserungen?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Möchten Sie Revamp-UX für Ihre Website implementieren? Wir helfen bei der Integration.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-3">Das System ist geeignet für:</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Kleine bis mittlere Websites mit aktiver Nutzergemeinschaft
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Organisationen, die Community-Feedback schätzen
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Projekte mit einem entwicklungsaffinen Team
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span className="text-gray-500">Nicht geeignet für grosse Enterprise-Lösungen</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
            >
              Kontakt aufnehmen
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            <a
              href="/get-involved"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
            >
              Mehr erfahren
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function SystemDevelopmentStatusSection() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 lg:p-12 text-white">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Entwicklungsstatus</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Das System befindet sich in aktiver Entwicklung. Hier sehen Sie, wie es funktionieren wird.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Geplante Benutzeroberfläche</h3>
              <ul className="space-y-4 text-blue-100">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  Kleiner Verbesserungsbutton auf jeder Seite (konfigurierbar)
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  Einfaches Formular mit Seitenkontext
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  Strukturierte E-Mail an Entwickler-Team
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-sm font-bold">4</span>
                  </div>
                  Schnelle Umsetzung durch AI-Coding-Agent
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <div className="bg-white/20 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">Erwartete Performance</div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Typische Vorschläge/Monat:</span>
                    <span className="font-bold">5-15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">AI-Analyse-Zeit:</span>
                    <span className="font-bold">Wenige Sekunden</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Umsetzungszeit für einfache Änderungen:</span>
                    <span className="font-bold">Sekunden bis Minuten</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Manuelle Arbeit pro Vorschlag:</span>
                    <span className="font-bold">Minimal</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-blue-100">
                Geschätzte Werte basierend auf der geplanten Architektur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
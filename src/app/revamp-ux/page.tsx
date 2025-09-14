'use client'

import { useState } from 'react'
import { ArrowRight, Brain, Users, Zap, GitBranch, CheckCircle, AlertTriangle, Clock, Sparkles } from 'lucide-react'
import Link from 'next/link'

type FeatureKey = 'Direkte Nutzer-Feedback-Sammlung' | 'Technische Voraussetzungen' | 'Feedback-Kontext-Erfassung' | 'Feedback-Verarbeitung' | 'Echtzeit-Nutzer-Interaktion'

export default function RevampUXPage() {
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey | null>(null)

  const handleFeatureClick = (feature: FeatureKey) => {
    setSelectedFeature(feature)
  }

  const handleClosePanel = () => {
    setSelectedFeature(null)
  }

  const featureDetails: Record<FeatureKey, { wordpress: string; strapi: string; contentful: string; revamp: string }> = {
    'Direkte Nutzer-Feedback-Sammlung': {
      wordpress: 'WordPress bietet Kommentare nur für Blog-Posts. Für allgemeines Website-Feedback sind separate Plugins wie Contact Form 7 nötig. Nutzer müssen zuerst das richtige Formular finden.',
      strapi: 'Strapi ist ein Headless CMS ohne Frontend. Feedback-Sammlung erfordert separate Frontend-Entwicklung und API-Integration. Nicht für Endnutzer gedacht.',
      contentful: 'Contentful fokussiert auf Content-Erstellung und hat Kommentare nur für den Editor-Workflow. Keine direkte Nutzer-Feedback-Sammlung.',
      revamp: 'Revamp-UX integriert Feedback-Sammlung direkt in jede Website-Seite. Ein Klick genügt - keine Suche nach Kontaktformularen.'
    },
    'Technische Voraussetzungen': {
      wordpress: 'WordPress-Installation, Hosting, Theme-Setup und Plugin-Konfiguration erforderlich. Regelmäßige Updates und Sicherheit nötig.',
      strapi: 'Erfordert Node.js, Datenbank-Setup, API-Entwicklung und separates Frontend. Hohe technische Kompetenz für Deployment und Wartung.',
      contentful: 'Benötigt API-Schlüssel, Frontend-Framework und Hosting. Content-Modelle müssen definiert werden. Mittel bis fortgeschrittene Kenntnisse.',
      revamp: 'Einfache Integration durch Script-Tag oder NPM-Paket. Keine Server-Setup, Datenbank oder API-Konfiguration nötig.'
    },
    'Feedback-Kontext-Erfassung': {
      wordpress: 'Kommentare sind post-spezifisch, haben aber keinen Kontext über die genaue Stelle oder Nutzer-Interaktion.',
      strapi: 'Keine integrierte Feedback-Funktionalität. Kontext müsste manuell über Custom-Felder erfasst werden.',
      contentful: 'Erfasst nur Content-Änderungen im Editor-Workflow. Keine Erfassung von Nutzer-Verhalten oder Seitenkontext.',
      revamp: 'Automatisch erfasst: Seiten-URL, Element-Position, Nutzer-Browser, Zeitstempel und Nutzerangaben für vollständigen Kontext.'
    },
    'Feedback-Verarbeitung': {
      wordpress: 'Manuelle Moderation, Kategorisierung und Weiterleitung an zuständige Personen. Keine automatische Priorisierung.',
      strapi: 'Feedback muss über Custom-API-Endpunkte verarbeitet werden. Keine integrierte Moderation oder Kategorisierung.',
      contentful: 'Verarbeitet nur strukturierte Editor-Änderungen. Keine Verarbeitung von freiem Nutzer-Feedback.',
      revamp: 'AI-gestützte automatische Kategorisierung, Priorisierung und strukturierte Weiterleitung an Entwickler mit Lösungsvorschlägen.'
    },
    'Echtzeit-Nutzer-Interaktion': {
      wordpress: 'Grundlegende Kommentare möglich, aber für komplexe Interaktionen sind zusätzliche Plugins nötig.',
      strapi: 'Benötigt separate Frontend-Anwendung für jegliche Nutzer-Interaktion. Keine direkte Website-Integration.',
      contentful: 'Headless-Architektur erfordert separate Frontend-Entwicklung. Keine direkte Nutzer-Interaktion möglich.',
      revamp: 'Direkte Integration in jede Website. Nutzer können sofort Feedback geben, ohne die Seite zu verlassen.'
    }
  }

  return (
    <div className="bg-white">
      {/* Feature Detail Modal - Sliding Panel */}
      {selectedFeature && (
        <>
          {/* Clickable Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleClosePanel}
          />

          {/* Sliding Panel */}
          <div className="fixed top-0 left-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform translate-x-0 transition-transform duration-300 ease-in-out">
            {/* Close Arrow Button */}
            <button
              onClick={handleClosePanel}
              className="absolute top-6 right-6 w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 z-10"
              aria-label="Panel schließen"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Panel Content */}
            <div className="h-full overflow-y-auto pt-20 pb-6">
              <div className="px-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{selectedFeature}</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-orange-600 mb-2">WordPress</h4>
                    <p className="text-gray-600 text-sm">{featureDetails[selectedFeature]?.wordpress}</p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold text-red-600 mb-2">Strapi</h4>
                    <p className="text-gray-600 text-sm">{featureDetails[selectedFeature]?.strapi}</p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-orange-600 mb-2">Contentful</h4>
                    <p className="text-gray-600 text-sm">{featureDetails[selectedFeature]?.contentful}</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded">
                    <h4 className="font-semibold text-green-600 mb-2">Revamp-UX</h4>
                    <p className="text-gray-600 text-sm">{featureDetails[selectedFeature]?.revamp}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="mx-auto max-w-4xl py-24 sm:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Revamp-UX</span> System
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-600 max-w-2xl mx-auto">
              Das integrierte Feedback- und Content-Management-System. Nutzer geben kontextuelles Feedback, Entwickler erhalten strukturierte Informationen für schnelle Verbesserungen.
            </p>
            
            <div className="mt-8 bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <p className="text-sm font-medium text-gray-900 mb-2">🔧 In Entwicklung</p>
              <p className="text-sm text-gray-600">
                Dieses System wird entwickelt, um Website-Verbesserungen zu vereinfachen. Hier sehen Sie das Konzept.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="py-16 sm:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Probleme herkömmlicher CMS-Systeme
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              WordPress, Strapi und andere CMS haben einen grundlegenden Schwachpunkt: Die Nutzer sind von der Content-Verbesserung abgeschnitten.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Technische Barrieren</h3>
              <p className="text-gray-600">
                WordPress erfordert Admin-Zugang für einfache Änderungen. Strapi braucht technisches Wissen für Content-Types. Nutzer können nicht direkt helfen.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <Clock className="w-12 h-12 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Langsame Feedback-Schleifen</h3>
              <p className="text-gray-600">
                Nutzer bemerken Tippfehler, defekte Links oder unklare Inhalte - müssen aber umständlich Kontakt aufnehmen. Viele Probleme werden nie gemeldet.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <Users className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Verpasste Chancen</h3>
              <p className="text-gray-600">
                Community-Wissen geht verloren. Nutzer haben wertvolle Verbesserungsideen, aber keinen direkten Kanal zur Übermittlung.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
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
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-center mb-3">1. Vorschlag</h3>
                <p className="text-sm text-gray-700 text-center">
                  Nutzer oder Team-Mitglied schlägt Verbesserung vor. Wenige Sekunden Aufwand.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-center mb-3">2. AI-Analyse</h3>
                <p className="text-sm text-gray-700 text-center">
                  AI vergleicht Vorschlag mit Codebase und erstellt technische Bewertung. Vollautomatisch.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-center mb-3">3. Strukturierte Info</h3>
                <p className="text-sm text-gray-700 text-center">
                  Entwickler erhält sofort strukturierte Informationen zur Entscheidungsfindung.
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-center mb-3">4. Umsetzung</h3>
                <p className="text-sm text-gray-700 text-center">
                  Copy-Paste zur AI-Coding-Agent. Änderungen in Sekunden bis Minuten.
                </p>
              </div>

              {/* Step 5 */}
              <div className="relative bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <GitBranch className="w-6 h-6 text-white" />
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
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Für Nutzer</h4>
                <p className="text-gray-600">
                  Ein Klick, kurze Beschreibung. Kein technisches Wissen oder Registrierung nötig.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Für Entwickler</h4>
                <p className="text-gray-600">
                  Strukturierte Informationen statt vager Beschreibungen. Schnelle Entscheidungsfindung.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-purple-600" />
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

      {/* Access Control */}
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
                <Users className="w-6 h-6 text-white" />
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
                <CheckCircle className="w-6 h-6 text-white" />
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
                <Brain className="w-6 h-6 text-white" />
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

      {/* Features */}
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
              <Users className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Direkte Nutzerbeteiligung</h3>
              <p className="text-gray-600">
                Keine Admin-Oberflächen oder technisches Wissen nötig. Nutzer können sofort auf Probleme hinweisen.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <CheckCircle className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Kontextuelles Feedback</h3>
              <p className="text-gray-600">
                Nutzer sind genau auf der problematischen Seite. Keine vagen Beschreibungen - der Entwickler weiss sofort, wo das Problem ist.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <GitBranch className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Git-Integration</h3>
              <p className="text-gray-600">
                Alle Änderungen werden versioniert. Vollständige Historie und einfache Rücknahme von Änderungen.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <Zap className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Minimale manuelle Arbeit</h3>
              <p className="text-gray-600">
                Für Nutzer: Ein Klick und kurze Beschreibung. Für Entwickler: Copy-Paste zur AI-Agent. Keine komplexen Workflows.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <AlertTriangle className="w-10 h-10 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Spam-Schutz</h3>
              <p className="text-gray-600">
                Rate-Limiting und Inhaltsfilter verhindern Missbrauch. Menschliche Prüfung stellt Qualität sicher.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <Brain className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Intelligente Kategorisierung</h3>
              <p className="text-gray-600">
                Das System erfasst Seitenkontext, Bereich und Nutzerangaben. Entwickler erhält strukturierte Informationen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Common Suggestion Types - Collapsible */}
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="mx-auto max-w-2xl text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
                  Was schlagen Nutzer vor?
                </h2>
                <p className="text-lg leading-8 text-gray-600 mb-4">
                  Realitätscheck: Die häufigsten Verbesserungsvorschläge basieren auf praktischer Erfahrung.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-white rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <span>Beispiele anzeigen</span>
                  <svg className="w-4 h-4 ml-2 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </summary>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="text-green-600 font-semibold mb-2">40% - Inhalts-Korrekturen</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Tippfehler in Zeile 3"</li>
                <li>• "Telefonnummer ist veraltet"</li>
                <li>• "Link funktioniert nicht"</li>
                <li>• "Preis hat sich geändert"</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="text-blue-600 font-semibold mb-2">25% - UX-Probleme</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Button zu klein auf Mobile"</li>
                <li>• "Navigation verwirrend"</li>
                <li>• "Text schwer lesbar"</li>
                <li>• "Seite lädt langsam"</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="text-purple-600 font-semibold mb-2">20% - Fehlende Infos</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Voraussetzungen für Kurs?"</li>
                <li>• "Wie lange dauert es?"</li>
                <li>• "Sind Kurse auch remote?"</li>
                <li>• "Was kostet Beratung?"</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="text-orange-600 font-semibold mb-2">10% - Technische Bugs</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Formular funktioniert nicht"</li>
                <li>• "Layout kaputt in Safari"</li>
                <li>• "Zurück-Button defekt"</li>
                <li>• "Bilder laden nicht"</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="text-red-600 font-semibold mb-2">5% - Feature-Requests</div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Suchfunktion hinzufügen"</li>
                <li>• "Newsletter-Anmeldung"</li>
                <li>• "Buchungskalender"</li>
                <li>• "Live-Chat"</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold mb-2 inline-block">
                Bonus: Accessibility
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Alt-Text für Bilder"</li>
                <li>• "Kontrast zu schwach"</li>
                <li>• "Keyboard-Navigation"</li>
                <li>• "Screen-Reader Probleme"</li>
              </ul>
            </div>
          </div>
          </details>
        </div>
      </div>

      {/* CMS Comparison - Collapsible */}
      <div className="py-16 sm:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="mx-auto max-w-2xl text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
                  Revamp-UX vs. traditionelle CMS-Systeme
                </h2>
                <p className="text-lg leading-8 text-gray-600 mb-4">
                  Warum Revamp-UX als Feedback- und Content-Management-System in einem überzeugt.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-white rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <span>Details anzeigen</span>
                  <svg className="w-4 h-4 ml-2 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </summary>

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
                        onClick={() => handleFeatureClick('Direkte Nutzer-Feedback-Sammlung')}
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
                        onClick={() => handleFeatureClick('Technische Voraussetzungen')}
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
                        onClick={() => handleFeatureClick('Feedback-Kontext-Erfassung')}
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
                        onClick={() => handleFeatureClick('Feedback-Verarbeitung')}
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
                        onClick={() => handleFeatureClick('Echtzeit-Nutzer-Interaktion')}
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
          </details>
        </div>
      </div>

      {/* CMS Limitations & Feedback Value - Collapsible */}
      <div className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="mx-auto max-w-2xl text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
                  Warum traditionelle CMS für Feedback ungeeignet sind
                </h2>
                <p className="text-lg leading-8 text-gray-600 mb-4">
                  WordPress, Strapi und Contentful sind für Content-Management optimiert, nicht für strukturiertes Nutzer-Feedback.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-white rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <span>Analyse anzeigen</span>
                  <svg className="w-4 h-4 ml-2 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </summary>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="bg-gray-50 p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Probleme mit WordPress</h3>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">•</span>
                  <div>
                    <strong>Technische Barrieren:</strong> Nutzer brauchen Admin-Zugang oder komplexe Kontaktformulare
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">•</span>
                  <div>
                    <strong>Unstrukturierte Daten:</strong> Feedback landet in Kommentaren oder E-Mails, nicht kategorisiert
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">•</span>
                  <div>
                    <strong>Keine Kontext-Erfassung:</strong> Welche Seite? Welcher Bereich? Fehlende Metadaten
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">•</span>
                  <div>
                    <strong>Langsame Bearbeitung:</strong> Feedback geht in Warteschlange, keine Priorisierung
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Probleme mit Strapi & Contentful</h3>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">•</span>
                  <div>
                    <strong>Entwickler-zentriert:</strong> Nur technisch versierte Personen können Content bearbeiten
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">•</span>
                  <div>
                    <strong>Kein direkter Feedback-Kanal:</strong> Nutzer müssen externe Tools verwenden
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">•</span>
                  <div>
                    <strong>Hoher Setup-Aufwand:</strong> Benötigt zusätzliche Tools für Nutzer-Feedback
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1">•</span>
                  <div>
                    <strong>Fragmentierte Workflows:</strong> Feedback-Management ist vom CMS getrennt
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Value for Open Source vs Proprietary */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-3xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Unverzichtbar für Open Source & Proprietäre Entwicklung</h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Strukturierte Nutzer-Feedback-Systeme sind für beide Entwicklungsarten essenziell.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-600 font-bold">OS</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Open Source Projekte</h4>
                </div>
                <ul className="text-gray-600 space-y-2">
                  <li>• <strong>Community-Einbindung:</strong> Nutzer werden zu aktiven Mitwirkenden</li>
                  <li>• <strong>Rapide Iteration:</strong> Schnelles Feedback zu neuen Features</li>
                  <li>• <strong>Qualitätssicherung:</strong> Community findet Bugs und UX-Probleme</li>
                  <li>• <strong>Dokumentation:</strong> Nutzer helfen bei Verbesserung der Dokumentation</li>
                  <li>• <strong>Markenbindung:</strong> Community fühlt sich gehört und wertgeschätzt</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold">P</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Proprietäre Entwicklung</h4>
                </div>
                <ul className="text-gray-600 space-y-2">
                  <li>• <strong>Kunden-Feedback:</strong> Direkter Kanal zu zahlenden Kunden</li>
                  <li>• <strong>Produkt-Verbesserung:</strong> Datengetriebene Entscheidungen</li>
                  <li>• <strong>Support-Reduzierung:</strong> Nutzer können selbst Issues melden</li>
                  <li>• <strong>Time-to-Market:</strong> Schnellere Iteration durch strukturiertes Feedback</li>
                  <li>• <strong>Kundenbindung:</strong> Zeigt Engagement für Nutzerbedürfnisse</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 bg-white/80 backdrop-blur rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Der gemeinsame Nenner</h4>
              <p className="text-gray-600">
                Beide Entwicklungsarten profitieren von strukturierten Feedback-Systemen, die den Kommunikationsoverhead minimieren
                und gleichzeitig die Qualität der Eingaben maximieren. Traditionelle CMS-Systeme sind dafür nicht ausgelegt,
                da sie primär für Content-Management entwickelt wurden, nicht für systematische Nutzer-Interaktion.
              </p>
            </div>
          </div>
          </details>
        </div>
      </div>

      {/* System Development Status */}
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

      {/* Call to Action */}
      <div className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-2xl text-center px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6">
            Interesse an Revamp-UX?
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
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
            >
              Kontakt aufnehmen
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            
            <Link
              href="/get-involved"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
            >
              Mehr erfahren
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
import { Metadata } from 'next'
import { ArrowRight, Brain, Users, Zap, GitBranch, CheckCircle, AlertTriangle, Clock, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'

export const metadata: Metadata = {
  title: 'Kontextuelle Website-Verbesserungen | RevampIT',
  description: 'Unser Verbesserungssystem ermöglicht es Nutzern, direkt auf jeder Seite Feedback zu geben. Eine moderne Alternative zu herkömmlichen Content-Management-Systemen.',
  keywords: ['Website Feedback', 'Content Management', 'User Feedback', 'Website Verbesserung', 'Community-driven Development'],
}

export default function AICMSPage() {
  return (
    <div className="bg-white">
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
            
            <h1 className={cn('text-4xl font-bold tracking-tight sm:text-6xl', getTextColor('white', 'primary'))}>
              Kontextuelle <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-info-600">Website-Verbesserungen</span>
            </h1>
            <p className={cn('mt-6 text-xl leading-8 max-w-2xl mx-auto', getTextColor('white', 'muted'))}>
              Nutzer können direkt auf jeder Seite Verbesserungsvorschläge machen. Entwickler erhalten kontextuelles Feedback und können gezielt Probleme beheben.
            </p>
            
            <div className="mt-8 bg-white/90 backdrop-blur rounded-2xl p-4 sm:p-6 border-2 border-neutral-200 shadow-sm">
              <p className={cn('text-sm font-medium mb-2', getTextColor('white', 'primary'))}>🔧 In Entwicklung</p>
              <p className={cn('text-sm', getTextColor('white', 'muted'))}>
                Dieses System wird entwickelt, um Website-Verbesserungen zu vereinfachen. Hier sehen Sie das Konzept.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="py-16 sm:py-24 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('neutral', 'primary'))}>
              Probleme herkömmlicher CMS-Systeme
            </h2>
            <p className={cn('mt-6 text-lg leading-8', getTextColor('neutral', 'muted'))}>
              WordPress, Strapi und andere CMS haben einen grundlegenden Schwachpunkt: Die Nutzer sind von der Content-Verbesserung abgeschnitten.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
              <AlertTriangle className="w-12 h-12 text-error-500 mb-4" />
              <h3 className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Technische Barrieren</h3>
              <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                WordPress erfordert Admin-Zugang für einfache Änderungen. Strapi braucht technisches Wissen für Content-Types. Nutzer können nicht direkt helfen.
              </p>
            </div>
            
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
              <Clock className="w-12 h-12 text-warning-500 mb-4" />
              <h3 className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Langsame Feedback-Schleifen</h3>
              <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Nutzer bemerken Tippfehler, defekte Links oder unklare Inhalte - müssen aber umständlich Kontakt aufnehmen. Viele Probleme werden nie gemeldet.
              </p>
            </div>
            
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
              <Users className="w-12 h-12 text-info-500 mb-4" />
              <h3 className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Verpasste Chancen</h3>
              <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Community-Wissen geht verloren. Nutzer haben wertvolle Verbesserungsideen, aber keinen direkten Kanal zur Übermittlung.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('white', 'primary'))}>
              Wie unser System tatsächlich funktioniert
            </h2>
            <p className={cn('mt-6 text-lg leading-8', getTextColor('white', 'muted'))}>
              Warum dieses System so schnell und effizient ist: Minimale manuelle Arbeit auf allen Seiten.
            </p>
          </div>

          <div className="relative">
            {/* Workflow Steps */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative">
              {/* Connection Lines */}
              <div className="hidden lg:block absolute top-24 left-1/5 w-4/5 h-0.5 bg-gradient-to-r from-blue-300 via-green-300 via-purple-300 to-orange-300 to-red-300"></div>

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
          <div className="mt-16 bg-gradient-to-r from-info-50 to-success-50 rounded-3xl p-6 sm:p-8 border-2 border-neutral-200">
            <div className="text-center mb-8">
              <h3 className={cn('text-2xl font-bold mb-4', getTextColor('white', 'primary'))}>Warum das System so schnell ist</h3>
              <p className={cn('text-lg max-w-3xl mx-auto', getTextColor('white', 'muted'))}>
                Der wahre Wert liegt in der Effizienz: Minimale manuelle Arbeit für alle Beteiligten.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-info-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-info-600" />
                </div>
                <h4 className={cn('text-lg font-semibold mb-2', getTextColor('white', 'primary'))}>Für Nutzer</h4>
                <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                  Ein Klick, kurze Beschreibung. Kein technisches Wissen oder Registrierung nötig.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-success-600" />
                </div>
                <h4 className={cn('text-lg font-semibold mb-2', getTextColor('white', 'primary'))}>Für Entwickler</h4>
                <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                  Strukturierte Informationen statt vager Beschreibungen. Schnelle Entscheidungsfindung.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-secondary-600" />
                </div>
                <h4 className={cn('text-lg font-semibold mb-2', getTextColor('white', 'primary'))}>Für das Team</h4>
                <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                  Wenige Minuten statt Tage für typische Änderungen. Mehr Zeit für wichtige Features.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Access Control */}
      <div className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('white', 'primary'))}>
              Flexible Zugriffskontrolle
            </h2>
            <p className={cn('mt-6 text-lg leading-8', getTextColor('white', 'muted'))}>
              Nicht alle Websites brauchen unbegrenzte Nutzerbeteiligung. Das System lässt sich an Ihre Bedürfnisse anpassen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-gradient-to-br from-info-50 to-info-100 p-6 sm:p-8 rounded-2xl border-2 border-info-200">
              <div className="w-12 h-12 bg-info-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Öffentlich zugänglich</h3>
              <p className={cn('mb-4 text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Wie auf dieser Website: Jeder Besucher kann Verbesserungen vorschlagen. Ideal für Community-getriebene Projekte.
              </p>
              <ul className={cn('text-sm space-y-1', getTextColor('white', 'muted'))}>
                <li>• Keine Registrierung nötig</li>
                <li>• Rate-Limiting gegen Spam</li>
                <li>• Menschliche Moderation</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-success-50 to-success-100 p-6 sm:p-8 rounded-2xl border-2 border-success-200">
              <div className="w-12 h-12 bg-success-600 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Registrierte Nutzer</h3>
              <p className={cn('mb-4 text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Nur eingeloggte Nutzer können Vorschläge machen. Geeignet für Member- oder Kundenbereiche.
              </p>
              <ul className={cn('text-sm space-y-1', getTextColor('white', 'muted'))}>
                <li>• Account-Verifikation</li>
                <li>• Nutzerhistorie</li>
                <li>• Qualitätsbewertung</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 p-6 sm:p-8 rounded-2xl border-2 border-secondary-200">
              <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Team-Mitglieder</h3>
              <p className={cn('mb-4 text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Nur autorisierte Team-Mitglieder haben Zugriff. Perfekt für interne Verbesserungsprozesse.
              </p>
              <ul className={cn('text-sm space-y-1', getTextColor('white', 'muted'))}>
                <li>• Rollenbasierte Berechtigungen</li>
                <li>• Direkte Team-Kommunikation</li>
                <li>• Schnellere Umsetzung</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 bg-neutral-50 rounded-2xl p-6 sm:p-8 border-2 border-neutral-200">
            <div className="text-center">
              <h3 className={cn('text-xl font-semibold mb-4', getTextColor('neutral', 'primary'))}>Warum Zugriffskontrolle wichtig ist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-left">
                <div>
                  <h4 className={cn('font-medium mb-2', getTextColor('neutral', 'primary'))}>✅ Vorteile der Beschränkung:</h4>
                  <ul className={cn('text-sm space-y-1', getTextColor('neutral', 'muted'))}>
                    <li>• Weniger Spam und irrelevante Vorschläge</li>
                    <li>• Höhere Qualität der Eingaben</li>
                    <li>• Schnellere Bearbeitungszeiten</li>
                    <li>• Bessere Kontrolle über Änderungen</li>
                  </ul>
                </div>
                <div>
                  <h4 className={cn('font-medium mb-2', getTextColor('neutral', 'primary'))}>❌ Nachteile der Beschränkung:</h4>
                  <ul className={cn('text-sm space-y-1', getTextColor('neutral', 'muted'))}>
                    <li>• Höhere Einstiegshürde für Nutzer</li>
                    <li>• Weniger externes Feedback</li>
                    <li>• Zusätzlicher Verwaltungsaufwand</li>
                    <li>• Potenziell verpasste Verbesserungen</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 sm:py-24 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('neutral', 'primary'))}>
              Vorteile des Systems
            </h2>
            <p className={cn('mt-6 text-lg leading-8', getTextColor('neutral', 'muted'))}>
              Warum kontextuelle Verbesserungen besser als herkömmliche CMS-Systeme sind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
              <Users className="w-10 h-10 text-success-600 mb-4" />
              <h3 className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Direkte Nutzerbeteiligung</h3>
              <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Keine Admin-Oberflächen oder technisches Wissen nötig. Nutzer können sofort auf Probleme hinweisen.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
              <CheckCircle className="w-10 h-10 text-info-600 mb-4" />
              <h3 className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Kontextuelles Feedback</h3>
              <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Nutzer sind genau auf der problematischen Seite. Keine vagen Beschreibungen - der Entwickler weiss sofort, wo das Problem ist.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
              <GitBranch className="w-10 h-10 text-secondary-600 mb-4" />
              <h3 className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Git-Integration</h3>
              <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Alle Änderungen werden versioniert. Vollständige Historie und einfache Rücknahme von Änderungen.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
              <Zap className="w-10 h-10 text-warning-600 mb-4" />
              <h3 className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Minimale manuelle Arbeit</h3>
              <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Für Nutzer: Ein Klick und kurze Beschreibung. Für Entwickler: Copy-Paste zur AI-Agent. Keine komplexen Workflows.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
              <AlertTriangle className="w-10 h-10 text-error-600 mb-4" />
              <h3 className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Spam-Schutz</h3>
              <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Rate-Limiting und Inhaltsfilter verhindern Missbrauch. Menschliche Prüfung stellt Qualität sicher.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
              <Brain className="w-10 h-10 text-success-600 mb-4" />
              <h3 className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Intelligente Kategorisierung</h3>
              <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Das System erfasst Seitenkontext, Bereich und Nutzerangaben. Entwickler erhält strukturierte Informationen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Common Suggestion Types */}
      <div className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('white', 'primary'))}>
              Was schlagen Nutzer vor?
            </h2>
            <p className={cn('mt-6 text-lg leading-8', getTextColor('white', 'muted'))}>
              Realitätscheck: Die häufigsten Verbesserungsvorschläge basieren auf unserer Erfahrung mit dem System.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-neutral-200">
              <div className={cn('text-success-600 font-semibold mb-2', 'text-sm sm:text-base')}>40% - Inhalts-Korrekturen</div>
              <ul className={cn('text-sm space-y-1', getTextColor('white', 'muted'))}>
                <li>• "Tippfehler in Zeile 3"</li>
                <li>• "Telefonnummer ist veraltet"</li>
                <li>• "Link funktioniert nicht"</li>
                <li>• "Preis hat sich geändert"</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-neutral-200">
              <div className={cn('text-info-600 font-semibold mb-2', 'text-sm sm:text-base')}>25% - UX-Probleme</div>
              <ul className={cn('text-sm space-y-1', getTextColor('white', 'muted'))}>
                <li>• "Button zu klein auf Mobile"</li>
                <li>• "Navigation verwirrend"</li>
                <li>• "Text schwer lesbar"</li>
                <li>• "Seite lädt langsam"</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-neutral-200">
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
        </div>
      </div>
      
      {/* CMS Comparison */}
      <div className="py-16 sm:py-24 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('neutral', 'primary'))}>
              Vergleich mit anderen CMS-Systemen
            </h2>
            <p className={cn('mt-6 text-lg leading-8', getTextColor('neutral', 'muted'))}>
              Ehrlicher Vergleich: Wo unser Ansatz besser ist - und wo nicht.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-sm border-2 border-neutral-200">
              <thead>
                <tr className="border-b-2 border-neutral-200">
                  <th className={cn('px-4 sm:px-6 py-4 text-left text-sm font-semibold', getTextColor('white', 'primary'))}>Kriterium</th>
                  <th className={cn('px-4 sm:px-6 py-4 text-center text-sm font-semibold', getTextColor('white', 'primary'))}>WordPress</th>
                  <th className={cn('px-4 sm:px-6 py-4 text-center text-sm font-semibold', getTextColor('white', 'primary'))}>Strapi</th>
                  <th className={cn('px-4 sm:px-6 py-4 text-center text-sm font-semibold', getTextColor('white', 'primary'))}>Contentful</th>
                  <th className={cn('px-4 sm:px-6 py-4 text-center text-sm font-semibold', getStatusColors('success').text, getStatusColors('success').bg)}>Unser System</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-neutral-200">
                <tr>
                  <td className={cn('px-4 sm:px-6 py-4 text-sm font-medium', getTextColor('white', 'primary'))}>Nutzer-Feedback</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-warning-500')}>⚠️ Kommentare möglich</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-error-500')}>❌ Nicht integriert</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-warning-500')}>⚠️ Editor-Workflow</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-success-600')}>✅ Kern-Feature</td>
                </tr>
                <tr className="bg-neutral-50">
                  <td className={cn('px-4 sm:px-6 py-4 text-sm font-medium', getTextColor('neutral', 'primary'))}>Technische Kenntnisse</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-warning-500')}>⚠️ Mittel</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-error-500')}>❌ Hoch</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-warning-500')}>⚠️ Mittel</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-success-600')}>✅ Keine</td>
                </tr>
                <tr>
                  <td className={cn('px-4 sm:px-6 py-4 text-sm font-medium', getTextColor('white', 'primary'))}>Content-Flexibilität</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-success-600')}>✅ Sehr hoch</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-success-600')}>✅ Sehr hoch</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-success-600')}>✅ Hoch</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-warning-500')}>⚠️ Fokussiert</td>
                </tr>
                <tr className="bg-neutral-50">
                  <td className={cn('px-4 sm:px-6 py-4 text-sm font-medium', getTextColor('neutral', 'primary'))}>Feedback-System</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-warning-500')}>⚠️ Add-ons nötig</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-error-500')}>❌ Custom-Entwicklung</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-warning-500')}>⚠️ Begrenzt</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-success-600')}>✅ Integriert</td>
                </tr>
                <tr>
                  <td className={cn('px-4 sm:px-6 py-4 text-sm font-medium', getTextColor('white', 'primary'))}>Community-Feedback</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-warning-500')}>⚠️ Umständlich</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-error-500')}>❌ Nicht vorgesehen</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-warning-500')}>⚠️ Komplex</td>
                  <td className={cn('px-4 sm:px-6 py-4 text-center text-sm', 'text-success-600')}>✅ Kern-Feature</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CMS Limitations & Feedback Value */}
      <div className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('white', 'primary'))}>
              Warum CMS-Systeme für Feedback ungeeignet sind
            </h2>
            <p className={cn('mt-6 text-lg leading-8', getTextColor('white', 'muted'))}>
              Traditionelle CMS sind für Content-Management optimiert, nicht für Nutzer-Feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mb-16">
            <div className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border-2 border-neutral-200">
              <h3 className={cn('text-xl font-semibold mb-6', getTextColor('neutral', 'primary'))}>Probleme mit WordPress</h3>
              <ul className={cn('space-y-4', getTextColor('neutral', 'muted'))}>
                <li className="flex items-start">
                  <span className="text-error-500 mr-3 mt-1">•</span>
                  <div className="text-sm sm:text-base">
                    <strong>Technische Barrieren:</strong> Nutzer brauchen Admin-Zugang oder komplexe Kontaktformulare
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-error-500 mr-3 mt-1">•</span>
                  <div className="text-sm sm:text-base">
                    <strong>Unstrukturierte Daten:</strong> Feedback landet in Kommentaren oder E-Mails, nicht kategorisiert
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-error-500 mr-3 mt-1">•</span>
                  <div className="text-sm sm:text-base">
                    <strong>Keine Kontext-Erfassung:</strong> Welche Seite? Welcher Bereich? Fehlende Metadaten
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-error-500 mr-3 mt-1">•</span>
                  <div className="text-sm sm:text-base">
                    <strong>Langsame Bearbeitung:</strong> Feedback geht in Warteschlange, keine Priorisierung
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border-2 border-neutral-200">
              <h3 className={cn('text-xl font-semibold mb-6', getTextColor('neutral', 'primary'))}>Probleme mit Strapi & Contentful</h3>
              <ul className={cn('space-y-4', getTextColor('neutral', 'muted'))}>
                <li className="flex items-start">
                  <span className="text-error-500 mr-3 mt-1">•</span>
                  <div className="text-sm sm:text-base">
                    <strong>Entwickler-zentriert:</strong> Nur technisch versierte Personen können Content bearbeiten
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-error-500 mr-3 mt-1">•</span>
                  <div className="text-sm sm:text-base">
                    <strong>Kein direkter Feedback-Kanal:</strong> Nutzer müssen externe Tools verwenden
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-error-500 mr-3 mt-1">•</span>
                  <div className="text-sm sm:text-base">
                    <strong>Hoher Setup-Aufwand:</strong> Benötigt zusätzliche Tools für Nutzer-Feedback
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-error-500 mr-3 mt-1">•</span>
                  <div className="text-sm sm:text-base">
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
        </div>
      </div>

      {/* System Development Status */}
      <div className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-info-600 to-secondary-500 rounded-3xl p-6 sm:p-8 lg:p-12 text-white border-2 border-neutral-200">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl font-bold mb-4">Entwicklungsstatus</h2>
              <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
                Das System befindet sich in aktiver Entwicklung. Hier sehen Sie, wie es funktionieren wird.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold mb-6">Geplante Benutzeroberfläche</h3>
                <ul className="space-y-4 text-white/90">
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-sm font-bold">1</span>
                    </div>
                    <span className="text-sm sm:text-base">Kleiner Verbesserungsbutton auf jeder Seite (konfigurierbar)</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-sm font-bold">2</span>
                    </div>
                    <span className="text-sm sm:text-base">Einfaches Formular mit Seitenkontext</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-sm font-bold">3</span>
                    </div>
                    <span className="text-sm sm:text-base">Strukturierte E-Mail an Entwickler-Team</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-sm font-bold">4</span>
                    </div>
                    <span className="text-sm sm:text-base">Schnelle Umsetzung durch AI-Coding-Agent</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 sm:p-6 border-2 border-white/20">
                <div className="bg-white/20 rounded-xl p-4 mb-4 border-2 border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-white">Erwartete Performance</div>
                    <div className="w-3 h-3 bg-info-300 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/80">Durchschnittliche Vorschläge/Monat:</span>
                      <span className="font-bold text-white">5-15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">AI-Analyse-Zeit:</span>
                      <span className="font-bold text-white">Sekunden</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Umsetzungszeit für einfache Änderungen:</span>
                      <span className="font-bold text-white">Minuten</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Manuelle Arbeit pro Vorschlag:</span>
                      <span className="font-bold text-white">Minimal</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/90">
                  Geschätzte Werte basierend auf der geplanten Architektur.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-2xl text-center px-4 sm:px-6 lg:px-8">
          <h2 className={cn('text-3xl font-bold tracking-tight sm:text-4xl mb-6', getTextColor('white', 'primary'))}>
            Interesse an unserem System?
          </h2>
          <p className={cn('text-lg mb-8', getTextColor('white', 'muted'))}>
            Möchten Sie ein ähnliches Verbesserungssystem für Ihre Website? Wir helfen bei der Umsetzung.
          </p>
          
          <div className="bg-neutral-50 rounded-xl p-4 sm:p-6 mb-8 text-left max-w-2xl mx-auto border-2 border-neutral-200">
            <h3 className={cn('font-semibold mb-3', getTextColor('neutral', 'primary'))}>Das System ist geeignet für:</h3>
            <ul className={cn('space-y-2', getTextColor('neutral', 'muted'))}>
              <li className="flex items-start">
                <span className="text-success-600 mr-2">•</span>
                Kleine bis mittlere Websites mit aktiver Nutzergemeinschaft
              </li>
              <li className="flex items-start">
                <span className="text-success-600 mr-2">•</span>
                Organisationen, die Community-Feedback schätzen
              </li>
              <li className="flex items-start">
                <span className="text-success-600 mr-2">•</span>
                Projekte mit einem entwicklungsaffinen Team
              </li>
              <li className="flex items-start">
                <span className="text-error-600 mr-2">•</span>
                <span className="text-neutral-500">Nicht geeignet für grosse Enterprise-Lösungen</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className={cn(
                'inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl transition-all shadow-lg min-h-[touch] touch-target',
                'bg-gradient-to-r from-primary-600 to-info-600 hover:from-primary-700 hover:to-info-700',
                'text-white'
              )}
            >
              Kontakt aufnehmen
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            
            <Link
              href="/get-involved"
              className={cn(
                'inline-flex items-center px-6 py-3 border-2 text-base font-medium rounded-xl transition-all min-h-[touch] touch-target',
                'border-neutral-300',
                getTextColor('white', 'primary'),
                'bg-white hover:bg-neutral-50'
              )}
            >
              Mehr erfahren
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
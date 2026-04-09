import { cn } from '@/lib/utils'
import { getTextColor, getStatusColors } from '@/lib/design-system'
import Heading from '@/components/ui/Heading'

export function ComparisonSection() {
  return (
    <>
      {/* CMS Comparison Table */}
      <div className="py-16 sm:py-24 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Heading level={2} className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('neutral', 'primary'))}>
              Vergleich mit anderen CMS-Systemen
            </Heading>
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
                {[
                  { label: 'Nutzer-Feedback', wp: ['warning', 'Kommentare möglich'], strapi: ['error', 'Nicht integriert'], cf: ['warning', 'Editor-Workflow'], ours: ['success', 'Kern-Feature'], bg: 'white' },
                  { label: 'Technische Kenntnisse', wp: ['warning', 'Mittel'], strapi: ['error', 'Hoch'], cf: ['warning', 'Mittel'], ours: ['success', 'Keine'], bg: 'neutral' },
                  { label: 'Content-Flexibilität', wp: ['success', 'Sehr hoch'], strapi: ['success', 'Sehr hoch'], cf: ['success', 'Hoch'], ours: ['warning', 'Fokussiert'], bg: 'white' },
                  { label: 'Feedback-System', wp: ['warning', 'Add-ons nötig'], strapi: ['error', 'Custom-Entwicklung'], cf: ['warning', 'Begrenzt'], ours: ['success', 'Integriert'], bg: 'neutral' },
                  { label: 'Community-Feedback', wp: ['warning', 'Umständlich'], strapi: ['error', 'Nicht vorgesehen'], cf: ['warning', 'Komplex'], ours: ['success', 'Kern-Feature'], bg: 'white' },
                ].map((row) => (
                  <tr key={row.label} className={row.bg === 'neutral' ? 'bg-neutral-50' : ''}>
                    <td className={cn('px-4 sm:px-6 py-4 text-sm font-medium', getTextColor(row.bg as 'white' | 'neutral', 'primary'))}>{row.label}</td>
                    {[row.wp, row.strapi, row.cf, row.ours].map(([level, text], i) => {
                      const icon = level === 'success' ? '\u2705' : level === 'error' ? '\u274C' : '\u26A0\uFE0F'
                      const color = level === 'success' ? 'text-success-600' : level === 'error' ? 'text-error-500' : 'text-warning-500'
                      return (
                        <td key={i} className={cn('px-4 sm:px-6 py-4 text-center text-sm', color)}>
                          {icon} {text}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CMS Limitations & Feedback Value */}
      <div className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Heading level={2} className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('white', 'primary'))}>
              Warum CMS-Systeme für Feedback ungeeignet sind
            </Heading>
            <p className={cn('mt-6 text-lg leading-8', getTextColor('white', 'muted'))}>
              Traditionelle CMS sind für Content-Management optimiert, nicht für Nutzer-Feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mb-16">
            <div className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border-2 border-neutral-200">
              <Heading level={3} className={cn('text-xl font-semibold mb-6', getTextColor('neutral', 'primary'))}>Probleme mit WordPress</Heading>
              <ul className={cn('space-y-4', getTextColor('neutral', 'muted'))}>
                {[
                  ['Technische Barrieren:', 'Nutzer brauchen Admin-Zugang oder komplexe Kontaktformulare'],
                  ['Unstrukturierte Daten:', 'Feedback landet in Kommentaren oder E-Mails, nicht kategorisiert'],
                  ['Keine Kontext-Erfassung:', 'Welche Seite? Welcher Bereich? Fehlende Metadaten'],
                  ['Langsame Bearbeitung:', 'Feedback geht in Warteschlange, keine Priorisierung'],
                ].map(([title, desc]) => (
                  <li key={title} className="flex items-start">
                    <span className="text-error-500 mr-3 mt-1">&bull;</span>
                    <div className="text-sm sm:text-base"><strong>{title}</strong> {desc}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-neutral-50 p-6 sm:p-8 rounded-2xl border-2 border-neutral-200">
              <Heading level={3} className={cn('text-xl font-semibold mb-6', getTextColor('neutral', 'primary'))}>Probleme mit Strapi & Contentful</Heading>
              <ul className={cn('space-y-4', getTextColor('neutral', 'muted'))}>
                {[
                  ['Entwickler-zentriert:', 'Nur technisch versierte Personen können Content bearbeiten'],
                  ['Kein direkter Feedback-Kanal:', 'Nutzer müssen externe Tools verwenden'],
                  ['Hoher Setup-Aufwand:', 'Benötigt zusätzliche Tools für Nutzer-Feedback'],
                  ['Fragmentierte Workflows:', 'Feedback-Management ist vom CMS getrennt'],
                ].map(([title, desc]) => (
                  <li key={title} className="flex items-start">
                    <span className="text-error-500 mr-3 mt-1">&bull;</span>
                    <div className="text-sm sm:text-base"><strong>{title}</strong> {desc}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-3xl p-8">
            <div className="text-center mb-8">
              <Heading level={3} className="text-2xl font-bold text-gray-900 mb-4">Unverzichtbar für Open Source & Proprietäre Entwicklung</Heading>
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
                  <Heading level={4} className="text-lg font-semibold text-gray-900">Open Source Projekte</Heading>
                </div>
                <ul className="text-gray-600 space-y-2">
                  <li><strong>Community-Einbindung:</strong> Nutzer werden zu aktiven Mitwirkenden</li>
                  <li><strong>Rapide Iteration:</strong> Schnelles Feedback zu neuen Features</li>
                  <li><strong>Qualitätssicherung:</strong> Community findet Bugs und UX-Probleme</li>
                  <li><strong>Dokumentation:</strong> Nutzer helfen bei Verbesserung der Dokumentation</li>
                  <li><strong>Markenbindung:</strong> Community fühlt sich gehört und wertgeschätzt</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold">P</span>
                  </div>
                  <Heading level={4} className="text-lg font-semibold text-gray-900">Proprietäre Entwicklung</Heading>
                </div>
                <ul className="text-gray-600 space-y-2">
                  <li><strong>Kunden-Feedback:</strong> Direkter Kanal zu zahlenden Kunden</li>
                  <li><strong>Produkt-Verbesserung:</strong> Datengetriebene Entscheidungen</li>
                  <li><strong>Support-Reduzierung:</strong> Nutzer können selbst Issues melden</li>
                  <li><strong>Time-to-Market:</strong> Schnellere Iteration durch strukturiertes Feedback</li>
                  <li><strong>Kundenbindung:</strong> Zeigt Engagement für Nutzerbedürfnisse</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 bg-white/80 backdrop-blur rounded-xl p-6">
              <Heading level={4} className="text-lg font-semibold text-gray-900 mb-3">Der gemeinsame Nenner</Heading>
              <p className="text-gray-600">
                Beide Entwicklungsarten profitieren von strukturierten Feedback-Systemen, die den Kommunikationsoverhead minimieren
                und gleichzeitig die Qualität der Eingaben maximieren. Traditionelle CMS-Systeme sind dafür nicht ausgelegt,
                da sie primär für Content-Management entwickelt wurden, nicht für systematische Nutzer-Interaktion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

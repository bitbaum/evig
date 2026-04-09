import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'
import Heading from '@/components/ui/Heading'

export function SuggestionTypesSection() {
  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Heading level={2} className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('white', 'primary'))}>
            Was schlagen Nutzer vor?
          </Heading>
          <p className={cn('mt-6 text-lg leading-8', getTextColor('white', 'muted'))}>
            Realitätscheck: Die häufigsten Verbesserungsvorschläge basieren auf unserer Erfahrung mit dem System.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-neutral-200">
            <div className={cn('text-success-600 font-semibold mb-2', 'text-sm sm:text-base')}>40% - Inhalts-Korrekturen</div>
            <ul className={cn('text-sm space-y-1', getTextColor('white', 'muted'))}>
              <li>&quot;Tippfehler in Zeile 3&quot;</li>
              <li>&quot;Telefonnummer ist veraltet&quot;</li>
              <li>&quot;Link funktioniert nicht&quot;</li>
              <li>&quot;Preis hat sich geändert&quot;</li>
            </ul>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-neutral-200">
            <div className={cn('text-info-600 font-semibold mb-2', 'text-sm sm:text-base')}>25% - UX-Probleme</div>
            <ul className={cn('text-sm space-y-1', getTextColor('white', 'muted'))}>
              <li>&quot;Button zu klein auf Mobile&quot;</li>
              <li>&quot;Navigation verwirrend&quot;</li>
              <li>&quot;Text schwer lesbar&quot;</li>
              <li>&quot;Seite lädt langsam&quot;</li>
            </ul>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-neutral-200">
            <div className="text-purple-600 font-semibold mb-2">20% - Fehlende Infos</div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>&quot;Voraussetzungen für Kurs?&quot;</li>
              <li>&quot;Wie lange dauert es?&quot;</li>
              <li>&quot;Sind Kurse auch remote?&quot;</li>
              <li>&quot;Was kostet Beratung?&quot;</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="text-orange-600 font-semibold mb-2">10% - Technische Bugs</div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>&quot;Formular funktioniert nicht&quot;</li>
              <li>&quot;Layout kaputt in Safari&quot;</li>
              <li>&quot;Zurück-Button defekt&quot;</li>
              <li>&quot;Bilder laden nicht&quot;</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="text-red-600 font-semibold mb-2">5% - Feature-Requests</div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>&quot;Suchfunktion hinzufügen&quot;</li>
              <li>&quot;Newsletter-Anmeldung&quot;</li>
              <li>&quot;Buchungskalender&quot;</li>
              <li>&quot;Live-Chat&quot;</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold mb-2 inline-block">
              Bonus: Accessibility
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>&quot;Alt-Text für Bilder&quot;</li>
              <li>&quot;Kontrast zu schwach&quot;</li>
              <li>&quot;Keyboard-Navigation&quot;</li>
              <li>&quot;Screen-Reader Probleme&quot;</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

import { Brain, Users, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'
import Heading from '@/components/ui/Heading'

export function AccessControlSection() {
  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Heading level={2} className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('white', 'primary'))}>
            Flexible Zugriffskontrolle
          </Heading>
          <p className={cn('mt-6 text-lg leading-8', getTextColor('white', 'muted'))}>
            Nicht alle Websites brauchen unbegrenzte Nutzerbeteiligung. Das System lässt sich an Ihre Bedürfnisse anpassen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-gradient-to-br from-info-50 to-info-100 p-6 sm:p-8 rounded-2xl border-2 border-info-200">
            <div className="w-12 h-12 bg-info-600 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <Heading level={3} className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Öffentlich zugänglich</Heading>
            <p className={cn('mb-4 text-sm sm:text-base', getTextColor('white', 'muted'))}>
              Wie auf dieser Website: Jeder Besucher kann Verbesserungen vorschlagen. Ideal für Community-getriebene Projekte.
            </p>
            <ul className={cn('text-sm space-y-1', getTextColor('white', 'muted'))}>
              <li>Keine Registrierung nötig</li>
              <li>Rate-Limiting gegen Spam</li>
              <li>Menschliche Moderation</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-success-50 to-success-100 p-6 sm:p-8 rounded-2xl border-2 border-success-200">
            <div className="w-12 h-12 bg-success-600 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <Heading level={3} className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Registrierte Nutzer</Heading>
            <p className={cn('mb-4 text-sm sm:text-base', getTextColor('white', 'muted'))}>
              Nur eingeloggte Nutzer können Vorschläge machen. Geeignet für Member- oder Kundenbereiche.
            </p>
            <ul className={cn('text-sm space-y-1', getTextColor('white', 'muted'))}>
              <li>Account-Verifikation</li>
              <li>Nutzerhistorie</li>
              <li>Qualitätsbewertung</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 p-6 sm:p-8 rounded-2xl border-2 border-secondary-200">
            <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <Heading level={3} className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Team-Mitglieder</Heading>
            <p className={cn('mb-4 text-sm sm:text-base', getTextColor('white', 'muted'))}>
              Nur autorisierte Team-Mitglieder haben Zugriff. Perfekt für interne Verbesserungsprozesse.
            </p>
            <ul className={cn('text-sm space-y-1', getTextColor('white', 'muted'))}>
              <li>Rollenbasierte Berechtigungen</li>
              <li>Direkte Team-Kommunikation</li>
              <li>Schnellere Umsetzung</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 bg-neutral-50 rounded-2xl p-6 sm:p-8 border-2 border-neutral-200">
          <div className="text-center">
            <Heading level={3} className={cn('text-xl font-semibold mb-4', getTextColor('neutral', 'primary'))}>Warum Zugriffskontrolle wichtig ist</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-left">
              <div>
                <Heading level={4} className={cn('font-medium mb-2', getTextColor('neutral', 'primary'))}>Vorteile der Beschränkung:</Heading>
                <ul className={cn('text-sm space-y-1', getTextColor('neutral', 'muted'))}>
                  <li>Weniger Spam und irrelevante Vorschläge</li>
                  <li>Höhere Qualität der Eingaben</li>
                  <li>Schnellere Bearbeitungszeiten</li>
                  <li>Bessere Kontrolle über Änderungen</li>
                </ul>
              </div>
              <div>
                <Heading level={4} className={cn('font-medium mb-2', getTextColor('neutral', 'primary'))}>Nachteile der Beschränkung:</Heading>
                <ul className={cn('text-sm space-y-1', getTextColor('neutral', 'muted'))}>
                  <li>Höhere Einstiegshürde für Nutzer</li>
                  <li>Weniger externes Feedback</li>
                  <li>Zusätzlicher Verwaltungsaufwand</li>
                  <li>Potenziell verpasste Verbesserungen</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { AlertTriangle, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'
import Heading from '@/components/ui/Heading'

export function ProblemSection() {
  return (
    <div className="py-16 sm:py-24 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Heading level={2} className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('neutral', 'primary'))}>
            Probleme herkömmlicher CMS-Systeme
          </Heading>
          <p className={cn('mt-6 text-lg leading-8', getTextColor('neutral', 'muted'))}>
            WordPress, Strapi und andere CMS haben einen grundlegenden Schwachpunkt: Die Nutzer sind von der Content-Verbesserung abgeschnitten.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
            <AlertTriangle className="w-12 h-12 text-error-500 mb-4" />
            <Heading level={3} className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Technische Barrieren</Heading>
            <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
              WordPress erfordert Admin-Zugang für einfache Änderungen. Strapi braucht technisches Wissen für Content-Types. Nutzer können nicht direkt helfen.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
            <Clock className="w-12 h-12 text-warning-500 mb-4" />
            <Heading level={3} className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Langsame Feedback-Schleifen</Heading>
            <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
              Nutzer bemerken Tippfehler, defekte Links oder unklare Inhalte - müssen aber umständlich Kontakt aufnehmen. Viele Probleme werden nie gemeldet.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
            <Users className="w-12 h-12 text-info-500 mb-4" />
            <Heading level={3} className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Verpasste Chancen</Heading>
            <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
              Community-Wissen geht verloren. Nutzer haben wertvolle Verbesserungsideen, aber keinen direkten Kanal zur Übermittlung.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

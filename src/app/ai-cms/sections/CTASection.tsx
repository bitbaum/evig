import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'

export function CTASection() {
  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-2xl text-center px-4 sm:px-6 lg:px-8">
        <h2 className={cn('text-3xl font-bold tracking-tight sm:text-4xl mb-6', getTextColor('white', 'primary'))}>
          Interesse an unserem System?
        </h2>
        <p className={cn('text-lg mb-8', getTextColor('white', 'muted'))}>
          Möchtest du ein ähnliches Verbesserungssystem für deine Website? Wir helfen bei der Umsetzung.
        </p>

        <div className="bg-neutral-50 rounded-xl p-4 sm:p-6 mb-8 text-left max-w-2xl mx-auto border-2 border-neutral-200">
          <h3 className={cn('font-semibold mb-3', getTextColor('neutral', 'primary'))}>Das System ist geeignet für:</h3>
          <ul className={cn('space-y-2', getTextColor('neutral', 'muted'))}>
            <li className="flex items-start">
              <span className="text-success-600 mr-2">&bull;</span>
              Kleine bis mittlere Websites mit aktiver Nutzergemeinschaft
            </li>
            <li className="flex items-start">
              <span className="text-success-600 mr-2">&bull;</span>
              Organisationen, die Community-Feedback schätzen
            </li>
            <li className="flex items-start">
              <span className="text-success-600 mr-2">&bull;</span>
              Projekte mit einem entwicklungsaffinen Team
            </li>
            <li className="flex items-start">
              <span className="text-error-600 mr-2">&bull;</span>
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
  )
}

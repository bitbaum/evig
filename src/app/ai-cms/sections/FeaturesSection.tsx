import { Brain, Users, CheckCircle, Zap, GitBranch, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'
import Heading from '@/components/ui/Heading'

export function FeaturesSection() {
  return (
    <div className="py-16 sm:py-24 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Heading level={2} className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('neutral', 'primary'))}>
            Vorteile des Systems
          </Heading>
          <p className={cn('mt-6 text-lg leading-8', getTextColor('neutral', 'muted'))}>
            Warum kontextuelle Verbesserungen besser als herkömmliche CMS-Systeme sind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
            <Users className="w-10 h-10 text-success-600 mb-4" />
            <Heading level={3} className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Direkte Nutzerbeteiligung</Heading>
            <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
              Keine Admin-Oberflächen oder technisches Wissen nötig. Nutzer können sofort auf Probleme hinweisen.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
            <CheckCircle className="w-10 h-10 text-info-600 mb-4" />
            <Heading level={3} className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Kontextuelles Feedback</Heading>
            <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
              Nutzer sind genau auf der problematischen Seite. Keine vagen Beschreibungen - der Entwickler weiss sofort, wo das Problem ist.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
            <GitBranch className="w-10 h-10 text-secondary-600 mb-4" />
            <Heading level={3} className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Git-Integration</Heading>
            <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
              Alle Änderungen werden versioniert. Vollständige Historie und einfache Rücknahme von Änderungen.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
            <Zap className="w-10 h-10 text-warning-600 mb-4" />
            <Heading level={3} className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Minimale manuelle Arbeit</Heading>
            <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
              Für Nutzer: Ein Klick und kurze Beschreibung. Für Entwickler: Copy-Paste zur AI-Agent. Keine komplexen Workflows.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
            <AlertTriangle className="w-10 h-10 text-error-600 mb-4" />
            <Heading level={3} className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Spam-Schutz</Heading>
            <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
              Rate-Limiting und Inhaltsfilter verhindern Missbrauch. Menschliche Prüfung stellt Qualität sicher.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-neutral-200">
            <Brain className="w-10 h-10 text-success-600 mb-4" />
            <Heading level={3} className={cn('text-xl font-semibold mb-3', getTextColor('white', 'primary'))}>Intelligente Kategorisierung</Heading>
            <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
              Das System erfasst Seitenkontext, Bereich und Nutzerangaben. Entwickler erhält strukturierte Informationen.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

import { Brain, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'

export function HeroSection() {
  return (
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
            <p className={cn('text-sm font-medium mb-2', getTextColor('white', 'primary'))}>In Entwicklung</p>
            <p className={cn('text-sm', getTextColor('white', 'muted'))}>
              Dieses System wird entwickelt, um Website-Verbesserungen zu vereinfachen. Hier sehen Sie das Konzept.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

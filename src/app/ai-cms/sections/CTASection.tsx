import Link from 'next/link'
import { ORG } from '@/config/org'
import { ROUTES } from '@/config/routes'

export function CTASection() {
  return (
    <section className="py-20 px-4 bg-action">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Machen Sie Ihre Website besser — gemeinsam
        </h2>
        <p className="text-action-text mb-8">
          Registrieren Sie sich kostenlos und helfen Sie mit, {ORG.emailDomain} kontinuierlich zu verbessern.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={ROUTES.public.register}
            className="inline-flex items-center justify-center px-8 py-3 bg-surface-base text-action font-semibold rounded-lg hover:bg-action-muted-muted transition-colors"
          >
            Kostenlos registrieren
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 border border-action text-white font-semibold rounded-lg hover:bg-action transition-colors"
          >
            Kontakt aufnehmen
          </Link>
        </div>
      </div>
    </section>
  )
}

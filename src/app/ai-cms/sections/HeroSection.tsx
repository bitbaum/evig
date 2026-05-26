'use client'

import Link from 'next/link'
import { ROUTES } from '@/config/routes'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-primary-50 to-white dark:from-neutral-950 dark:to-neutral-950 py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <span className="inline-block bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-sm font-medium px-3 py-1 rounded-full mb-6">
          Kontextuelles Feedback-System
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-6">
          Website-Verbesserungen direkt auf der Seite
        </h1>
        <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
          Unser Verbesserungssystem ermöglicht es Nutzern, Feedback direkt auf jeder Seite zu geben —
          ohne E-Mail, ohne Ticket, ohne Umwege. Eine moderne Alternative zu herkömmlichen CMS-Workflows.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button as={Link} href={ROUTES.public.register} variant="primary">
            Jetzt mitmachen
          </Button>
          <Button as={Link} href="#workflow" variant="outline"
          >
            So funktioniert es
          </Button>
        </div>
      </div>
    </section>
  )
}

import { Metadata } from 'next'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Inhalte',
  description: 'Blog-Artikel, Seiten und Medien verwalten.',
}

export default function ContentPage() {
  return (
    <AdminPageWrapper
      title="Inhalte"
      description="Blog-Artikel, Seiten und Medien verwalten"
      icon={FileText}
      iconColor="teal"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href={ROUTES.admin.contentSubmissions}
          className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] hover:border-warning-500 transition-colors relative group"
        >
          <Heading level={3} className="font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-warning-600 dark:group-hover:text-warning-400 transition-colors">Einreichungen</Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Benutzer-Einreichungen prüfen und veröffentlichen
          </p>
          <span className="absolute top-4 right-4 w-2 h-2 bg-warning-500 rounded-full animate-pulse" />
        </Link>

        <Link
          href={ROUTES.admin.contentBlog}
          className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] hover:border-primary-500 transition-colors group"
        >
          <Heading level={3} className="font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Blog-Artikel</Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            News, Tutorials und Ankündigungen
          </p>
        </Link>

        <Link
          href={ROUTES.admin.categories}
          className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] hover:border-primary-500 transition-colors group"
        >
          <Heading level={3} className="font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Kategorien</Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Blog-Kategorien verwalten
          </p>
        </Link>

        <Link
          href={ROUTES.admin.contentPages}
          className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] hover:border-primary-500 transition-colors group"
        >
          <Heading level={3} className="font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Seiten</Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Statische Seiten wie Über uns, Kontakt, etc.
          </p>
        </Link>

        <Link
          href={ROUTES.admin.contentMedia}
          className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] hover:border-primary-500 transition-colors group"
        >
          <Heading level={3} className="font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Medien</Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Bilder, Videos und Dokumente
          </p>
        </Link>
      </div>

      <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-white/[0.06] rounded-xl">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          <strong>In Entwicklung:</strong> Die Inhaltsverwaltung wird mit dem AI-CMS verbunden.
        </p>
      </div>
    </AdminPageWrapper>
  )
}

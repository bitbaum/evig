import { Metadata } from 'next'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import Heading from '@/components/admin/AdminHeading'

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
          href="/admin/content/submissions"
          className="p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-yellow-500 transition-colors relative group"
        >
          <Heading level={3} className="font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">Einreichungen</Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Benutzer-Einreichungen prüfen und veröffentlichen
          </p>
          <span className="absolute top-4 right-4 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        </Link>

        <Link
          href="/admin/content/blog"
          className="p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-teal-500 transition-colors group"
        >
          <Heading level={3} className="font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Blog-Artikel</Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            News, Tutorials und Ankündigungen
          </p>
        </Link>

        <Link
          href="/admin/content/categories"
          className="p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-purple-500 transition-colors group"
        >
          <Heading level={3} className="font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Kategorien</Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Blog-Kategorien verwalten
          </p>
        </Link>

        <Link
          href="/admin/content/pages"
          className="p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-teal-500 transition-colors group"
        >
          <Heading level={3} className="font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Seiten</Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Statische Seiten wie Über uns, Kontakt, etc.
          </p>
        </Link>

        <Link
          href="/admin/content/media"
          className="p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-teal-500 transition-colors group"
        >
          <Heading level={3} className="font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Medien</Heading>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Bilder, Videos und Dokumente
          </p>
        </Link>
      </div>

      <div className="p-6 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-xl">
        <p className="text-sm text-info-700 dark:text-info-300">
          <strong>In Entwicklung:</strong> Die Inhaltsverwaltung wird mit dem AI-CMS verbunden.
        </p>
      </div>
    </AdminPageWrapper>
  )
}

import { Metadata } from 'next'
import { FileText, Plus } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Inhalte | RevampIT Admin',
  description: 'Blog-Artikel, Seiten und Medien verwalten.',
}

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Inhalte
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Blog-Artikel, Seiten und Medien verwalten
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          Neuer Inhalt
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/content/submissions"
          className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-yellow-500 transition-colors relative"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Einreichungen</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Benutzer-Einreichungen prüfen und veröffentlichen
          </p>
          <span className="absolute top-4 right-4 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        </Link>

        <Link
          href="/admin/content/blog"
          className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-teal-500 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Blog-Artikel</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            News, Tutorials und Ankündigungen
          </p>
        </Link>

        <Link
          href="/admin/content/categories"
          className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Kategorien</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Blog-Kategorien verwalten
          </p>
        </Link>

        <Link
          href="/admin/content/pages"
          className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-teal-500 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Seiten</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Statische Seiten wie Über uns, Kontakt, etc.
          </p>
        </Link>

        <Link
          href="/admin/content/media"
          className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-teal-500 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Medien</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bilder, Videos und Dokumente
          </p>
        </Link>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>In Entwicklung:</strong> Die Inhaltsverwaltung wird mit dem AI-CMS verbunden.
        </p>
      </div>
    </div>
  )
}

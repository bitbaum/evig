import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Inhalte',
  description: 'Blog-Artikel, Seiten und Medien verwalten.',
}

export default async function ContentPage() {
  const t = await getTranslations('admin.content')
  return (
    <AdminPageWrapper
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={FileText}
      iconColor="teal"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href={ROUTES.admin.contentSubmissions}
          className="p-6 bg-surface-base rounded-xl border border hover:border-warning-500 transition-colors relative group"
        >
          <Heading level={3} className="font-semibold text-text-primary mb-2 group-hover:text-warning-600 dark:group-hover:text-warning-400 transition-colors">Einreichungen</Heading>
          <p className="text-sm text-text-secondary">
            Benutzer-Einreichungen prüfen und veröffentlichen
          </p>
          <span className="absolute top-4 right-4 w-2 h-2 bg-warning-500 rounded-full animate-pulse" />
        </Link>

        <Link
          href={ROUTES.admin.contentBlog}
          className="p-6 bg-surface-base rounded-xl border border hover:border-action transition-colors group"
        >
          <Heading level={3} className="font-semibold text-text-primary mb-2 group-hover:text-action dark:group-hover:text-action transition-colors">Blog-Artikel</Heading>
          <p className="text-sm text-text-secondary">
            News, Tutorials und Ankündigungen
          </p>
        </Link>

        <Link
          href={ROUTES.admin.categories}
          className="p-6 bg-surface-base rounded-xl border border hover:border-action transition-colors group"
        >
          <Heading level={3} className="font-semibold text-text-primary mb-2 group-hover:text-action dark:group-hover:text-action transition-colors">Kategorien</Heading>
          <p className="text-sm text-text-secondary">
            Blog-Kategorien verwalten
          </p>
        </Link>

        <Link
          href={ROUTES.admin.contentPages}
          className="p-6 bg-surface-base rounded-xl border border hover:border-action transition-colors group"
        >
          <Heading level={3} className="font-semibold text-text-primary mb-2 group-hover:text-action dark:group-hover:text-action transition-colors">Seiten</Heading>
          <p className="text-sm text-text-secondary">
            Statische Seiten wie Über uns, Kontakt, etc.
          </p>
        </Link>

        <Link
          href={ROUTES.admin.contentMedia}
          className="p-6 bg-surface-base rounded-xl border border hover:border-action transition-colors group"
        >
          <Heading level={3} className="font-semibold text-text-primary mb-2 group-hover:text-action dark:group-hover:text-action transition-colors">Medien</Heading>
          <p className="text-sm text-text-secondary">
            Bilder, Videos und Dokumente
          </p>
        </Link>
      </div>

      <div className="p-6 bg-surface-raised border border rounded-xl">
        <p className="text-sm text-text-secondary">
          <strong>In Entwicklung:</strong> Die Inhaltsverwaltung wird mit dem AI-CMS verbunden.
        </p>
      </div>
    </AdminPageWrapper>
  )
}

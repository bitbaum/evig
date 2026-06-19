import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ORG } from '@/config/org'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'projectsMeta' })
  return {
    title: {
      template: `%s | ${ORG.name} ${t('templateSuffix')}`,
      // Bare — the parent [locale] template (`%s | ORG`) appends the brand.
      // Including it here too rendered "… | Revamp-IT | Revamp-IT".
      default: t('layoutTitle'),
    },
    description: t('description'),
  }
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}

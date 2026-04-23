import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ORG } from '@/config/org'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'projects.meta' })
  return {
    title: {
      template: `%s | ${ORG.name} ${t('templateSuffix')}`,
      default: `${t('layoutTitle')} | ${ORG.name}`,
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

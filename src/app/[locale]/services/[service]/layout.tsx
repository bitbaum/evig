import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ORG } from '@/config/org'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.meta' })
  return {
    title: { absolute: `${t('serviceDetailTitle')} | ${ORG.name}` },
    description: t('serviceDetailDesc'),
  }
}

export default function ServiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>{children}</>
  )
} 
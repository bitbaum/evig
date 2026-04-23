import { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'auth.verifyEmail' })
  return { title: t('title') }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { ORG } from '@/config/org'
import BlogSubmissionsClient from './BlogSubmissionsClient'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'dashboard.meta' })
  return {
    title: { absolute: `${t('blogSubmissionsTitle')} | ${ORG.name}` },
    description: t('blogSubmissionsDesc'),
  }
}

export default async function BlogSubmissionsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard/blog-submissions')
  }

  return <BlogSubmissionsClient />
}

// force-dynamic: prevents static pre-rendering which crashes on next-auth v5 beta + webpack
// due to React-null circular dep in SSR bundle during parallel static generation workers.
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ServicesPageClient from './ServicesPageClient'

/**
 * The hub's title used to come from the layout's `title.absolute`, which also
 * killed the brand suffix for every page under /services. The layout no longer
 * sets a title, so the hub declares its own here — like every other page — and
 * the root template appends "| evig" exactly once.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services.meta' })
  return {
    title: t('layoutTitle'),
    description: t('description'),
  }
}

export default ServicesPageClient

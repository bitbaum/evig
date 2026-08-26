// Force runtime rendering — next-auth/react + lucide imports in AbosPageClient land in
// SSR bundles where Next.js 16 + next-auth v5 leave the vendored React module
// null during parallel static generation workers, causing hooks to throw.
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import AbosPageClient from './AbosPageClient'

/**
 * This page had no metadata at all, so the browser tab fell through to the
 * layout's default — "evig — Intelligenz, für alle bezahlbar. | evig", the
 * homepage's own title, with the org name twice. A live product page was
 * indistinguishable from the homepage in a tab, in search, and in a shared
 * link.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'abos' })
  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: { title: t('title'), description: t('subtitle'), type: 'website' },
  }
}

export default function AbosPage() {
  return <AbosPageClient />
}

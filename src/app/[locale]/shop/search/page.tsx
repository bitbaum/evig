import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'

interface LegacyShopSearchRedirectProps {
  searchParams: Promise<{ q?: string }>
}

/** Legacy URL — preserve the search term and land in the canonical marketplace. */
export default async function LegacyShopSearchRedirect({
  searchParams,
}: LegacyShopSearchRedirectProps) {
  const [{ q }, locale] = await Promise.all([searchParams, getLocale()])
  const query = q?.trim()
  redirect({
    href: query ? `/marketplace?search=${encodeURIComponent(query)}` : '/marketplace',
    locale,
  })
}

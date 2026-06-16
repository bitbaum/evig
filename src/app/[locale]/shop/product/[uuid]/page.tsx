import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'

interface LegacyShopProductRedirectProps {
  params: Promise<{ uuid: string }>
}

/** Legacy URL — inventory products now belong in marketplace listings. */
export default async function LegacyShopProductRedirect({
  params,
}: LegacyShopProductRedirectProps) {
  await params
  const locale = await getLocale()
  redirect({ href: '/marketplace', locale })
}

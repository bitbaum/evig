import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { resolveLegacyShopProductHref } from '@/lib/marketplace/resolve-legacy-product'

interface LegacyShopProductRedirectProps {
  params: Promise<{ uuid: string }>
}

/** Legacy URL — resolve inventory UUID to marketplace listing when possible. */
export default async function LegacyShopProductRedirect({
  params,
}: LegacyShopProductRedirectProps) {
  const { uuid } = await params
  const locale = await getLocale()
  const href = await resolveLegacyShopProductHref(uuid)
  redirect({ href, locale })
}

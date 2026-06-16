import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'

/** Legacy URL — the online shop is the marketplace. */
export default async function LegacyShopRedirect() {
  const locale = await getLocale()
  redirect({ href: '/marketplace', locale })
}

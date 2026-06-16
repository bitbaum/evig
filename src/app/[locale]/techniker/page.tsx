import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'

/** Legacy URL — technicians live under the IT-Hilfe hub. */
export default async function LegacyTechnikerRedirect() {
  const locale = await getLocale()
  redirect({ href: '/it-hilfe/techniker', locale })
}

import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'

interface LegacyTechnikerProfileRedirectProps {
  params: Promise<{ id: string }>
}

/** Legacy URL — technician profiles live under /it-hilfe/techniker/[id]. */
export default async function LegacyTechnikerProfileRedirect({
  params,
}: LegacyTechnikerProfileRedirectProps) {
  const [{ id }, locale] = await Promise.all([params, getLocale()])
  redirect({ href: `/it-hilfe/techniker/${id}`, locale })
}

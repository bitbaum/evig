import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'

/**
 * Retired service — repair happens through IT-Hilfe now.
 *
 * This page advertised evig repairing your machine at CHF 70/h. That is not
 * the model: evig is where you FIND a technician, and the technician sets
 * their own price. Keeping both meant two front doors for one job, with the
 * service page quietly contradicting the marketplace.
 *
 * A redirect rather than a 404, because the URL is indexed and the visitor's
 * intent is still served — just by a different surface.
 */
export default async function RetiredRepairService() {
  const locale = await getLocale()
  redirect({ href: '/it-hilfe', locale })
}

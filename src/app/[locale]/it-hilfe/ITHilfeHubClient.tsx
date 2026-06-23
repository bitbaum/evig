'use client'

import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ClipboardList, Search, Users, Wrench } from 'lucide-react'
import { JOURNEY_ENTRYPOINTS } from '@/config/customer-journeys'
import { IT_HILFE } from '@/config/it-hilfe'
import { ROUTES } from '@/config/routes'

/**
 * IT-Hilfe hub — single entry for "fix my computer / reinstall OS / get IT help".
 * Three paths, one product (no duplicate Techniker nav entry).
 */
export default function ITHilfeHubClient() {
  const { data: session } = useSession()
  const t = useTranslations('itHelp.hub')

  const paths = [
    {
      icon: ClipboardList,
      title: t('paths.request.title'),
      description: t('paths.request.description'),
      href: IT_HILFE.routes.create,
      cta: t('paths.request.cta'),
      primary: true,
    },
    {
      icon: Users,
      title: t('paths.technicians.title'),
      description: t('paths.technicians.description'),
      href: ROUTES.public.techniker,
      cta: t('paths.technicians.cta'),
      primary: false,
    },
    {
      icon: Search,
      title: t('paths.browse.title'),
      description: t('paths.browse.description'),
      href: ROUTES.public.itHilfeBrowseRequests,
      cta: t('paths.browse.cta'),
      primary: false,
    },
  ] as const

  return (
    <div className="min-h-screen bg-canvas">
      <section className="border-b border-subtle py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="ui-public-eyebrow">{t('eyebrow')}</div>
            <h1 className="ui-public-display-lg mt-4">{t('title')}</h1>
            <p className="ui-public-section-lede mt-4">{t('subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {paths.map((path) => {
              const Icon = path.icon
              return (
                <Link
                  key={path.href}
                  href={path.href}
                  className={path.primary ? 'ui-public-start-card group border-action/30' : 'ui-public-start-card group'}
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-action-muted">
                    <Icon className="h-5 w-5 text-action" aria-hidden="true" />
                  </div>
                  <h2 className="ui-public-start-card-title group-hover:text-action transition-colors">
                    {path.title}
                  </h2>
                  <p className="ui-public-start-card-body">{path.description}</p>
                  <span className="ui-public-start-card-link mt-4">{path.cta}</span>
                </Link>
              )
            })}
          </div>

          {session?.user && (
            <div className="mt-10 flex flex-wrap gap-3 border-t border-subtle pt-8">
              <Link href={IT_HILFE.routes.my} className="ui-public-cta-ghost inline-flex items-center gap-2">
                {t('account.myRequests')}
              </Link>
              <Link href={IT_HILFE.routes.myOffers} className="ui-public-cta-ghost inline-flex items-center gap-2">
                {t('account.myOffers')}
              </Link>
            </div>
          )}

          <div className="mt-12 rounded-2xl border border-subtle bg-surface-base p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-action" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-text-primary">{t('offerHelp.title')}</h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('offerHelp.description')}</p>
              </div>
              <Link
                href={
                  session?.user
                    ? JOURNEY_ENTRYPOINTS.becomeTechnician
                    : `/auth/login?callbackUrl=${encodeURIComponent(JOURNEY_ENTRYPOINTS.becomeTechnician)}`
                }
                className="ui-public-cta shrink-0 whitespace-nowrap"
              >
                {t('offerHelp.cta')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

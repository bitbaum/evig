// force-dynamic: this page reads a runtime ?token= query param + does a DB
// lookup; static rendering doesn't make sense.
export const dynamic = 'force-dynamic'

import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { itHilfeOffers, itHilfeRequests } from '@/db/schema/itHilfe'
import { users } from '@/db/schema/auth'
import { verifyOfferAcceptToken } from '@/lib/it-hilfe/offer-accept-tokens'
import { OFFER_STATUS, REQUEST_STATUS } from '@/config/it-hilfe'
import { AcceptButton } from './AcceptButton'
import { Link } from '@/i18n/navigation'
import { PageShell } from '@/components/layout/PageShell'
import { AlertCircle, CheckCircle, ArrowRight, Clock, Ban } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface OfferDisplay {
  offer_id: string
  offer_status: string
  offer_message: string
  helper_name: string | null
  request_id: string
  request_title: string
  request_status: string
}

async function fetchOfferDisplay(offerId: string): Promise<OfferDisplay | null> {
  const offTable = getTableName(itHilfeOffers)
  const reqTable = getTableName(itHilfeRequests)
  const uTable = getTableName(users)

  const result = await db.execute(sql`
    SELECT
      o.id AS offer_id,
      o.status AS offer_status,
      o.message AS offer_message,
      uh.name AS helper_name,
      r.id AS request_id,
      r.title AS request_title,
      r.status AS request_status
    FROM ${sql.raw(offTable)} o
    JOIN ${sql.raw(reqTable)} r ON o.request_id = r.id
    JOIN ${sql.raw(uTable)} uh ON o.helper_id = uh.id
    WHERE o.id = ${offerId}
  `)
  if (result.rows.length === 0) return null
  return result.rows[0] as unknown as OfferDisplay
}

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function AcceptOfferTokenPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const sp = await searchParams
  const token = typeof sp.token === 'string' ? sp.token : ''
  const t = await getTranslations({ locale, namespace: 'itHelp.accept' })

  if (!token) {
    return (
      <StateCard
        icon={<Ban className="w-16 h-16 text-error-500" />}
        title={t('linkIncomplete.title')}
        message={t('linkIncomplete.message')}
      />
    )
  }

  const verifyResult = verifyOfferAcceptToken(token)
  if (!verifyResult.ok) {
    if (verifyResult.reason === 'expired') {
      return (
        <StateCard
          icon={<Clock className="w-16 h-16 text-warning-500" />}
          title={t('linkExpired.title')}
          message={t('linkExpired.message')}
          cta={{ href: '/it-hilfe/my', label: t('linkExpired.cta') }}
        />
      )
    }
    return (
      <StateCard
        icon={<Ban className="w-16 h-16 text-error-500" />}
        title={t('linkInvalid.title')}
        message={t('linkInvalid.message')}
        cta={{ href: '/it-hilfe/my', label: t('linkInvalid.cta') }}
      />
    )
  }

  const offerDisplay = await fetchOfferDisplay(verifyResult.offerId)
  if (!offerDisplay) {
    return (
      <StateCard
        icon={<AlertCircle className="w-16 h-16 text-error-500" />}
        title={t('offerNotFound.title')}
        message={t('offerNotFound.message')}
      />
    )
  }

  if (offerDisplay.offer_status !== OFFER_STATUS.PENDING) {
    return (
      <StateCard
        icon={<AlertCircle className="w-16 h-16 text-warning-500" />}
        title={t('alreadyHandled.title')}
        message={t('alreadyHandled.message')}
        cta={{ href: `/it-hilfe/${offerDisplay.request_id}`, label: t('alreadyHandled.cta') }}
      />
    )
  }

  if (offerDisplay.request_status !== REQUEST_STATUS.OPEN) {
    return (
      <StateCard
        icon={<AlertCircle className="w-16 h-16 text-warning-500" />}
        title={t('requestClosed.title')}
        message={t('requestClosed.message')}
        cta={{ href: `/it-hilfe/${offerDisplay.request_id}`, label: t('requestClosed.cta') }}
      />
    )
  }

  // Happy path: render confirmation card with the client-island button.
  return (
    <div className="bg-canvas min-h-screen">
      <PageShell maxWidth="2xl" py="py-12">
        <div className="ui-public-card p-8">
          <div className="flex items-start gap-4 mb-6">
            <CheckCircle className="w-10 h-10 text-action shrink-0" aria-hidden="true" />
            <div>
              <h1 className="ui-public-display-md">Angebot annehmen?</h1>
              <p className="ui-public-meta mt-2">
                Du bist im Begriff, das folgende Angebot anzunehmen. Alle anderen Angebote für diese Anfrage werden dabei automatisch abgelehnt.
              </p>
            </div>
          </div>

          <dl className="space-y-3 mb-6 border-t border-subtle pt-4">
            <div>
              <dt className="ui-public-card-label mb-1">Anfrage</dt>
              <dd className="text-base text-text-primary">{offerDisplay.request_title}</dd>
            </div>
            <div>
              <dt className="ui-public-card-label mb-1">Techniker</dt>
              <dd className="text-base text-text-primary">{offerDisplay.helper_name || 'Unbekannt'}</dd>
            </div>
            <div>
              <dt className="ui-public-card-label mb-1">Nachricht</dt>
              <dd className="text-sm text-text-secondary mt-0.5 whitespace-pre-wrap bg-surface-raised rounded-lg p-3 border-l-2 border-action">
                {offerDisplay.offer_message}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-3">
            <AcceptButton token={token} />
            <Link href={`/it-hilfe/${offerDisplay.request_id}`} className="ui-public-cta-ghost inline-flex items-center">
              Anfrage öffnen
            </Link>
          </div>
        </div>
      </PageShell>
    </div>
  )
}

function StateCard({
  icon,
  title,
  message,
  cta,
}: {
  icon: React.ReactNode
  title: string
  message: string
  cta?: { href: string; label: string }
}) {
  return (
    <div className="bg-canvas min-h-screen">
      <PageShell maxWidth="2xl" py="py-12" className="text-center">
        <div className="ui-public-card p-12">
          <div className="flex justify-center mb-4">{icon}</div>
          <h1 className="ui-public-display-md mb-2">{title}</h1>
          <p className="ui-public-section-lede mx-auto mb-6">{message}</p>
          {cta && (
            <Link href={cta.href} className="ui-public-cta inline-flex items-center gap-2">
              {cta.label}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </PageShell>
    </div>
  )
}

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
import Heading from '@/components/ui/Heading'
import { buttonClass } from '@/components/ui/button-class'
import { AlertCircle, CheckCircle, ArrowRight, Clock, Ban } from 'lucide-react'

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
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function AcceptOfferTokenPage({ searchParams }: PageProps) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : ''

  if (!token) {
    return (
      <StateCard
        icon={<Ban className="w-16 h-16 text-error-500" />}
        title="Link unvollständig"
        message="Dieser Link enthält keinen Token. Bitte öffne den Link aus der E-Mail-Benachrichtigung."
      />
    )
  }

  const verifyResult = verifyOfferAcceptToken(token)
  if (!verifyResult.ok) {
    if (verifyResult.reason === 'expired') {
      return (
        <StateCard
          icon={<Clock className="w-16 h-16 text-warning-500" />}
          title="Link abgelaufen"
          message="Dieser Annahme-Link ist abgelaufen. Bitte melde dich an und akzeptiere das Angebot direkt in der Anfrage."
          cta={{ href: '/it-hilfe/my', label: 'Zu meinen Anfragen' }}
        />
      )
    }
    return (
      <StateCard
        icon={<Ban className="w-16 h-16 text-error-500" />}
        title="Link ungültig"
        message="Dieser Link konnte nicht verifiziert werden. Bitte melde dich an und akzeptiere das Angebot direkt in der Anfrage."
        cta={{ href: '/it-hilfe/my', label: 'Zu meinen Anfragen' }}
      />
    )
  }

  const offerDisplay = await fetchOfferDisplay(verifyResult.offerId)
  if (!offerDisplay) {
    return (
      <StateCard
        icon={<AlertCircle className="w-16 h-16 text-error-500" />}
        title="Angebot nicht gefunden"
        message="Das Angebot existiert nicht mehr."
      />
    )
  }

  if (offerDisplay.offer_status !== OFFER_STATUS.PENDING) {
    return (
      <StateCard
        icon={<AlertCircle className="w-16 h-16 text-warning-500" />}
        title="Bereits bearbeitet"
        message="Dieses Angebot wurde bereits angenommen, abgelehnt oder zurückgezogen."
        cta={{ href: `/it-hilfe/${offerDisplay.request_id}`, label: 'Anfrage öffnen' }}
      />
    )
  }

  if (offerDisplay.request_status !== REQUEST_STATUS.OPEN) {
    return (
      <StateCard
        icon={<AlertCircle className="w-16 h-16 text-warning-500" />}
        title="Anfrage geschlossen"
        message="Diese Anfrage akzeptiert keine Angebote mehr — ein anderes Angebot wurde bereits angenommen, oder die Anfrage wurde abgeschlossen."
        cta={{ href: `/it-hilfe/${offerDisplay.request_id}`, label: 'Anfrage öffnen' }}
      />
    )
  }

  // Happy path: render confirmation card with the client-island button.
  return (
    <PageShell maxWidth="2xl" py="py-12">
      <div className="rounded-2xl border bg-surface-base p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <CheckCircle className="w-10 h-10 text-action flex-shrink-0" aria-hidden="true" />
          <div>
            <Heading level={1} className="text-2xl font-semibold text-text-primary">
              Angebot annehmen?
            </Heading>
            <p className="text-sm text-text-secondary mt-1">
              Du bist im Begriff, das folgende Angebot anzunehmen. Alle anderen Angebote für diese Anfrage werden dabei automatisch abgelehnt.
            </p>
          </div>
        </div>

        <dl className="space-y-3 mb-6 border-t border-subtle pt-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Anfrage</dt>
            <dd className="text-base text-text-primary mt-0.5">{offerDisplay.request_title}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Techniker</dt>
            <dd className="text-base text-text-primary mt-0.5">{offerDisplay.helper_name || 'Unbekannt'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Nachricht</dt>
            <dd className="text-sm text-text-secondary mt-0.5 whitespace-pre-wrap bg-surface-raised rounded-lg p-3 border-l-2 border-primary-500">
              {offerDisplay.offer_message}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-3">
          <AcceptButton token={token} />
          <Link href={`/it-hilfe/${offerDisplay.request_id}`} className={buttonClass({ variant: 'outline' })}>
            Anfrage öffnen
          </Link>
        </div>
      </div>
    </PageShell>
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
    <PageShell maxWidth="2xl" py="py-12" className="text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <Heading level={1} className="text-2xl font-semibold text-text-primary mb-2">
        {title}
      </Heading>
      <p className="text-text-secondary mb-6 max-w-prose mx-auto">{message}</p>
      {cta && (
        <Link href={cta.href} className={buttonClass({ variant: 'primary' })}>
          {cta.label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </PageShell>
  )
}

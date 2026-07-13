/**
 * Public deliverable share page — /d/[token]
 *
 * Reachable without login (unguessable token). Read + comment. Feedback posts
 * to /api/public/share/[token] and notifies the owner's in-app bell.
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { getDeliverableByToken, getFeedback } from '@/lib/services/deliverables'
import { formatDateTimeNumeric } from '@/lib/date-formats'
import { ORG } from '@/config/org'
import {
  DELIVERABLE_TYPE_LABELS,
  FEEDBACK_KIND_LABELS,
  FEEDBACK_KIND_COLORS,
  type DeliverableType,
  type FeedbackKind,
} from '@/config/deliverables'
import DeliverableFiles from '@/components/deliverables/DeliverableFiles'
import DeliverableChat from '@/components/deliverables/DeliverableChat'
import SharedFeedbackForm from './SharedFeedbackForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const deliverable = await getDeliverableByToken(token)
  return {
    title: deliverable ? `${deliverable.title} — ${ORG.name}` : ORG.name,
    // Share links are unlisted — never index them.
    robots: { index: false, follow: false },
  }
}

export default async function SharedDeliverablePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const deliverable = await getDeliverableByToken(token)
  if (!deliverable) notFound()

  const feedback = await getFeedback(deliverable.id)
  const isInternalPreview = deliverable.url?.startsWith('/')

  return (
    <div className="min-h-screen bg-surface-raised">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="mb-6">
          <p className="text-sm text-text-secondary mb-1">
            {DELIVERABLE_TYPE_LABELS[deliverable.type as DeliverableType] ?? deliverable.type}
            {deliverable.owner_name ? ` · von ${deliverable.owner_name}` : ''} · {ORG.name}
          </p>
          <h1 className="text-2xl font-bold text-text-primary">{deliverable.title}</h1>
          {deliverable.description && (
            <p className="text-text-secondary mt-2 whitespace-pre-wrap">{deliverable.description}</p>
          )}
        </header>

        {deliverable.url && (
          <div className="bg-surface-base rounded-lg border overflow-hidden mb-6">
            <div className="flex items-center justify-between px-4 py-2.5 border-b">
              <span className="text-sm font-medium text-text-secondary">Vorschau</span>
              <a
                href={deliverable.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-action hover:underline"
              >
                In neuem Tab öffnen <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {isInternalPreview && (
              <iframe src={deliverable.url} title={deliverable.title} className="w-full h-[560px] bg-surface-base" />
            )}
          </div>
        )}

        <div className="mb-6">
          <DeliverableFiles files={deliverable.files} />
        </div>

        <div className="mb-6">
          <DeliverableChat
            endpoint={`/api/public/share/${token}/ask`}
            suggestions={['Worum geht es hier?', 'Wie wende ich das an?', 'Was macht der Code?']}
          />
        </div>

        <section className="bg-surface-base rounded-lg border p-5">
          <h2 className="font-semibold text-text-primary mb-4">Feedback</h2>

          <SharedFeedbackForm token={token} />

          {feedback.length > 0 && (
            <ul className="space-y-4 mt-6">
              {feedback.map((f) => (
                <li key={f.id} className="border-l-2 border-neutral-200 pl-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FEEDBACK_KIND_COLORS[f.kind as FeedbackKind] ?? ''}`}>
                      {FEEDBACK_KIND_LABELS[f.kind as FeedbackKind] ?? f.kind}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {f.author_name ?? 'Extern'} · {formatDateTimeNumeric(f.created_at)}
                    </span>
                  </div>
                  {f.target && <p className="text-xs text-text-secondary mb-0.5">Betrifft: {f.target}</p>}
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{f.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

/**
 * Public Vote Page
 *
 * Accessible without login — intended for sharing via email, phone, etc.
 * Shows decision context and an email-identified ballot so community members
 * can vote from any device without needing an admin account.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { DECISION_STATUS } from '@/config/decisions'
import { getTranslations } from 'next-intl/server'
import PublicVoteClient from './PublicVoteClient'
import { ORG } from '@/config/org'
import { getPublicDecision } from '@/lib/services/decisions'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const [decision, t] = await Promise.all([
    getPublicDecision(id),
    getTranslations('vote'),
  ])
  return {
    title: decision ? t('metaTitle', { title: decision.title }) : t('metaTitleFallback'),
    description: decision?.description?.slice(0, 160) ?? t('metaDesc'),
  }
}

export default async function PublicVotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [decision, t] = await Promise.all([
    getPublicDecision(id),
    getTranslations('vote'),
  ])

  if (!decision) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">{t('notFound')}</p>
          <p className="text-gray-500 mb-6">
            {t('notFoundDesc')}
          </p>
          <Link href="/" className="text-green-600 hover:underline text-sm">
            {t('backHome')}
          </Link>
        </div>
      </div>
    )
  }

  const isVotingPhase = decision.status === DECISION_STATUS.VOTING

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <span>{ORG.name}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <div className="inline-block rounded-full bg-green-100 text-green-800 text-xs font-medium px-3 py-1 mb-4">
            {isVotingPhase ? t('statusVoting') : t('statusDiscussion')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {decision.title}
          </h1>
        </div>

        {/* Decision context */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('contextHeading')}
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {decision.description}
          </p>

          {decision.background && (
            <details className="mt-4 rounded-lg border border-amber-200 bg-amber-50">
              <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-amber-800 select-none">
                📄 {t('backgroundTitle')}
              </summary>
              <div className="border-t border-amber-200 px-4 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-900">
                  {decision.background}
                </p>
              </div>
            </details>
          )}

          {decision.options.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-gray-500 mb-2">
                {t('optionsCount', { count: decision.options.length })}
              </p>
              <div className="space-y-1.5">
                {decision.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-gray-800">{opt.label}</span>
                    {opt.description && (
                      <span className="ml-2 text-gray-500">— {opt.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Voting form (client component) */}
        <PublicVoteClient
          decisionId={decision.id}
          title={decision.title}
          description={decision.description}
          background={decision.background}
          votingMethod={decision.votingMethod}
          options={decision.options}
          dotCount={decision.dotCount}
          votingDeadline={decision.votingDeadline}
          isVotingPhase={isVotingPhase}
        />

        <p className="mt-6 text-center text-xs text-gray-400">
          {t('footer', { org: ORG.name })}
        </p>
      </div>
    </div>
  )
}

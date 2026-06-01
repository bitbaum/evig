/**
 * Public Vote Page
 *
 * Accessible without login — intended for sharing via email, phone, etc.
 * Shows decision context and an email-identified ballot so community members
 * can vote from any device without needing an admin account.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
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
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">{t('notFound')}</p>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            {t('notFoundDesc')}
          </p>
          <Link href="/" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
            {t('backHome')}
          </Link>
        </div>
      </div>
    )
  }

  const isVotingPhase = decision.status === DECISION_STATUS.VOTING
  const voteCallbackUrl = `/vote/${decision.id}`
  const registerUrl = `/auth/register?callbackUrl=${encodeURIComponent(voteCallbackUrl)}`
  const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(voteCallbackUrl)}`

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 mb-6">
            <span>{ORG.name}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <div className="inline-block rounded-full bg-primary-100 text-primary-800 dark:bg-primary-500/15 dark:text-primary-400 text-xs font-medium px-3 py-1 mb-4">
            {isVotingPhase ? t('statusVoting') : t('statusDiscussion')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white leading-tight">
            {decision.title}
          </h1>
        </div>

        {/* Decision context */}
        <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/[0.06] p-6 mb-6 shadow-sm dark:shadow-none">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
            {t('contextHeading')}
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {decision.description}
          </p>

          {decision.background && (
            <details className="mt-4 rounded-lg border border-warning-200 dark:border-yellow-500/20 bg-warning-50 dark:bg-yellow-500/[0.06]">
              <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-warning-800 dark:text-yellow-300 select-none">
                📄 {t('backgroundTitle')}
              </summary>
              <div className="border-t border-warning-200 dark:border-yellow-500/20 px-4 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-warning-900 dark:text-yellow-200">
                  {decision.background}
                </p>
              </div>
            </details>
          )}

          {decision.options.length > 0 && (() => {
            const hasImages = decision.options.some((o) => o.imageUrl)
            return (
              <div className="mt-5">
                <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                  {t('optionsCount', { count: decision.options.length })}
                </p>
                {hasImages ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {decision.options.map((opt) => (
                      <div key={opt.id} className="rounded-lg border border-neutral-200 dark:border-white/[0.06] bg-neutral-50 dark:bg-neutral-800 overflow-hidden">
                        {opt.imageUrl && (
                          <div className="relative aspect-square bg-white dark:bg-neutral-900">
                            <Image
                              src={opt.imageUrl}
                              alt={opt.label}
                              fill
                              className="object-contain p-2"
                              unoptimized
                            />
                          </div>
                        )}
                        <p className="px-2 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{opt.label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {decision.options.map((opt) => (
                      <div
                        key={opt.id}
                        className="rounded-md border border-neutral-200 dark:border-white/[0.06] bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{opt.label}</span>
                        {opt.description && (
                          <span className="ml-2 text-neutral-500 dark:text-neutral-400">— {opt.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
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
          allowPublicVoting={decision.allowPublicVoting}
          registerUrl={registerUrl}
          loginUrl={loginUrl}
        />

        <p className="mt-6 text-center text-xs text-neutral-400">
          {t('footer', { org: ORG.name })}
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Link2, Gift, Users, Send, Copy, Check } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ORG } from '@/config/org'
import { useTranslations } from 'next-intl'
import { PageShell } from '@/components/layout/PageShell'

interface ReferralData {
  code: string
  url: string
  totalInvites: number
  registrations: number
  incentive: { inviteeCents: number; rewardCents: number }
}

export default function InvitePage() {
  const t = useTranslations('invite')
  const { status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<ReferralData | null>(null)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/invite')
      return
    }
    if (status !== 'authenticated') return
    fetch('/api/referral/my-code')
      .then(r => r.json())
      .then(j => { if (j.success) setData(j.data) })
      .finally(() => setLoading(false))
  }, [status, router])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setFeedback(null)

    const res = await fetch('/api/referral/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const json = await res.json()

    if (json.success) {
      setFeedback({ type: 'success', message: t('inviteSent', { email }) })
      setEmail('')
      setData(prev => prev ? { ...prev, totalInvites: prev.totalInvites + 1 } : prev)
    } else {
      setFeedback({ type: 'error', message: json.error ?? t('sendError') })
    }
    setSending(false)
  }

  async function copyLink() {
    if (!data) return
    await navigator.clipboard.writeText(data.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inviteeCHF = data ? data.incentive.inviteeCents / 100 : 5
  const rewardCHF  = data ? data.incentive.rewardCents / 100 : 10

  return (
    <PageShell maxWidth="2xl" py="py-12 sm:py-16">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-action-muted rounded-2xl mb-4">
            <Users className="w-7 h-7 text-action" />
          </div>
          <Heading level={1} className="text-3xl sm:text-4xl mb-3">{t('title')}</Heading>
          <p className="text-text-secondary text-lg">
            {t('subtitle', { orgName: ORG.name })}
          </p>
        </div>

        {/* Incentive cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="card-shell p-5">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-5 h-5 text-action" />
              <span className="font-semibold text-text-primary">{t('friendReceives')}</span>
            </div>
            <p className="text-2xl font-bold text-action mb-1">CHF {inviteeCHF}</p>
            <p className="text-sm text-text-tertiary">{t('friendReceivesDesc')}</p>
          </div>
          <div className="card-shell p-5">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-5 h-5 text-action" />
              <span className="font-semibold text-text-primary">{t('youReceive')}</span>
            </div>
            <p className="text-2xl font-bold text-action mb-1">CHF {rewardCHF}</p>
            <p className="text-sm text-text-tertiary">{t('youReceiveDesc')}</p>
          </div>
        </div>

        {/* Referral link */}
        <div className="card-shell p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-medium text-text-secondary">{t('linkLabel')}</span>
          </div>
          {loading ? (
            <div className="h-10 bg-surface-raised rounded-lg animate-pulse" />
          ) : (
            <div className="flex gap-2">
              <Input
                readOnly
                value={data?.url ?? ''}
                className="flex-1 font-mono truncate"
              />
              <Button onClick={copyLink} variant="primary" size="sm" className="whitespace-nowrap">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('copied') : t('copy')}
              </Button>
            </div>
          )}
        </div>

        {/* Invite by email */}
        <div className="card-shell p-6 mb-6">
          <Heading level={2} className="text-lg font-semibold mb-4">{t('inviteByEmail')}</Heading>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="flex-1"
            />
            <Button type="submit" variant="primary" size="sm" disabled={sending} className="whitespace-nowrap">
              <Send className="w-4 h-4" />
              {sending ? t('sending') : t('send')}
            </Button>
          </form>
          {feedback && (
            <p className={`mt-3 text-sm ${feedback.type === 'success' ? 'text-action' : 'text-error-600'}`}>
              {feedback.message}
            </p>
          )}
        </div>

        {/* Stats */}
        {data && (
          <div className="flex gap-6 text-center">
            <div className="flex-1 card-shell p-4">
              <p className="text-2xl font-bold text-text-primary">{data.totalInvites}</p>
              <p className="text-sm text-text-tertiary">{t('invitesSent')}</p>
            </div>
            <div className="flex-1 card-shell p-4">
              <p className="text-2xl font-bold text-action">{data.registrations}</p>
              <p className="text-sm text-text-tertiary">{t('registrations')}</p>
            </div>
          </div>
        )}
    </PageShell>
  )
}

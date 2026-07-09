'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { PROMO_CODE_TYPES, PROMO_CODE_SCOPES, type PromoCodeType } from '@/config/promo-codes'

interface PromoRow {
  id: string
  code: string
  type: string
  percent: number | null
  amountCents: number | null
  balanceCents: number | null
  scope: string
  minOrderCents: number
  maxRedemptions: number | null
  perUserLimit: number | null
  redeemedCount: number
  validUntil: string | null
  isActive: boolean
}

const TYPE_LABELS: Record<string, string> = {
  percent: 'Prozent',
  fixed: 'Fester Betrag',
  gift_card: 'Gutschein (Guthaben)',
}
const SCOPE_LABELS: Record<string, string> = {
  all: 'Alle Bereiche',
  marketplace: 'Marktplatz',
  membership: 'Mitgliedschaft',
  workshop: 'Workshops',
  service: 'Dienstleistungen',
}

function valueLabel(c: PromoRow): string {
  if (c.type === 'percent') return `${c.percent}%`
  if (c.type === 'gift_card') return `${((c.balanceCents ?? 0) / 100).toFixed(2)} CHF Guthaben`
  return `${((c.amountCents ?? 0) / 100).toFixed(2)} CHF`
}

export function PromoCodesClient({ initialCodes }: { initialCodes: PromoRow[] }) {
  const router = useRouter()
  const [type, setType] = useState<PromoCodeType>(PROMO_CODE_TYPES.PERCENT)
  const [form, setForm] = useState({
    code: '', percent: '100', amountChf: '', scope: PROMO_CODE_SCOPES.ALL as string,
    minOrderChf: '', maxRedemptions: '', perUserLimit: '', validUntil: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const body = {
      code: form.code.trim(),
      type,
      percent: type === PROMO_CODE_TYPES.PERCENT ? Number(form.percent) : null,
      amountChf: type !== PROMO_CODE_TYPES.PERCENT ? Number(form.amountChf) : null,
      scope: form.scope,
      minOrderChf: form.minOrderChf ? Number(form.minOrderChf) : 0,
      maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
      perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
    }
    const res = await apiFetch('/api/admin/promo-codes', { method: 'POST', body })
    setSaving(false)
    if (res.success) {
      setForm(f => ({ ...f, code: '', amountChf: '', maxRedemptions: '', perUserLimit: '', validUntil: '' }))
      router.refresh()
    } else {
      setError(res.error || 'Erstellen fehlgeschlagen')
      logger.error('Create promo code failed', { error: res.error })
    }
  }

  const toggle = async (c: PromoRow) => {
    setBusyId(c.id)
    const res = await apiFetch(`/api/admin/promo-codes/${c.id}`, { method: 'PATCH', body: { isActive: !c.isActive } })
    setBusyId(null)
    if (res.success) router.refresh()
  }

  return (
    <div className="space-y-8">
      {/* Issue a code */}
      <form onSubmit={submit} className="rounded-xl border border-subtle bg-surface-base p-4 sm:p-6 space-y-4">
        <h2 className="text-base font-medium text-text-primary">Neuen Code ausstellen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-text-secondary">Code</span>
            <Input value={form.code} onChange={set('code')} placeholder="z.B. sommer25" required className="mt-1" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-text-secondary">Art</span>
            <Select value={type} onChange={e => setType(e.target.value as PromoCodeType)} className="mt-1">
              <option value={PROMO_CODE_TYPES.PERCENT}>Prozent-Rabatt</option>
              <option value={PROMO_CODE_TYPES.FIXED}>Fester Betrag (CHF)</option>
              <option value={PROMO_CODE_TYPES.GIFT_CARD}>Gutschein / Guthaben (CHF)</option>
            </Select>
          </label>
          {type === PROMO_CODE_TYPES.PERCENT ? (
            <label className="block">
              <span className="text-xs font-medium text-text-secondary">Prozent (1–100)</span>
              <Input type="number" min={1} max={100} value={form.percent} onChange={set('percent')} className="mt-1" />
            </label>
          ) : (
            <label className="block">
              <span className="text-xs font-medium text-text-secondary">Betrag (CHF)</span>
              <Input type="number" min={0} step="0.05" value={form.amountChf} onChange={set('amountChf')} placeholder="z.B. 100" className="mt-1" />
            </label>
          )}
          <label className="block">
            <span className="text-xs font-medium text-text-secondary">Gültig für</span>
            <Select value={form.scope} onChange={set('scope')} className="mt-1">
              {Object.entries(SCOPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-text-secondary">Mindestbestellwert CHF (optional)</span>
            <Input type="number" min={0} step="0.05" value={form.minOrderChf} onChange={set('minOrderChf')} className="mt-1" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-text-secondary">Max. Einlösungen (optional)</span>
            <Input type="number" min={1} value={form.maxRedemptions} onChange={set('maxRedemptions')} placeholder="unbegrenzt" className="mt-1" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-text-secondary">Pro Person (optional)</span>
            <Input type="number" min={1} value={form.perUserLimit} onChange={set('perUserLimit')} placeholder="unbegrenzt" className="mt-1" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-text-secondary">Gültig bis (optional)</span>
            <Input type="date" value={form.validUntil} onChange={set('validUntil')} className="mt-1" />
          </label>
        </div>
        {error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Code ausstellen
          </Button>
        </div>
      </form>

      {/* Existing codes */}
      <div className="rounded-xl border border-subtle bg-surface-base overflow-hidden">
        <div className="p-4 border-b border-subtle">
          <h2 className="text-base font-medium text-text-primary">Ausgestellte Codes ({initialCodes.length})</h2>
        </div>
        {initialCodes.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-tertiary">Noch keine Codes ausgestellt.</p>
        ) : (
          <ul className="divide-y divide-subtle">
            {initialCodes.map(c => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm font-semibold text-text-primary">{c.code}</code>
                    {c.isActive
                      ? <StatusBadge variant="success">Aktiv</StatusBadge>
                      : <StatusBadge variant="neutral">Pausiert</StatusBadge>}
                  </div>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {TYPE_LABELS[c.type]} · {valueLabel(c)} · {SCOPE_LABELS[c.scope] ?? c.scope}
                    {' · '}{c.redeemedCount}{c.maxRedemptions ? `/${c.maxRedemptions}` : ''} eingelöst
                    {c.perUserLimit ? ` · max ${c.perUserLimit}/Person` : ''}
                    {c.validUntil ? ` · bis ${new Date(c.validUntil).toLocaleDateString('de-CH')}` : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled={busyId === c.id} onClick={() => toggle(c)} className="gap-2">
                  {busyId === c.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {c.isActive ? 'Pausieren' : 'Aktivieren'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

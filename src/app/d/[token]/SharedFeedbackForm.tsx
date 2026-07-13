'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import {
  FEEDBACK_KINDS,
  FEEDBACK_KIND_LABELS,
} from '@/config/deliverables'

// External reviewers give a comment or a change request (no self-approval).
const EXTERNAL_KINDS = [FEEDBACK_KINDS.COMMENT, FEEDBACK_KINDS.CHANGE_REQUEST]

export default function SharedFeedbackForm({ token }: { token: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<string>(FEEDBACK_KINDS.COMMENT)
  const [target, setTarget] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !body.trim()) return
    setBusy(true)
    setError(null)

    const res = await apiFetch(`/api/public/share/${token}`, {
      method: 'POST',
      body: {
        author_name: name,
        kind,
        body,
        target: target || null,
      },
    })

    setBusy(false)
    if (!res.success) {
      setError(res.error || 'Fehler beim Senden')
      return
    }
    setDone(true)
    setBody('')
    setTarget('')
    // Refresh the server component so the new comment appears in the thread.
    router.refresh()
    setTimeout(() => setDone(false), 2500)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <div className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg text-error-700 dark:text-error-300 text-sm">
          {error}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <FormField label="Dein Name" required htmlFor="fb-name">
          <Input id="fb-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required placeholder="Name" />
        </FormField>
        <FormField label="Art" htmlFor="fb-kind">
          <Select id="fb-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {EXTERNAL_KINDS.map((k) => (
              <option key={k} value={k}>{FEEDBACK_KIND_LABELS[k]}</option>
            ))}
          </Select>
        </FormField>
      </div>
      {kind === FEEDBACK_KINDS.CHANGE_REQUEST && (
        <FormField label="Betrifft (optional)" htmlFor="fb-target">
          <Input id="fb-target" value={target} onChange={(e) => setTarget(e.target.value)} maxLength={200} placeholder="z.B. Positions-Tabelle" />
        </FormField>
      )}
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={4000} required placeholder="Dein Feedback…" />
      <Button type="submit" size="sm" disabled={busy || !name.trim() || !body.trim()}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        {done ? 'Gesendet' : 'Feedback senden'}
      </Button>
    </form>
  )
}

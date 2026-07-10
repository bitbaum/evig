'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Lock, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { unlockUnlistedPost, type UnlockState } from './actions'

const INITIAL: UnlockState = { ok: false }

interface Props {
  title: string
}

/**
 * Password screen for an unlisted ("closed") post. The password is checked in a
 * server action; on success the server sets the cookie and the client refreshes
 * so the now-unlocked post renders.
 */
export default function BlogPasswordGate({ title }: Props) {
  const t = useTranslations('blog.gate')
  const router = useRouter()
  const [state, formAction, pending] = useActionState(unlockUnlistedPost, INITIAL)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.ok) router.refresh()
  }, [state.ok, router])

  useEffect(() => {
    if (state.error) inputRef.current?.focus()
  }, [state.error])

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-subtle bg-surface-raised text-action">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="ui-public-eyebrow mt-6">{t('eyebrow')}</div>
          <h1 className="ui-public-display-md mt-2">{title}</h1>
          <p className="mt-3 text-sm text-text-secondary">{t('intro')}</p>
        </div>

        <form action={formAction} className="mt-8">
          <label htmlFor="blog-gate-password" className="sr-only">
            {t('placeholder')}
          </label>
          <Input
            ref={inputRef}
            id="blog-gate-password"
            name="password"
            type="password"
            autoComplete="off"
            autoFocus
            required
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? 'blog-gate-error' : undefined}
            placeholder={t('placeholder')}
          />

          {state.error && (
            <p id="blog-gate-error" className="mt-2 text-sm text-warning-600 dark:text-warning-400">
              {t('error')}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={pending} className="mt-4 w-full gap-2">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                {t('submit')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { unlockDossier, type UnlockState } from './actions'

const INITIAL: UnlockState = { ok: false }

/**
 * Passwortschranke für das interne Dossier. Prüfung erfolgt serverseitig
 * (Server Action); bei Erfolg setzt der Server das Cookie und der Client
 * lädt die Route neu, sodass die geschützten Inhalte gerendert werden.
 */
export function DossierGate() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(unlockDossier, INITIAL)
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
          <div className="ui-public-eyebrow mt-6">Intern · Vertraulich</div>
          <h1 className="ui-public-display-md mt-2">Projektdossier</h1>
          <p className="mt-3 text-sm text-text-secondary">
            Dieser Bereich enthält interne Akquise-Kontakte und den Projektstand
            zur Umwandlung von Monitoren in Leuchten. Bitte Passwort eingeben.
          </p>
        </div>

        <form action={formAction} className="mt-8">
          <label htmlFor="dossier-password" className="sr-only">
            Passwort
          </label>
          <Input
            ref={inputRef}
            id="dossier-password"
            name="password"
            type="password"
            autoComplete="off"
            autoFocus
            required
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? 'dossier-error' : undefined}
            placeholder="Passwort"
          />

          {state.error && (
            <p id="dossier-error" className="mt-2 text-sm text-warning-600 dark:text-warning-400">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={pending}
            className="mt-4 w-full gap-2"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                Öffnen
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

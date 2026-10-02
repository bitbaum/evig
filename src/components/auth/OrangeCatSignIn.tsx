'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { signIn } from 'next-auth/react';
import { Cat, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ORANGECAT_PROVIDER_ID } from '@/lib/auth/orangecat-provider-id';

/**
 * Whether Auth.js actually mounted the OrangeCat provider. The env pair is read
 * at runtime on the server, so the client asks /api/auth/providers rather than
 * trusting a build-time flag — the primary button can never be a dead end.
 * `unknown` until the answer arrives, so callers can hold a slot instead of
 * flashing the password form open and shut.
 */
export type OrangeCatAvailability = 'unknown' | 'on' | 'off';

export function useOrangeCatAvailability(): OrangeCatAvailability {
  const [state, setState] = useState<OrangeCatAvailability>('unknown');
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/providers')
      .then((r) => (r.ok ? r.json() : null))
      .then((providers: Record<string, unknown> | null) => {
        if (!cancelled) {
          setState(providers && ORANGECAT_PROVIDER_ID in providers ? 'on' : 'off');
        }
      })
      .catch(() => {
        if (!cancelled) setState('off');
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

/** The primary "Mit OrangeCat anmelden / Konto erstellen" action. */
export function OrangeCatButton({
  label,
  hint,
  callbackUrl,
}: {
  label: string;
  /** One line under the button naming what OrangeCat itself offers. */
  hint?: string;
  callbackUrl: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="primary"
        size="lg"
        className="w-full gap-2 font-semibold"
        disabled={busy}
        data-testid="orangecat-signin"
        onClick={() => {
          setBusy(true);
          void signIn(ORANGECAT_PROVIDER_ID, { callbackUrl });
        }}
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cat className="w-5 h-5" />}
        <span>{label}</span>
      </Button>
      {hint && <p className="text-center text-sm text-text-muted">{hint}</p>}
    </div>
  );
}

/** Same footprint as the button, while availability is unknown. */
export function OrangeCatButtonSlot() {
  return (
    <div
      aria-hidden="true"
      className="min-h-touch w-full rounded-md bg-surface-raised animate-pulse motion-reduce:animate-none"
    />
  );
}

/**
 * OrangeCat first, the password path one click away: the shape both the
 * sign-in and the registration page lead with. Renders nothing when the
 * provider is not mounted — the caller then shows its password form directly.
 */
export function OrangeCatFirst({
  availability,
  label,
  hint,
  footnote,
  callbackUrl,
  emailLabel,
  emailOpen,
  onToggleEmail,
  emailPanelId,
}: {
  availability: OrangeCatAvailability;
  label: string;
  hint: string;
  footnote?: ReactNode;
  callbackUrl: string;
  emailLabel: string;
  emailOpen: boolean;
  onToggleEmail: () => void;
  /** id of the element the disclosure shows and hides. */
  emailPanelId: string;
}) {
  if (availability === 'off') return null;
  return (
    <div>
      {availability === 'on' ? (
        <OrangeCatButton label={label} hint={hint} callbackUrl={callbackUrl} />
      ) : (
        <OrangeCatButtonSlot />
      )}
      {footnote && <p className="mt-3 text-center text-xs text-text-muted">{footnote}</p>}
      <div className="mt-6 text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={emailOpen}
          aria-controls={emailPanelId}
          onClick={onToggleEmail}
          className="gap-1 text-text-secondary"
        >
          {emailLabel}
          <ChevronDown
            className={`w-4 h-4 transition-transform motion-reduce:transition-none ${emailOpen ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>
    </div>
  );
}

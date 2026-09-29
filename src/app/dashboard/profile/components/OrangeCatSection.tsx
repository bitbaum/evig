'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Cat, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/client';

/**
 * "Connect OrangeCat" on the profile — the explicit link that "Sign in with
 * OrangeCat" refuses to make by email. One click: a signed intent cookie for
 * this account, then OrangeCat's own sign-in, then back here linked. Hidden
 * entirely while the provider is not configured.
 */
export function OrangeCatSection() {
  const t = useTranslations('dashboard.profile.orangecat');
  const searchParams = useSearchParams();
  const [state, setState] = useState<{ enabled: boolean; linked: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ data: { enabled: boolean; linked: boolean } }>('/api/user/orangecat')
      .then((res) => {
        if (!cancelled) {
          setState(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ enabled: false, linked: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (!state?.enabled) {
    return null;
  }

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch('/api/user/orangecat', { method: 'POST' });
      await signIn('orangecat', { callbackUrl: '/dashboard/profile?orangecat=linked' });
    } catch {
      setError(t('error'));
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-default bg-surface-base p-4">
      <div className="flex items-start gap-3">
        <Cat className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-text-primary">{t('title')}</h3>
          <p className="mt-1 text-sm text-text-secondary">{t('description')}</p>
          {state.linked ? (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-success-700 dark:text-success-400">
              <CheckCircle className="h-4 w-4" /> {t('connected')}
            </p>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={connect}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('connect')}
            </Button>
          )}
          {error && <p className="mt-2 text-sm text-error-600">{error}</p>}
        </div>
      </div>
    </section>
  );
}

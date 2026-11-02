'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VerifyStep } from '@/components/auth/steps';
import { Logo } from '@/components/ui/Logo';
import { ROUTES } from '@/config/routes';
import { useRegistration } from '@/hooks/useRegistration';

const DASHBOARD = '/dashboard';

/**
 * Where a new sign-up lands: evig's 6-digit code confirms the address (the
 * code mail replaces AccountKit's confirmation link, runtime.ts). Skipping is
 * one tap; the dashboard banner sends a new code later.
 */
export default function VerifyEmailPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const leave = () => router.replace(DASHBOARD);
  const { data: session, status } = useSession();
  const { verifyError, verifyCode, resendCode } = useRegistration();
  const email = session?.user?.email ?? '';
  // An OrangeCat or bitbaum sign-in carries a `.invalid` placeholder: nothing to confirm.
  const deliverable = Boolean(email) && !email.toLowerCase().endsWith('.invalid');
  const done = status === 'authenticated' && (session?.user?.emailVerified || !deliverable);

  useEffect(() => {
    if (done) router.replace(DASHBOARD);
  }, [done, router]);

  return (
    <main className="min-h-screen bg-surface-raised px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo showText={true} />
        </div>
        {status === 'unauthenticated' ? (
          <p className="text-center text-sm text-text-secondary">
            <Link href={ROUTES.public.login} className="font-medium text-action hover:underline">
              {t('title')}
            </Link>
          </p>
        ) : status === 'loading' || done ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-action" />
          </div>
        ) : (
          <div className="card-shell rounded-2xl p-6 sm:p-8">
            <VerifyStep
              email={email}
              onVerify={async (code) => {
                const ok = await verifyCode(email, code);
                if (ok) leave();
                return ok;
              }}
              onResend={() => resendCode(email)}
              onSkip={leave}
              error={verifyError}
            />
          </div>
        )}
      </div>
    </main>
  );
}

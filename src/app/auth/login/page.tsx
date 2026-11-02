import { Suspense } from 'react';
import { connection } from 'next/server';
import { getLocale, getTranslations } from 'next-intl/server';
import { authLabelsFor } from '@bitbaum/accountkit/auth';
import { AuthenticatedRedirect } from '@/components/auth/AuthenticatedRedirect';
import { AuthShell, landingPath } from '@/components/auth/AuthShell';
import { RecoveryForm, SignInForm, TokenScrubber } from '@/components/auth/AuthForms';
import { evigMethods } from '@/lib/auth/shared/methods';

/**
 * AccountKit's sign-in form, with every method this deployment offers:
 * password, passkey, an email sign-in link, recovery, Sign in with OrangeCat
 * and the shared bitbaum sign-in (src/lib/auth/shared/methods.ts).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; token?: string; next?: string }>;
}) {
  // Which methods are offered is the box's env, read per request.
  await connection();
  const [{ callbackUrl, error, token, next }, t, locale] = await Promise.all([
    searchParams,
    getTranslations('auth.login'),
    getLocale(),
  ]);
  const landing = landingPath(callbackUrl ?? next, '/dashboard');
  const methods = evigMethods();
  const labels = authLabelsFor(locale);
  // A reset link (AccountKit's or evig's own) lands here with its token.
  const resetting = typeof token === 'string' && token.length > 0;
  const expiredLink = !resetting && error === 'INVALID_TOKEN';
  return (
    <AuthShell backHome={t('backHome')} title={t('title')} subtitle={t('subtitle')}>
      <Suspense fallback={null}>
        <AuthenticatedRedirect />
      </Suspense>
      {resetting || expiredLink ? (
        <>
          <TokenScrubber />
          <RecoveryForm
            labels={labels}
            methods={methods}
            next={landing}
            token={resetting ? token : undefined}
            invalidToken={expiredLink}
          />
        </>
      ) : (
        <SignInForm
          labels={labels}
          methods={methods}
          next={landing}
          initialError={Boolean(error)}
          signUp={t('createAccount')}
        />
      )}
    </AuthShell>
  );
}

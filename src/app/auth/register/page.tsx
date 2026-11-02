import Link from 'next/link';
import { connection } from 'next/server';
import { getLocale, getTranslations } from 'next-intl/server';
import { authLabelsFor } from '@bitbaum/accountkit/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignUpForm } from '@/components/auth/AuthForms';
import { ReferralKeeper } from '@/components/auth/ReferralKeeper';
import { evigMethods } from '@/lib/auth/shared/methods';

/**
 * AccountKit's sign-up: an email and a password, or any other method. A new
 * person confirms the address with evig's 6-digit code (/auth/verify-email),
 * or later from the dashboard. A referral link (?ref=…) is kept for the
 * sign-up (src/lib/auth/shared/evig-plugin.ts).
 */
export default async function RegisterPage() {
  await connection();
  const [t, tLogin, locale] = await Promise.all([
    getTranslations('auth.register'),
    getTranslations('auth.login'),
    getLocale(),
  ]);
  return (
    <AuthShell backHome={tLogin('backHome')} title={t('heading')} subtitle={t('subtitle')}>
      <ReferralKeeper />
      <SignUpForm
        labels={authLabelsFor(locale)}
        methods={evigMethods()}
        next="/auth/verify-email"
        signIn={t('login')}
      />
      <p className="mt-6 text-center text-xs text-text-tertiary">
        {t('termsI')}{' '}
        <Link href="/agb" className="text-action hover:underline">
          AGB
        </Link>{' '}
        {t('termsAnd')}{' '}
        <Link href="/datenschutz" className="text-action hover:underline">
          Datenschutzbestimmungen
        </Link>
      </p>
    </AuthShell>
  );
}

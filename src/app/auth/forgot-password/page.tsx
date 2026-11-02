import Link from 'next/link';
import { connection } from 'next/server';
import { getLocale, getTranslations } from 'next-intl/server';
import { authLabelsFor } from '@bitbaum/accountkit/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { RecoveryForm } from '@/components/auth/AuthForms';
import { ROUTES } from '@/config/routes';
import { evigMethods } from '@/lib/auth/shared/methods';

/**
 * "Passwort vergessen?": AccountKit's recovery form. The mailed link lands on
 * the sign-in page, which sets the new password. An account without a password
 * yet (IT-Hilfe, an HR hire) sets its first one the same way.
 */
export default async function ForgotPasswordPage() {
  await connection();
  const [t, tLogin, locale] = await Promise.all([
    getTranslations('auth.forgotPassword'),
    getTranslations('auth.login'),
    getLocale(),
  ]);
  const methods = evigMethods();
  return (
    <AuthShell backHome={tLogin('backHome')} title={t('heading')} subtitle={t('subheading')}>
      <div className="flex flex-col gap-4">
        {methods.passwordReset ? (
          <RecoveryForm labels={authLabelsFor(locale)} methods={methods} next="/dashboard" />
        ) : (
          <p role="status" className="rounded-md bg-surface-raised p-3 text-sm text-text-primary">
            {t('unavailable')}
          </p>
        )}
        <p className="text-center text-sm text-text-secondary">
          {t('rememberPassword')}{' '}
          <Link href={ROUTES.public.login} className="font-medium text-action hover:underline">
            {t('loginLink')}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

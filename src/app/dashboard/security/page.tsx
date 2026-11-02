import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { authLabelsFor, isDeliverable } from '@bitbaum/accountkit/auth';
import { auth } from '@/auth';
import { AccountPanel } from '@/components/auth/AuthForms';
import { CONTACT } from '@/config/org';
import { ROUTES } from '@/config/routes';
import { deletionRefusal } from '@/lib/auth/shared/evig-plugin';
import { evigMethods } from '@/lib/auth/shared/methods';
import { sharedAuth } from '@/lib/auth/shared/runtime';

// Methods depend on runtime env, and the panel on who is signed in.
export const dynamic = 'force-dynamic';

const PATH = '/dashboard/security';

/**
 * How this person signs in: password, passkeys, a second factor, linked
 * OrangeCat and bitbaum sign-ins, and deleting the account (AccountKit's
 * panel). Deleting removes the evig account too (migration 143), except where
 * evig must keep it; then this page says so and offers deletion by staff.
 */
export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(`${ROUTES.public.login}?callbackUrl=${PATH}`);
  const requestHeaders = await headers();
  const [t, locale, shared, accounts, kept] = await Promise.all([
    getTranslations('dashboard.security'),
    getLocale(),
    sharedAuth.getSession(),
    sharedAuth
      .getAuth()
      .api.listUserAccounts({ headers: requestHeaders })
      .catch(() => []),
    deletionRefusal(session.user.id).catch(() => null),
  ]);
  const user = shared?.user as
    (NonNullable<typeof shared>['user'] & { twoFactorEnabled?: boolean | null }) | undefined;
  const email = session.user.email;

  return (
    <main className="min-h-screen bg-canvas">
      <article className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <header className="space-y-2 border-b border-subtle pb-6">
          <h1 className="text-2xl font-semibold text-text-primary">{t('title')}</h1>
          <p className="text-sm text-text-secondary">{t('description')}</p>
        </header>
        {kept && (
          <p role="note" className="rounded-md bg-surface-raised p-3 text-sm text-text-primary">
            {t(kept === 'superAdmin' ? 'keptSuperAdmin' : 'keptRecords')}{' '}
            <a
              className="font-medium text-action hover:underline"
              href={`mailto:${CONTACT.supportEmail}?subject=${encodeURIComponent(t('requestDeletion'))}&body=${encodeURIComponent(email)}`}
            >
              {t('requestDeletion')}
            </a>
          </p>
        )}
        <section id="account">
          <AccountPanel
            labels={authLabelsFor(locale)}
            user={{
              name: user?.name ?? session.user.name ?? '',
              email: user && isDeliverable(user.email) ? user.email : null,
              emailVerified: Boolean(user?.emailVerified),
              role: session.user.role ?? 'customer',
              twoFactorEnabled: Boolean(user?.twoFactorEnabled),
            }}
            linked={accounts.map((a) => a.providerId)}
            methods={evigMethods()}
            accountPath={PATH}
            homePath="/"
          />
        </section>
      </article>
    </main>
  );
}

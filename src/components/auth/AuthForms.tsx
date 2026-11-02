'use client';

import Link from 'next/link';
import {
  AccountPanel as SharedAccountPanel,
  PasswordRecoveryForm,
  SignInForm as SharedSignInForm,
  SignUpForm as SharedSignUpForm,
  type AuthClasses,
} from '@bitbaum/accountkit/auth/react';
// Types only: the runtime half of this entry point pulls in node:crypto.
import type { AuthLabels, SignInMethods } from '@bitbaum/accountkit/auth';
import { useEffect, type ComponentProps } from 'react';
import { ROUTES } from '@/config/routes';
import { designPrimitive } from '@/lib/design-system';
import { authClient } from '@/lib/auth/shared/client';

// A full-width label may be longer than a phone is wide ("Weiter mit Google,
// Apple, GitHub, X oder Facebook"), so these buttons wrap.
const BUTTON = `${designPrimitive.buttonBase.replace('whitespace-nowrap', '')} ${designPrimitive.focus} ${designPrimitive.buttonSize.default} w-full whitespace-normal text-center`;

/** AccountKit's shared forms in evig's look (src/lib/design-system.ts). */
export const AUTH_CLASSES: Partial<AuthClasses> = {
  stack: 'flex flex-col gap-4',
  field: 'flex flex-col gap-1.5',
  label: 'text-sm font-medium text-text-secondary',
  input: `${designPrimitive.form.input} min-h-touch`,
  hint: 'text-xs text-text-tertiary',
  notice: 'rounded-md bg-surface-raised p-3 text-sm text-text-primary',
  error:
    'rounded-md bg-error-50 p-3 text-sm text-error-700 dark:bg-error-900/30 dark:text-error-300',
  button: `${BUTTON} ${designPrimitive.button.primary}`,
  buttonQuiet: `${BUTTON} ${designPrimitive.button.outline}`,
  link: 'font-medium text-action hover:underline',
  divider: 'text-center text-xs text-text-tertiary',
  section: 'card-shell flex flex-col gap-4 rounded-2xl p-6',
  sectionTitle: 'font-semibold text-text-primary',
};

const SIGN_IN = ROUTES.public.login;
const SIGN_UP = '/auth/register';

type Common = { labels: AuthLabels; methods: SignInMethods; next: string };

export function SignInForm({
  signUp,
  ...props
}: Common & { initialError: boolean; signUp: string }) {
  return (
    <SharedSignInForm
      {...props}
      client={authClient}
      classes={AUTH_CLASSES}
      signInPath={SIGN_IN}
      signUpLink={
        <Link href={SIGN_UP} className="font-medium text-action hover:underline">
          {signUp}
        </Link>
      }
    />
  );
}

export function SignUpForm({ signIn, ...props }: Common & { signIn: string }) {
  return (
    <SharedSignUpForm
      {...props}
      client={authClient}
      classes={AUTH_CLASSES}
      signUpPath={SIGN_UP}
      signInPath={SIGN_IN}
      signInLink={
        <Link href={SIGN_IN} className="font-medium text-action hover:underline">
          {signIn}
        </Link>
      }
    />
  );
}

export function RecoveryForm(
  props: Pick<
    ComponentProps<typeof PasswordRecoveryForm>,
    'methods' | 'next' | 'labels' | 'token' | 'invalidToken'
  >,
) {
  return (
    <PasswordRecoveryForm
      {...props}
      client={authClient}
      classes={AUTH_CLASSES}
      signInPath={SIGN_IN}
      onBack={() => window.location.assign(SIGN_IN)}
    />
  );
}

export function AccountPanel(
  props: Pick<
    ComponentProps<typeof SharedAccountPanel>,
    'user' | 'linked' | 'methods' | 'accountPath' | 'homePath' | 'labels'
  >,
) {
  return <SharedAccountPanel {...props} client={authClient} classes={AUTH_CLASSES} />;
}

/**
 * Takes a reset token out of the address bar, referrers and history once the
 * page holds it. The sign-in page passes the token to RecoveryForm from the
 * server, so the form keeps it however the page mounts. (The session provider
 * once remounted every page after hydration and lost a token that lived only
 * in client state; src/components/auth/SessionProvider.tsx no longer does.)
 */
export function TokenScrubber() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('token') && !url.searchParams.has('error')) return;
    url.searchParams.delete('token');
    if (url.searchParams.get('error') === 'INVALID_TOKEN') url.searchParams.delete('error');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, []);
  return null;
}

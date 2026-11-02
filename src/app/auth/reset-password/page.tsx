import { redirect } from 'next/navigation';
import { landingPath } from '@/components/auth/AuthShell';
import { ROUTES } from '@/config/routes';
import { honourEvigResetLink } from '@/lib/auth/shared/reset-links';

/**
 * A reset link lands on the sign-in page, which opens AccountKit's step that
 * sets the new password. AccountKit's own links go there directly; this
 * address serves the links evig mints (an IT-Hilfe claim, sent for 7 days),
 * including ones mailed before evig moved to AccountKit's screens.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token, callbackUrl } = await searchParams;
  const query = new URLSearchParams();
  if (typeof token === 'string' && token) {
    await honourEvigResetLink(token);
    query.set('token', token);
  }
  const next = landingPath(typeof callbackUrl === 'string' ? callbackUrl : undefined, '');
  if (next) query.set('callbackUrl', next);
  const rest = query.toString();
  redirect(`${ROUTES.public.login}${rest ? `?${rest}` : ''}`);
}

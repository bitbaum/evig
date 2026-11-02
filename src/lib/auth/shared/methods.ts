import { signInMethods, type SignInMethods } from '@bitbaum/accountkit/auth';
import { sharedAuthMailer } from './runtime';

/**
 * Which sign-in methods this deployment offers, from its env: password,
 * passkeys and two-factor always; the email link and recovery when account
 * mail works (RESEND_*); Sign in with OrangeCat with ORANGECAT_OAUTH_*; the
 * shared bitbaum sign-in with SIGNIN_*. Read per request: it is runtime env.
 */
export function evigMethods(env: NodeJS.ProcessEnv = process.env): SignInMethods {
  return signInMethods(env, sharedAuthMailer.configured);
}

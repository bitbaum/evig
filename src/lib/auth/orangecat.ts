/**
 * "Sign in with OrangeCat" for evig — orangecat ADR-0009, step D8.
 *
 * The provider, the rules and the link token live once, in
 * @bitbaum/accountkit/orangecat, shared by every bitbaum app. What is evig's
 * own is the POLICY, and it is stricter than the fleet default:
 *
 *  - An email that already has an evig account is NOT given a placeholder
 *    account beside it: the person is sent to sign in with their evig
 *    password and connect OrangeCat from their profile (the signed
 *    10-minute link cookie), so their orders stay on one account.
 *  - An anonymous OrangeCat account (no email) is refused: evig has nothing
 *    to address an order to.
 *
 * Staff is never touched by any of this: `is_staff` stays the sole grant.
 */
import {
  decideOrangecatSignIn,
  type OrangecatPolicy,
  type OrangecatRefusal,
} from '@bitbaum/accountkit/orangecat';

export {
  ORANGECAT_LINK_TTL_SECONDS,
  ORANGECAT_PROVIDER_ID,
  mintLinkToken,
  orangecatClient,
  orangecatProvider,
  readLinkToken,
} from '@bitbaum/accountkit/orangecat';

export const ORANGECAT_POLICY: OrangecatPolicy = {
  whenEmailTaken: 'refuse',
  whenNoEmail: 'refuse',
};

/** Cookie that proves "this signed-in evig user asked to connect OrangeCat". */
export const ORANGECAT_LINK_COOKIE = 'evig-oc-link';

/** Login error codes the login form maps to a sentence. */
export const ORANGECAT_LOGIN_ERRORS = {
  notLinked: 'orangecat_not_linked',
  noEmail: 'orangecat_no_email',
  alreadyLinked: 'orangecat_already_linked',
} as const;

/** accountkit's refusal → the code the login form explains. */
export function loginErrorFor(reason: OrangecatRefusal) {
  switch (reason) {
    case 'email-taken':
      return ORANGECAT_LOGIN_ERRORS.notLinked;
    case 'no-email':
      return ORANGECAT_LOGIN_ERRORS.noEmail;
    case 'already-linked':
      return ORANGECAT_LOGIN_ERRORS.alreadyLinked;
  }
}

export function isOrangeCatEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.ORANGECAT_OAUTH_CLIENT_ID && env.ORANGECAT_OAUTH_CLIENT_SECRET);
}

export interface KnownUser {
  id: string;
  orangecat_actor_id: string | null;
}

export type OrangeCatResolution =
  | { kind: 'existing'; userId: string }
  | { kind: 'create'; email: string }
  | { kind: 'link'; userId: string }
  | { kind: 'refuse'; code: (typeof ORANGECAT_LOGIN_ERRORS)[keyof typeof ORANGECAT_LOGIN_ERRORS] };

/** accountkit's rule under evig's policy, in evig's row shapes and login codes. */
export function resolveOrangeCatSignIn(input: {
  actorId: string;
  email: string | null | undefined;
  byActor: KnownUser | null;
  byEmail: KnownUser | null;
  linkFor: KnownUser | null;
}): OrangeCatResolution {
  const decision = decideOrangecatSignIn(
    {
      sub: input.actorId,
      contactEmail: input.email,
      byActor: input.byActor,
      linkFor: input.linkFor && {
        id: input.linkFor.id,
        orangecatSub: input.linkFor.orangecat_actor_id,
      },
      emailTaken: Boolean(input.byEmail),
    },
    ORANGECAT_POLICY,
  );
  return decision.kind === 'refuse'
    ? { kind: 'refuse', code: loginErrorFor(decision.reason) }
    : decision;
}

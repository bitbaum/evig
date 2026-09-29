/**
 * "Sign in with OrangeCat" for evig — orangecat ADR-0009, step D8.
 *
 * OrangeCat is the fleet's identity root; evig keeps its own accounts (staff
 * grants, orders, memberships live here) and lets an account BE an OrangeCat
 * account by carrying the actor id. Everything that decides what an OrangeCat
 * sign-in means for an evig account is in this file, pure, so it is tested
 * without Auth.js or a database:
 *
 *  - `resolveOrangeCatSignIn` — the rules. An actor already linked signs in as
 *    that user. A new person gets a new account. An email that already has an
 *    evig account is NOT linked by email: OrangeCat's own password sign-up does
 *    not verify the address, so an attacker could register the victim's email
 *    there and walk in here. The person signs in with their evig password and
 *    connects OrangeCat from their profile instead — which is the third case,
 *    proven by a short-lived signed cookie minted for that signed-in user.
 *  - The provider config, with the two settings every relying party in the
 *    fleet has paid for once: `client_secret_post` and PKCE.
 *
 * Staff is never touched by any of this: `is_staff` stays the sole grant.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const ORANGECAT_PROVIDER_ID = 'orangecat';
export const ORANGECAT_SIGN_IN_SCOPE = 'openid profile email';
/** Cookie that proves "this signed-in evig user asked to connect OrangeCat". */
export const ORANGECAT_LINK_COOKIE = 'evig-oc-link';
export const ORANGECAT_LINK_TTL_SECONDS = 10 * 60;

/** Login error codes the login form maps to a sentence. */
export const ORANGECAT_LOGIN_ERRORS = {
  notLinked: 'orangecat_not_linked',
  noEmail: 'orangecat_no_email',
  alreadyLinked: 'orangecat_already_linked',
} as const;

export function isOrangeCatEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.ORANGECAT_OAUTH_CLIENT_ID && env.ORANGECAT_OAUTH_CLIENT_SECRET);
}

/** Auth.js provider config. Free of next-auth imports so it can be asserted in a test. */
export function orangecatProvider(env: Record<string, string | undefined> = process.env) {
  return {
    id: ORANGECAT_PROVIDER_ID,
    name: 'OrangeCat',
    type: 'oidc' as const,
    issuer: env.ORANGECAT_OAUTH_ISSUER ?? 'https://orangecat.ch',
    clientId: env.ORANGECAT_OAUTH_CLIENT_ID as string,
    clientSecret: env.ORANGECAT_OAUTH_CLIENT_SECRET as string,
    // OrangeCat's token endpoint accepts only client_secret_post, and it
    // requires PKCE even for confidential clients (Loki found both the hard way).
    client: { token_endpoint_auth_method: 'client_secret_post' as const },
    checks: ['pkce' as const, 'state' as const],
    authorization: { params: { scope: ORANGECAT_SIGN_IN_SCOPE } },
  };
}

// ── The rules ───────────────────────────────────────────────────────────────

export interface KnownUser {
  id: string;
  orangecat_actor_id: string | null;
}

export type OrangeCatResolution =
  | { kind: 'existing'; userId: string }
  | { kind: 'create'; email: string }
  | { kind: 'link'; userId: string }
  | { kind: 'refuse'; code: (typeof ORANGECAT_LOGIN_ERRORS)[keyof typeof ORANGECAT_LOGIN_ERRORS] };

export function resolveOrangeCatSignIn(input: {
  actorId: string;
  email: string | null | undefined;
  /** The evig user already carrying this actor id, if any. */
  byActor: KnownUser | null;
  /** The evig user with this email, if any. */
  byEmail: KnownUser | null;
  /** The signed-in user who asked to connect (from the link cookie), if any. */
  linkFor: KnownUser | null;
}): OrangeCatResolution {
  const { actorId, byActor, byEmail, linkFor } = input;
  const email = input.email?.trim().toLowerCase() || null;

  // An explicit connect from a signed-in account wins over everything: it is
  // the person's own decision, made from inside their session.
  if (linkFor) {
    if (byActor && byActor.id !== linkFor.id) {
      return { kind: 'refuse', code: ORANGECAT_LOGIN_ERRORS.alreadyLinked };
    }
    if (linkFor.orangecat_actor_id && linkFor.orangecat_actor_id !== actorId) {
      return { kind: 'refuse', code: ORANGECAT_LOGIN_ERRORS.alreadyLinked };
    }
    return { kind: 'link', userId: linkFor.id };
  }
  if (byActor) {
    return { kind: 'existing', userId: byActor.id };
  }
  if (!email) {
    // An anonymous OrangeCat account has nothing evig can address an order to.
    return { kind: 'refuse', code: ORANGECAT_LOGIN_ERRORS.noEmail };
  }
  if (byEmail) {
    return { kind: 'refuse', code: ORANGECAT_LOGIN_ERRORS.notLinked };
  }
  return { kind: 'create', email };
}

// ── The link cookie ─────────────────────────────────────────────────────────

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** `userId.expiresAt.signature` — minted for one signed-in user, ten minutes. */
export function mintLinkToken(userId: string, secret: string, nowMs = Date.now()): string {
  const payload = `${userId}.${Math.floor(nowMs / 1000) + ORANGECAT_LINK_TTL_SECONDS}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** The user id the token was minted for, or null if forged, altered or expired. */
export function readLinkToken(
  token: string | null | undefined,
  secret: string,
  nowMs = Date.now(),
): string | null {
  if (!token) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const [userId, expires, signature] = parts;
  const expected = sign(`${userId}.${expires}`, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  if (Number(expires) * 1000 < nowMs) {
    return null;
  }
  return userId || null;
}

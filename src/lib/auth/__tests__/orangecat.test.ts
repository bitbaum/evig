/**
 * "Sign in with OrangeCat": the rules that decide what an OrangeCat identity
 * means for an evig account, and the cookie that proves an explicit connect.
 * Each rule is a line a refactor could quietly drop while every happy path
 * kept passing — an email-based link in particular would let anyone who
 * registers the victim's address at OrangeCat walk in here.
 */
import {
  ORANGECAT_LOGIN_ERRORS,
  isOrangeCatEnabled,
  mintLinkToken,
  orangecatProvider,
  readLinkToken,
  resolveOrangeCatSignIn,
} from '../orangecat';

const ACTOR = '0a4a0e2e-1111-4222-8333-444455556666';
const alice = { id: 'u-alice', orangecat_actor_id: ACTOR };
const bob = { id: 'u-bob', orangecat_actor_id: null };
const none = { byActor: null, byEmail: null, linkFor: null };

describe('resolveOrangeCatSignIn', () => {
  it('signs in the account that already carries the actor id', () => {
    expect(
      resolveOrangeCatSignIn({ ...none, actorId: ACTOR, email: 'a@x', byActor: alice }),
    ).toEqual({ kind: 'existing', userId: 'u-alice' });
  });

  it('creates an account for a new person, with the email normalised', () => {
    expect(resolveOrangeCatSignIn({ ...none, actorId: ACTOR, email: ' New@Example.CH ' })).toEqual({
      kind: 'create',
      email: 'new@example.ch',
    });
  });

  it('never links by email: an existing evig account with that email is refused', () => {
    expect(
      resolveOrangeCatSignIn({ ...none, actorId: ACTOR, email: 'bob@x', byEmail: bob }),
    ).toEqual({ kind: 'refuse', code: ORANGECAT_LOGIN_ERRORS.notLinked });
  });

  it('refuses an anonymous OrangeCat account (no email to address anything to)', () => {
    expect(resolveOrangeCatSignIn({ ...none, actorId: ACTOR, email: null })).toEqual({
      kind: 'refuse',
      code: ORANGECAT_LOGIN_ERRORS.noEmail,
    });
    expect(resolveOrangeCatSignIn({ ...none, actorId: ACTOR, email: '  ' })).toMatchObject({
      kind: 'refuse',
    });
  });

  it('links when the signed-in person asked to, even across emails', () => {
    expect(
      resolveOrangeCatSignIn({
        actorId: ACTOR,
        email: 'other@x',
        byActor: null,
        byEmail: null,
        linkFor: bob,
      }),
    ).toEqual({ kind: 'link', userId: 'u-bob' });
  });

  it('refuses a connect when the actor already belongs to someone else, or the user has another', () => {
    expect(
      resolveOrangeCatSignIn({
        actorId: ACTOR,
        email: 'b@x',
        byActor: alice,
        byEmail: null,
        linkFor: bob,
      }),
    ).toEqual({ kind: 'refuse', code: ORANGECAT_LOGIN_ERRORS.alreadyLinked });
    expect(
      resolveOrangeCatSignIn({
        actorId: 'ffffffff-1111-4222-8333-444455556666',
        email: 'a@x',
        byActor: null,
        byEmail: null,
        linkFor: alice,
      }),
    ).toEqual({ kind: 'refuse', code: ORANGECAT_LOGIN_ERRORS.alreadyLinked });
  });
});

describe('link token', () => {
  const secret = 'test-secret';

  it('round-trips for the user it was minted for', () => {
    const t = mintLinkToken('u-bob', secret, 1_000_000);
    expect(readLinkToken(t, secret, 1_000_000 + 60_000)).toBe('u-bob');
  });

  it('is refused when altered, signed with another secret, expired, or missing', () => {
    const t = mintLinkToken('u-bob', secret, 1_000_000);
    expect(readLinkToken(t.replace('u-bob', 'u-eve'), secret)).toBeNull();
    expect(readLinkToken(t, 'other', 1_000_000)).toBeNull();
    expect(readLinkToken(t, secret, 1_000_000 + 11 * 60 * 1000)).toBeNull();
    expect(readLinkToken(null, secret)).toBeNull();
    expect(readLinkToken('a.b', secret)).toBeNull();
  });
});

describe('provider config', () => {
  it('is enabled only with both halves of the client pair', () => {
    expect(isOrangeCatEnabled({})).toBe(false);
    expect(isOrangeCatEnabled({ ORANGECAT_OAUTH_CLIENT_ID: 'evig' })).toBe(false);
    expect(
      isOrangeCatEnabled({ ORANGECAT_OAUTH_CLIENT_ID: 'evig', ORANGECAT_OAUTH_CLIENT_SECRET: 's' }),
    ).toBe(true);
  });

  it('keeps the two settings OrangeCat insists on', () => {
    const p = orangecatProvider({
      ORANGECAT_OAUTH_CLIENT_ID: 'evig',
      ORANGECAT_OAUTH_CLIENT_SECRET: 's',
    });
    expect(p.client.token_endpoint_auth_method).toBe('client_secret_post');
    expect(p.checks).toEqual(['pkce', 'state']);
    expect(p.issuer).toBe('https://orangecat.ch');
    expect(p.authorization.params.scope).toBe('openid profile email');
  });
});

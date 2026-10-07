/**
 * The Auth.js provider id for "Sign in with OrangeCat". OrangeCat registers the
 * callback /api/auth/callback/orangecat, so this value is fixed on both sides.
 * Its own module because lib/auth/orangecat.ts imports node:crypto and must not
 * enter a client bundle, while the sign-in buttons need the same id.
 */
export const ORANGECAT_PROVIDER_ID = 'orangecat';

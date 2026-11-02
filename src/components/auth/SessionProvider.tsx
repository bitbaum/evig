'use client';

import type { ReactNode } from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface Props {
  children: ReactNode;
  /** Session pre-fetched server-side in the root layout. */
  session?: Session | null;
}

/**
 * The `useSession` context for every page. Sign-in itself is AccountKit's
 * (src/lib/auth/shared/), but many components still read the session
 * through `next-auth/react`'s `useSession`, and `signOut` relies on this
 * provider to tell other tabs. `/api/auth/*` serves that protocol through
 * AccountKit's compat layer.
 *
 * The provider is one component type from the first server render to the last
 * client render. It used to lazy-load `next-auth/react` and swap a fallback
 * context provider for the real one after hydration; a different element type
 * at the root makes React unmount and remount the whole page, so every page
 * lost its client state once (AccountKit's reset form lost its token). The
 * lazy load bought nothing: `next-auth/react` was already in the bundle
 * through `SessionContext` and every `useSession` import, and the circular
 * dependency it worked around is handled by `transpilePackages` in
 * next.config.js. `SessionProvider.test.tsx` pins this.
 *
 * Passing `session` starts the context authenticated or unauthenticated, never
 * `loading`, and the provider does not refetch it on mount.
 */
export function SessionProvider({ children, session }: Props) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      basePath="/api/auth"
    >
      {children}
    </NextAuthSessionProvider>
  );
}

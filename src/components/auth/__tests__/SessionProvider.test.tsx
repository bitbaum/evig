/**
 * The session provider must keep one tree from the server render through
 * hydration and after. It once swapped its component type when
 * `next-auth/react` finished loading, which made React remount every page and
 * drop its client state (AccountKit's reset form lost its token).
 */
import { act, useEffect, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '../SessionProvider';

// vitest.setup.ts mocks next-auth/react for every suite; this one needs the real provider.
vi.unmock('next-auth/react');

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const session: Session = {
  user: {
    id: 'u1',
    email: 'person@example.org',
    isStaff: false,
    staffPermissions: [],
    isSuperAdmin: false,
    dashboardMode: 'volunteer',
  },
  expires: '2999-01-01T00:00:00.000Z',
};

let mounts = 0;

function Page() {
  const [value, setValue] = useState('server');
  const { status } = useSession();
  useEffect(() => {
    mounts += 1;
    // Set as hydration commits, before anything the provider could load later.
    queueMicrotask(() => setValue('kept'));
  }, []);
  return (
    <p data-testid="page" data-status={status}>
      {value}
    </p>
  );
}

function tree(initial: Session | null) {
  return (
    <SessionProvider session={initial}>
      <Page />
    </SessionProvider>
  );
}

/** Lets pending imports, promises and timers settle. */
async function settle() {
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
}

describe('SessionProvider', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    root = null;
    container = null;
    mounts = 0;
    vi.restoreAllMocks();
  });

  async function hydrate(initial: Session | null) {
    container = document.createElement('div');
    container.innerHTML = renderToString(tree(initial));
    document.body.appendChild(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      root = hydrateRoot(container!, tree(initial));
    });
    await settle();
    return { el: container.querySelector('[data-testid="page"]')!, errors };
  }

  it.each([
    ['signed in', session, 'authenticated'],
    ['signed out', null, 'unauthenticated'],
  ] as const)('does not remount the page after hydration (%s)', async (_, initial, status) => {
    const { el, errors } = await hydrate(initial);

    expect(mounts).toBe(1);
    expect(el.textContent).toBe('kept');
    expect(el.getAttribute('data-status')).toBe(status);
    // The node React hydrated is still the one in the document.
    expect(container!.querySelector('[data-testid="page"]')).toBe(el);
    // No hydration mismatch: server and client rendered the same tree.
    expect(errors.mock.calls.map((c) => String(c[0]))).toEqual([]);
  });

  it('renders the server-known status on the server, never loading', () => {
    expect(renderToString(tree(session))).toContain('data-status="authenticated"');
    expect(renderToString(tree(null))).toContain('data-status="unauthenticated"');
  });
});

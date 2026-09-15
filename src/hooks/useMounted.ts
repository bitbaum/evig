import { useSyncExternalStore } from 'react';

const subscribeToNothing = () => () => {};

/**
 * `false` during SSR and hydration, `true` once the component is mounted in
 * the browser — the store-of-nothing idiom: React reads the server snapshot
 * while hydrating and the client snapshot after, so the value flips without
 * an effect and without a setState-in-effect.
 *
 * Use it for the things only a browser can know: a portal target, the local
 * timezone's "today", a theme resolved from the DOM. Deliberately NOT
 * `useState(false)` + `useEffect(() => setMounted(true))` — that is the same
 * flip one render later, plus a lint exception at every site.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

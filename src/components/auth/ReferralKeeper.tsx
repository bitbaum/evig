'use client';

import { useEffect } from 'react';

/**
 * Keeps `?ref=…` from a referral link for the sign-up that follows
 * (src/lib/auth/shared/evig-plugin.ts redeems it). An hour is enough to fill
 * in the form; nothing else reads the cookie.
 */
export function ReferralKeeper() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('ref');
    if (!code || !/^[\w-]{1,64}$/.test(code)) return;
    document.cookie = `evig_ref=${encodeURIComponent(code)}; path=/; max-age=3600; samesite=lax`;
  }, []);
  return null;
}

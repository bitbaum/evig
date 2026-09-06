export const dynamic = 'force-dynamic';

import { hirnLivenessHandler } from '@/lib/hirn/liveness';

// Can Hirn reach a model RIGHT NOW?
//
//   GET /api/health/ai            free. What the last real chat did.
//   GET /api/health/ai?probe=1    a real call. Needs AI_PROBE_SECRET, via the
//                                 `x-probe-secret` header or `?secret=`.
//
// Separate from /api/health on purpose, because the two have opposite
// contracts. That route is what deploy monitoring curls, and a dead provider
// key must never fail the check that triggers a restart — a restart cannot fix
// a key. This route inverts it: 200 only when a model actually answered, 503
// when the chain could not, so an uptime monitor can watch this URL and page on
// a real AI outage without paging on every deploy.
//
// A probe spends real tokens from the daily budget Hirn's own chats draw on, so
// ai-kit gates it behind the secret and caches a SUCCESS for ten minutes: a
// monitor in a retry loop cannot drain the allowance and take Hirn down with
// it. A FAILURE is never cached, because the point is the truth about now.
//
// With AI_PROBE_SECRET unset the route answers 501 — an app that forgets to
// configure it gets an endpoint that cannot spend money, not an open one.
export const GET = hirnLivenessHandler;

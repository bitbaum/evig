/**
 * SWR helpers that bridge SWR's promise-rejects-on-failure expectation
 * with the codebase's `apiFetch` which returns `{ success, data, error }`.
 *
 * Why SWR: React 18 doesn't have the `use(Promise)` API (React 19 only),
 * and the React Compiler's `react-hooks/set-state-in-effect` rule flags
 * the legacy useEffect + setState data-fetching pattern that this
 * codebase has been using in 5 admin hooks. SWR is the standard React-18
 * answer for client-side data fetching: small (~5kb), no setState-in-
 * effect under the hood (it uses useSyncExternalStore internally), and
 * gives us cache + revalidation as free upside.
 *
 * Why a thin wrapper: SWR fetchers throw on error so SWR can put the
 * Promise in a rejected state. Our `apiFetch` returns a structured
 * { success, data, error } object that callers branch on. The wrapper
 * translates: { success: true } → resolve(data), { success: false } →
 * throw new Error(error). This way fetch-hook migrations look like:
 *
 *   const { data, error, isLoading } = useSwrFetch<T>(url)
 *
 * and the error/loading branches mirror the current shape exactly.
 */

import useSWR, { type SWRConfiguration, type SWRResponse } from 'swr'
import { apiFetch } from './client'

/**
 * SWR fetcher that wraps apiFetch. Throws on { success: false } so SWR
 * surfaces the error via response.error.
 */
async function apiFetchSwrFetcher<T>(url: string): Promise<T> {
  const result = await apiFetch<T>(url)
  if (!result.success) {
    throw new Error(result.error || 'Request failed')
  }
  // result.data may legitimately be undefined when the endpoint returns
  // a success envelope without a body — cast through unknown to satisfy
  // strict TS when callers know what shape they expect.
  return result.data as T
}

/**
 * Client-side data fetch with SWR.
 *
 * - Pass `null` as the key to disable the fetch (e.g., before auth is
 *   ready); SWR will skip and `data` stays undefined.
 * - The fetcher uses the same apiFetch pipeline as the rest of the app
 *   (auth cookies, base URL, error handling).
 */
export function useSwrFetch<T>(
  key: string | null,
  config?: SWRConfiguration<T>,
): SWRResponse<T> {
  return useSWR<T>(key, apiFetchSwrFetcher, config)
}

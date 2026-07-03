/**
 * Client-side API fetch wrapper — SINGLE SOURCE OF TRUTH
 *
 * Provides consistent error handling, response parsing, and typing
 * for all client-side API calls. Replaces 100+ scattered fetch() patterns.
 *
 * Usage:
 *   const { data, error } = await apiFetch<UserProfile>('/api/user/profile')
 *   const { data, error } = await apiFetch<void>('/api/admin/erfassung', {
 *     method: 'POST',
 *     body: { title: 'New Product' },
 *   })
 */

import type { ApiResponse } from './types'
import { withClientCsrfHeader } from './csrf-client'

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  /** Pass true when body is FormData (skips JSON.stringify and Content-Type header) */
  formData?: boolean
}

/**
 * Type-safe API fetch wrapper.
 * Always returns { success, data?, error? } — never throws.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, formData = false } = options

  const fetchOptions: RequestInit = {
    method,
    headers: withClientCsrfHeader({
      ...(body !== undefined && !formData ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    }, method),
    ...(body !== undefined ? { body: formData ? (body as BodyInit) : JSON.stringify(body) } : {}),
  }

  try {
    const response = await fetch(url, fetchOptions)
    const data = await response.json().catch(() => ({}))

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Anfrage fehlgeschlagen (${response.status})`,
      }
    }

    return { success: true, data: data.data as T }
  } catch {
    return {
      success: false,
      error: 'Netzwerkfehler. Bitte versuche es erneut.',
    }
  }
}

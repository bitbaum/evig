/**
 * Client-side API fetch wrapper — SINGLE SOURCE OF TRUTH
 *
 * Provides consistent error handling, response parsing, and typing
 * for all client-side API calls. Replaces 100+ scattered fetch() patterns.
 *
 * Usage:
 *   const { data, error } = await apiFetch<UserProfile>('/api/user/profile')
 *   const { data, error } = await apiFetch<void>('/api/admin/products', {
 *     method: 'POST',
 *     body: { title: 'New Product' },
 *   })
 */

import type { ApiResponse } from './types'

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

/**
 * Type-safe API fetch wrapper.
 * Always returns { success, data?, error? } — never throws.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = options

  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
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
      error: 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
    }
  }
}

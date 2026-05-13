const CSRF_COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-csrf' : 'csrf'
export const CSRF_HEADER_NAME = 'x-csrf-token'
const PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function getClientCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const escapedName = CSRF_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function methodNeedsCsrf(method: string | undefined): boolean {
  return PROTECTED_METHODS.has((method || 'GET').toUpperCase())
}

export function withClientCsrfHeader(
  headers: Record<string, string>,
  method: string | undefined
): Record<string, string> {
  if (!methodNeedsCsrf(method) || headers[CSRF_HEADER_NAME]) return headers
  const token = getClientCsrfToken()
  return token ? { ...headers, [CSRF_HEADER_NAME]: token } : headers
}

'use client'

import { useEffect } from 'react'
import { CSRF_HEADER_NAME, getClientCsrfToken, methodNeedsCsrf } from '@/lib/api/csrf-client'

let installed = false

function isAuthEndpoint(input: RequestInfo | URL): boolean {
  const url = input instanceof Request ? input.url : input.toString()
  return new URL(url, window.location.origin).pathname.startsWith('/api/auth/')
}

export function CsrfFetchProvider() {
  useEffect(() => {
    if (installed || typeof window === 'undefined') return
    installed = true

    const originalFetch = window.fetch.bind(window)
    window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
      if (isAuthEndpoint(input)) {
        return originalFetch(input, init)
      }

      const method = init.method || (input instanceof Request ? input.method : 'GET')
      if (!methodNeedsCsrf(method)) {
        return originalFetch(input, init)
      }

      const token = getClientCsrfToken()
      if (!token) {
        return originalFetch(input, init)
      }

      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined))
      if (!headers.has(CSRF_HEADER_NAME)) {
        headers.set(CSRF_HEADER_NAME, token)
      }

      return originalFetch(input, { ...init, headers })
    }
  }, [])

  return null
}

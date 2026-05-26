/**
 * Tests for useAppointments — the dashboard appointments hook.
 *
 * Locks in the role-aware behavior shipped across 9af5f561 (the
 * ?role=repairer end-to-end wire-up), 945c57df (role-aware empty
 * state), and 1f694bba (role-aware pageSubtitle):
 *
 *   - isRepairerView is true iff searchParams.role === 'repairer'
 *   - apiFetch URL is /api/appointments?role=repairer for the
 *     repairer view, plain /api/appointments otherwise (the API has
 *     supported the ?role param since the route was created — the
 *     hook had been dropping it before 9af5f561, sending repairers
 *     to customer-mode and an empty list)
 *   - login-redirect callbackUrl preserves ?role=repairer so a
 *     deep-link from a notification email survives the auth round-
 *     trip; without this, a logged-out repairer clicks the email,
 *     authenticates, and lands on customer-mode by default
 *
 * If a future refactor regresses any of these, the role-aware empty
 * state and pageSubtitle changes would silently revert to the
 * customer-flavored copy and the repairer notification-email flow
 * would break again.
 */

const mockRouterPush = jest.fn()
const mockRouterReplace = jest.fn()
const mockUseSession = jest.fn()
const mockApiFetch = jest.fn()
const mockSearchParams = new Map<string, string>()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) ?? null,
  }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}))

jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch.apply(null, args),
}))

import { renderHook, waitFor } from '@testing-library/react'
import { useAppointments } from '../useAppointments'

const ERRORS = {
  loadError: 'Konnte nicht laden',
  cancelFailed: 'Konnte nicht stornieren',
  saveError: 'Konnte nicht speichern',
}

beforeEach(() => {
  mockRouterPush.mockReset()
  mockRouterReplace.mockReset()
  mockUseSession.mockReset()
  mockApiFetch.mockReset()
  mockSearchParams.clear()

  // Default: authenticated session with appointments fetched OK
  mockUseSession.mockReturnValue({
    data: { user: { id: 'u-1', email: 'u@example.com' } },
    status: 'authenticated',
  })
  mockApiFetch.mockResolvedValue({ success: true, data: { appointments: [] } })
})

// ============================================================================
// isRepairerView derivation
// ============================================================================

describe('useAppointments — isRepairerView', () => {
  it('is false when no role param is present', () => {
    const { result } = renderHook(() => useAppointments(ERRORS))
    expect(result.current.isRepairerView).toBe(false)
  })

  it('is true when ?role=repairer is set', () => {
    mockSearchParams.set('role', 'repairer')
    const { result } = renderHook(() => useAppointments(ERRORS))
    expect(result.current.isRepairerView).toBe(true)
  })

  it('is false for any other role value (defensive — API treats anything !== repairer as customer)', () => {
    mockSearchParams.set('role', 'admin')
    const { result } = renderHook(() => useAppointments(ERRORS))
    expect(result.current.isRepairerView).toBe(false)
  })

  it('is false for an empty role value', () => {
    mockSearchParams.set('role', '')
    const { result } = renderHook(() => useAppointments(ERRORS))
    expect(result.current.isRepairerView).toBe(false)
  })
})

// ============================================================================
// /api/appointments URL forwarding
// ============================================================================

describe('useAppointments — API URL forwarding', () => {
  it('calls /api/appointments without ?role when no role param', async () => {
    renderHook(() => useAppointments(ERRORS))

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    expect(mockApiFetch).toHaveBeenCalledWith('/api/appointments')
  })

  it('calls /api/appointments?role=repairer when role=repairer', async () => {
    mockSearchParams.set('role', 'repairer')
    renderHook(() => useAppointments(ERRORS))

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    expect(mockApiFetch).toHaveBeenCalledWith('/api/appointments?role=repairer')
  })

  it('does NOT forward unknown role values (API would 400 — the hook silently drops them)', async () => {
    // The hook treats anything !== 'repairer' as customer-mode (the API's
    // default). A stray ?role=garbage doesn't trigger an API 400 because
    // the param never reaches the API.
    mockSearchParams.set('role', 'garbage')
    renderHook(() => useAppointments(ERRORS))

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    expect(mockApiFetch).toHaveBeenCalledWith('/api/appointments')
  })
})

// ============================================================================
// Login-redirect callbackUrl preservation
// ============================================================================

describe('useAppointments — login redirect preserves role', () => {
  it('callbackUrl is /dashboard/appointments without role when unauthenticated, no role param', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    renderHook(() => useAppointments(ERRORS))

    expect(mockRouterPush).toHaveBeenCalledWith(
      '/auth/login?callbackUrl=%2Fdashboard%2Fappointments',
    )
  })

  it('callbackUrl preserves ?role=repairer so deep-links from notification emails survive auth', () => {
    // Without this, a logged-out repairer who clicks an appointment
    // notification email link gets bounced through login and lands on
    // customer-mode (the API call drops the role on the post-login fetch).
    mockSearchParams.set('role', 'repairer')
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    renderHook(() => useAppointments(ERRORS))

    expect(mockRouterPush).toHaveBeenCalledWith(
      '/auth/login?callbackUrl=%2Fdashboard%2Fappointments%3Frole%3Drepairer',
    )
  })
})

// ============================================================================
// payment-success URL cleanup preserves role
// ============================================================================

describe('useAppointments — payment-success URL cleanup', () => {
  it('strips ?payment=success but preserves ?role=repairer', async () => {
    // A repairer who clicks the email + completes a payment shouldn't
    // be bumped from repairer-mode to customer-mode just because the
    // payment-success cleanup ran. The hook routes the URL replace
    // through the role-preserved callbackUrl.
    mockSearchParams.set('payment', 'success')
    mockSearchParams.set('role', 'repairer')

    renderHook(() => useAppointments(ERRORS))

    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalled())
    expect(mockRouterReplace).toHaveBeenCalledWith(
      '/dashboard/appointments?role=repairer',
    )
  })

  it('strips ?payment=success to plain /dashboard/appointments when no role', async () => {
    mockSearchParams.set('payment', 'success')

    renderHook(() => useAppointments(ERRORS))

    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalled())
    expect(mockRouterReplace).toHaveBeenCalledWith('/dashboard/appointments')
  })
})

import { TextEncoder, TextDecoder } from 'util'
import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for jsdom environment (needed by pg/Drizzle)
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock next-auth (server-side)
jest.mock('next-auth', () => ({
  auth: jest.fn(() => Promise.resolve(null)),
}))

// Mock fetch
global.fetch = jest.fn()

// Browser-only mocks (skip in node environment for API route tests)
if (typeof window !== 'undefined') {
  // jsdom has no PointerEvent — without it, testing-library's
  // fireEvent.pointerDown/Move/… falls back to a bare Event that silently
  // drops pointerType, button, clientX/Y and modifier keys. Extending
  // MouseEvent keeps all of those and adds the pointer fields.
  if (typeof window.PointerEvent === 'undefined') {
    class PointerEventPolyfill extends MouseEvent {
      constructor(type, init = {}) {
        super(type, init)
        this.pointerType = init.pointerType ?? ''
        this.pointerId = init.pointerId ?? 1
        this.isPrimary = init.isPrimary ?? true
      }
    }
    window.PointerEvent = PointerEventPolyfill
  }

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {
      return null
    }
    disconnect() {
      return null
    }
    unobserve() {
      return null
    }
  }
}







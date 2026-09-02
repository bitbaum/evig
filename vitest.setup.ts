import { TextEncoder, TextDecoder } from 'util';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill TextEncoder/TextDecoder for jsdom environment (needed by pg/Drizzle)
global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '/',
      push: vi.fn(),
      pop: vi.fn(),
      reload: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      beforePopState: vi.fn(),
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
    };
  },
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}));

// Mock next-auth (server-side)
vi.mock('next-auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));

// Mock fetch
global.fetch = vi.fn();

// Browser-only mocks (skip in node environment for API route tests)
if (typeof window !== 'undefined') {
  // jsdom has no PointerEvent -- without it, testing-library's
  // fireEvent.pointerDown/Move/... falls back to a bare Event that silently
  // drops pointerType, button, clientX/Y and modifier keys. Extending
  // MouseEvent keeps all of those and adds the pointer fields.
  if (typeof window.PointerEvent === 'undefined') {
    class PointerEventPolyfill extends MouseEvent {
      pointerType: string;
      pointerId: number;
      isPrimary: boolean;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerType = init.pointerType ?? '';
        this.pointerId = init.pointerId ?? 1;
        this.isPrimary = init.isPrimary ?? true;
      }
    }
    // @ts-expect-error -- polyfill assignment, not a real PointerEvent subclass
    window.PointerEvent = PointerEventPolyfill;
  }

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {
      return null;
    }
    disconnect() {
      return null;
    }
    unobserve() {
      return null;
    }
  } as unknown as typeof IntersectionObserver;
}

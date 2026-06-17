'use client'

import type { Session } from 'next-auth'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { CsrfFetchProvider } from '@/components/providers/CsrfFetchProvider'
import { DropdownProvider } from '@/lib/contexts/DropdownContext'
import { SessionProvider } from '@/components/auth/SessionProvider'
import { CartProvider } from '@/components/marketplace/cart/CartProvider'

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode
  session?: Session | null
}) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <DropdownProvider>
          <CartProvider>
            <CsrfFetchProvider />
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </CartProvider>
        </DropdownProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}

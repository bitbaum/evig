'use client'

import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { DropdownProvider } from '@/lib/contexts/DropdownContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DropdownProvider>
        {children}
      </DropdownProvider>
    </ThemeProvider>
  )
}

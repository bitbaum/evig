'use client'

import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { DropdownProvider } from '@/lib/contexts/DropdownContext'
import { SuggestionProvider } from '@/features/feedback/contexts/FeedbackContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DropdownProvider>
        <SuggestionProvider>
          {children}
        </SuggestionProvider>
      </DropdownProvider>
    </ThemeProvider>
  )
}

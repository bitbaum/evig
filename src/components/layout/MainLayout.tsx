'use client'

import { ReactNode } from 'react'
import { Header } from './header'
import Footer from './Footer'
import { RevampCopilot, SuggestionButton } from '@/features/floating-ui'
import { MessageButton } from '@/components/messaging/MessageButton'

interface MainLayoutProps {
  children: ReactNode
  /** Skip copilot + suggestion widgets on task-focused pages. */
  leanChrome?: boolean
}

export default function MainLayout({ children, leanChrome = false }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <main>
        {children}
      </main>

      <Footer />

      {!leanChrome && (
        <>
          <RevampCopilot />
          <SuggestionButton />
        </>
      )}
    </div>
  )
} 

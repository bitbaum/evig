'use client'

import { ReactNode } from 'react'
import { Header } from './header'
import Footer from './Footer'
import { RevampCopilot, SuggestionButton } from '@/features/floating-ui'
import { MessageButton } from '@/components/messaging/MessageButton'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <main>
        {children}
      </main>

      <Footer />

      {/* AI Navigation Assistant - Bottom Right */}
      <RevampCopilot />

      {/* Comprehensive Page Improvement Suggestions - Right Side */}
      <SuggestionButton />
    </div>
  )
} 

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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header />

      <main className="pt-20">
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

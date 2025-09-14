'use client'

import { ReactNode } from 'react'
import { Header } from './Header'
import Footer from './Footer'
import SuggestionButton from '@/components/ui/SuggestionButton'
import RevampCopilot from '@/components/ui/RevampCopilot'
import { SuggestionProvider } from '@/contexts/SuggestionContext'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SuggestionProvider>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <Header />
        
        <main className="pt-20">
          {children}
        </main>

        <Footer />
        
        {/* AI Navigation Assistant - Bottom Right */}
        <RevampCopilot />
        
        {/* Page Improvement Suggestions - Right Side (Upper Third) */}
        <SuggestionButton />
      </div>
    </SuggestionProvider>
  )
} 
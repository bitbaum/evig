'use client'

import { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { Header } from './Header'
import Footer from './Footer'

const RevampCopilot = dynamic(() => import('@/components/ui/RevampCopilot'), { ssr: false })
// Cleaned: use the refactored SuggestionButton (renamed to canonical path)
const SuggestionButton = dynamic(() => import('@/components/ui/SuggestionButton'), { ssr: false })

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
        
        {/* Page Improvement Suggestions - Right Side (Upper Third) */}
        <SuggestionButton />
      </div>
  )
} 

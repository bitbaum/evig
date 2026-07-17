'use client'

import { ReactNode } from 'react'
import { Header } from './header'
import Footer from './Footer'
import { HirnPublicFab } from '@/components/hirn/HirnPublicFab'
import { FleetCrownFeedbackEmbed } from '@/components/feedback/FleetCrownFeedbackEmbed'

interface MainLayoutProps {
  children: ReactNode
  /** Skip assistant + suggestion widgets on task-focused pages. */
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
          <HirnPublicFab />
          <FleetCrownFeedbackEmbed />
        </>
      )}
    </div>
  )
}

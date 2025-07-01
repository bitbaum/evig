'use client'

import { ReactNode } from 'react'
import { Header } from './Header'
import Footer from './Footer'

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
    </div>
  )
} 
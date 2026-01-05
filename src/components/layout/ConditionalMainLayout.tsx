'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import MainLayout from './MainLayout'

interface ConditionalMainLayoutProps {
  children: ReactNode
}

export default function ConditionalMainLayout({ children }: ConditionalMainLayoutProps) {
  const pathname = usePathname()
  
  // Don't apply MainLayout to admin pages
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>
  }
  
  // Don't apply MainLayout to Medusa shop pages (they have their own layout)
  if (pathname?.startsWith('/shop/medusa')) {
    return <>{children}</>
  }
  
  // Don't apply MainLayout to auth pages (they have their own layout)
  // This prevents session checks from blocking auth page loads
  if (pathname?.startsWith('/auth')) {
    return <>{children}</>
  }
  
  // Apply MainLayout to all other pages
  return <MainLayout>{children}</MainLayout>
}
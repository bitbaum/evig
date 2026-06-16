'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import MainLayout from './MainLayout'

interface ConditionalMainLayoutProps {
  children: ReactNode
  /** Hide floating assistants on focused task surfaces (dashboard, checkout). */
  leanChrome?: boolean
}

export default function ConditionalMainLayout({
  children,
  leanChrome = false,
}: ConditionalMainLayoutProps) {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) {
    return <>{children}</>
  }

  if (pathname?.startsWith('/auth')) {
    return <>{children}</>
  }

  return <MainLayout leanChrome={leanChrome}>{children}</MainLayout>
}

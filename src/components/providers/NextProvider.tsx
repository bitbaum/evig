'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface NextProviderProps {
  children: ReactNode
}

export function NextProvider({ children }: NextProviderProps) {
  const pathname = usePathname()
  
  return (
    <>
      {children}
    </>
  )
} 
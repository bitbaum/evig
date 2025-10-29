import React from 'react'

interface UnifiedHeaderProps {
  children?: React.ReactNode
}

export default function UnifiedHeader({ children }: UnifiedHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {children || <h1 className="text-xl font-semibold">Header</h1>}
      </div>
    </header>
  )
}


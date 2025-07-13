'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HeroBannerProps {
  title: string
  description: string
  children?: ReactNode
  className?: string
}

export function HeroBanner({
  title,
  description,
  children,
  className = ''
}: HeroBannerProps) {
  return (
    <section className={cn(
      'relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden',
      className
    )}>
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{title}</h1>
          <p className="text-xl text-green-100 mb-8">
            {description}
          </p>
          {children}
        </div>
      </div>
    </section>
  )
} 
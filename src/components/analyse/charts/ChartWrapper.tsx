'use client'

import { ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ChartWrapperProps {
  title: string
  description?: string
  source?: string
  sourceDate?: string
  height?: number
  children: ReactNode
}

/**
 * Responsive chart container with source attribution.
 * All charts should be wrapped in this component for consistent styling.
 */
export function ChartWrapper({
  title,
  description,
  source,
  sourceDate,
  height = 300,
  children,
}: ChartWrapperProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
        {source && (
          <div className="mt-2 text-xs text-muted-foreground">
            Quelle: {source}
            {sourceDate && ` (${sourceDate})`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

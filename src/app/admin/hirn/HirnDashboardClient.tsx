'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp, PiggyBank, Target, Eye, Brain, MessageSquare } from 'lucide-react'
import type { Insight } from '@/lib/hirn/data/analysis'

// ============================================================================
// Types
// ============================================================================

interface DashboardStat {
  value: number
  label: string
  numberKey: string
  format: 'CHF' | 'percent' | 'number'
}

interface HirnDashboardClientProps {
  stats: DashboardStat[]
  insights: Insight[]
  year: number
  dataSource: {
    file: string
    importedAt: string
  }
  userRole: string
}

// ============================================================================
// Constants
// ============================================================================

const QUICK_LINKS = [
  {
    title: 'AI Assistent',
    description: 'Fragen zu RevampIT mit KI beantworten',
    href: '/admin/hirn/ai',
    icon: MessageSquare,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
  {
    title: 'Finanzen',
    description: 'Detaillierte Finanzübersicht und Trends',
    href: '/admin/hirn/finanzen',
    icon: PiggyBank,
    color: 'bg-blue-500',
  },
  {
    title: 'Kennzahlen',
    description: 'Alle KPIs auf einen Blick',
    href: '/admin/hirn/kennzahlen',
    icon: TrendingUp,
    color: 'bg-purple-500',
  },
  {
    title: 'Wirkung',
    description: 'Ökologische und soziale Wirkung',
    href: '/admin/hirn/wirkung',
    icon: Target,
    color: 'bg-green-500',
  },
  {
    title: 'Transparenz',
    description: 'First Principles Analyse',
    href: '/admin/hirn/transparenz',
    icon: Eye,
    color: 'bg-orange-500',
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

function formatValue(value: number, format: 'CHF' | 'percent' | 'number'): string {
  switch (format) {
    case 'CHF':
      return `CHF ${value.toLocaleString('de-CH')}`
    case 'percent':
      return `${value.toFixed(1)}%`
    default:
      return value.toLocaleString('de-CH')
  }
}

// ============================================================================
// Component
// ============================================================================

export function HirnDashboardClient({
  stats,
  insights,
  year,
  dataSource,
  userRole,
}: HirnDashboardClientProps) {
  // Find specific insights for display
  const selfFinancingInsight = insights.find(
    i => i.id === 'high_self_financing' || i.id === 'low_self_financing'
  )
  const monthlyAvgInsight = insights.find(i => i.id === 'monthly_avg')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold">Hirn Dashboard</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Transparente Übersicht über Finanzen, KPIs und Wirkung von Revamp-IT
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Rolle: <span className="font-medium">{userRole}</span>
        </div>
      </div>

      {/* Hero Stats - Real Data */}
      <Card>
        <CardHeader>
          <CardTitle>Überblick {year}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Echte Zahlen aus Kivitendo-Buchhaltung
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(stat => (
              <div
                key={stat.numberKey}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="text-2xl font-bold text-primary">
                  {formatValue(stat.value, stat.format)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Source Badge */}
      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm">
        <span className="font-semibold text-green-700 dark:text-green-400">
          ✓ Echte Daten
        </span>
        <span className="text-muted-foreground ml-2">
          Quelle:{' '}
          <code className="bg-white dark:bg-gray-800 px-1 rounded">
            {dataSource.file}
          </code>{' '}
          • Importiert:{' '}
          {new Date(dataSource.importedAt).toLocaleDateString('de-CH')}
        </span>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {QUICK_LINKS.map(link => (
          <Card
            key={link.href}
            className="hover:shadow-lg transition-all cursor-pointer group"
          >
            <Link href={link.href}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`${link.color} text-white p-3 rounded-lg`}
                  >
                    <link.icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {link.description}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  Ansehen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Insights from Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse & Erkenntnisse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selfFinancingInsight && (
            <div
              className={`flex items-start gap-3 p-4 border-l-4 rounded ${
                selfFinancingInsight.type === 'positive'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
              }`}
            >
              <span className="text-2xl">
                {selfFinancingInsight.type === 'positive' ? '✓' : '⚠️'}
              </span>
              <div>
                <h4 className="font-semibold mb-1">
                  {selfFinancingInsight.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selfFinancingInsight.description}
                </p>
                {selfFinancingInsight.formula && (
                  <p className="text-xs font-mono mt-2 bg-white/50 dark:bg-gray-800 px-2 py-1 rounded inline-block">
                    {selfFinancingInsight.formula}
                  </p>
                )}
              </div>
            </div>
          )}

          {monthlyAvgInsight && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
              <span className="text-2xl">📈</span>
              <div>
                <h4 className="font-semibold mb-1">{monthlyAvgInsight.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {monthlyAvgInsight.description}
                </p>
                {monthlyAvgInsight.formula && (
                  <p className="text-xs font-mono mt-2 bg-white/50 dark:bg-gray-800 px-2 py-1 rounded inline-block">
                    {monthlyAvgInsight.formula}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Additional insights */}
          {insights
            .filter(
              i =>
                i.id !== 'high_self_financing' &&
                i.id !== 'low_self_financing' &&
                i.id !== 'monthly_avg'
            )
            .slice(0, 2)
            .map(insight => (
              <div
                key={insight.id}
                className={`flex items-start gap-3 p-4 border-l-4 rounded ${
                  {
                    positive: 'bg-green-50 dark:bg-green-900/20 border-green-500',
                    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500',
                    neutral: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500',
                    negative: 'bg-red-50 dark:bg-red-900/20 border-red-500',
                  }[insight.type]
                }`}
              >
                <span className="text-2xl">
                  {insight.type === 'positive'
                    ? '✓'
                    : insight.type === 'warning'
                    ? '⚠️'
                    : 'ℹ️'}
                </span>
                <div>
                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import Link from 'next/link'
import {
  Package,
  Plus,
  TrendingUp,
  DollarSign,
  Eye,
  Users,
  ArrowRight,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { ListingImage } from '@/components/marketplace/ListingImage'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { ROLES } from '@/lib/constants'
import { LISTING_STATUS_CONFIG } from '@/config/marketplace'
import type { ListingStatus } from '@/config/marketplace'

interface Product {
  id: string
  title: string
  price: number
  status: string
  viewsCount: number
  favoritesCount: number
  condition: string
  category: string
  image: string | null
  createdAt: string
}

interface Stats {
  totalProducts: number
  activeProducts: number
  totalViews: number
  totalFavorites: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
}

interface DashboardData {
  stats: Stats
  products: Product[]
}

export default function SellerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Set page title
    document.title = 'Seller Dashboard | RevampIT'
  }, [])

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/auth/login')
      return
    }

    const userRole = session.user.role as string
    // UNIFIED: Check seller role OR admin access (old role OR new is_staff system)
    const hasAdminAccess =
      userRole === ROLES.REVAMPIT_ADMIN ||
      session.user.isStaff === true ||
      session.user.isSuperAdmin === true
    const hasAccess = userRole === ROLES.SELLER || hasAdminAccess

    if (!hasAccess) {
      router.push('/dashboard')
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiFetch<DashboardData>('/api/seller/dashboard')

      if (result.success && result.data) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Fehler beim Laden des Dashboards')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Neues Produkt',
      description: 'Produkt zum Marketplace hinzufügen',
      href: '/marketplace/sell',
      icon: Plus,
      color: 'bg-green-500',
    },
    {
      title: 'Meine Produkte',
      description: 'Alle deine Produkte verwalten',
      href: '/dashboard/listings',
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Verkäufe',
      description: 'Bestellungen und Verkäufe anzeigen',
      href: '/dashboard/orders',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Marketplace',
      description: 'Marketplace ansehen',
      href: '/marketplace',
      icon: BarChart3,
      color: 'bg-orange-500',
    },
  ]

  const getStatusLabel = (status: string) => {
    const config = LISTING_STATUS_CONFIG[status as ListingStatus]
    if (config) return { label: config.label, className: config.color }
    return { label: status, className: 'bg-gray-100 text-gray-800' }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Dashboard wird geladen...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <Heading level={3} className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Fehler beim Laden
        </Heading>
        <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
        <Button onClick={fetchDashboardData} variant="destructive" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Erneut versuchen
        </Button>
      </div>
    )
  }

  const stats = data?.stats || {
    totalProducts: 0,
    activeProducts: 0,
    totalViews: 0,
    totalFavorites: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  }

  const products = data?.products || []

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <Heading level={1} className="text-2xl font-bold mb-2">
              Seller Dashboard
            </Heading>
            <p className="text-green-100">
              Verwalte deine Produkte im RevampIT Marketplace und verfolge deine Verkäufe.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Meine Produkte</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</p>
              <p className="text-sm text-green-600">{stats.activeProducts} aktiv</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Umsatz</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                CHF {stats.totalRevenue.toLocaleString('de-CH')}
              </p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Gesamtumsatz
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Produkt-Aufrufe</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalViews.toLocaleString()}</p>
              <p className="text-sm text-blue-600">{stats.totalFavorites} Favoriten</p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bestellungen</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
              <p className="text-sm text-purple-600">ausstehend: {stats.pendingOrders}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <Heading level={2} className="text-lg font-semibold text-gray-900 dark:text-white">
              Meine Produkte
            </Heading>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Übersicht Ihrer Produkte
            </p>
          </div>

          <div className="p-6">
            {products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Du hast noch keine Produkte erstellt.
                </p>
                <Link
                  href="/marketplace/sell"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Erstes Produkt erstellen
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => {
                  const statusInfo = getStatusLabel(product.status)
                  return (
                    <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div className="w-12 h-12 rounded-lg overflow-hidden">
                        <ListingImage src={product.image} alt={product.title} fallbackIconSize="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Heading level={3} className="font-medium text-gray-900 dark:text-white truncate">
                          {product.title}
                        </Heading>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          CHF {product.price} • {product.viewsCount} Aufrufe
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {products.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link
                  href="/dashboard/listings"
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 font-medium flex items-center gap-1"
                >
                  Alle Produkte verwalten
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <Heading level={2} className="text-lg font-semibold text-gray-900 dark:text-white">
              Schnellzugriff
            </Heading>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Häufig verwendete Seller-Funktionen
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <Heading level={3} className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                      {action.title}
                    </Heading>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <Heading level={3} className="font-medium text-blue-900 dark:text-blue-200">
              RevampIT Marketplace
            </Heading>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Als Seller kannst du Ihre eigenen refurbished Produkte im RevampIT Marketplace verkaufen.
              deine Produkte erscheinen neben den offiziellen RevampIT Produkten und helfen dabei,
              die Kreislaufwirtschaft zu fördern.
            </p>
            <div className="mt-3 flex gap-3">
              <Link
                href="/marketplace"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
              >
                Marketplace ansehen
              </Link>
              <Link
                href="/marketplace/sell"
                className="text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
              >
                Produkt hinzufügen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

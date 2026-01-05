import { Metadata } from 'next'
import { ROLES } from '@/lib/constants'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  Plus,
  TrendingUp,
  DollarSign,
  Eye,
  Users,
  ArrowRight,
  BarChart3
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Seller Dashboard | RevampIT',
  description: 'Verwalten Sie Ihre Produkte im RevampIT Marketplace.',
}

export default async function SellerDashboard() {
  // Check if user has access (seller or admin role)
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const userRole = session.user.role as string
  const hasAccess = userRole === ROLES.SELLER || userRole === ROLES.REVAMPIT_ADMIN

  if (!hasAccess) {
    redirect('/dashboard')
  }

  // Mock data for seller dashboard
  const sellerStats = {
    totalProducts: 12,
    activeProducts: 8,
    totalSales: 2450,
    monthlyRevenue: 890,
    views: 1250,
    orders: 23,
  }

  const recentProducts = [
    {
      id: '1',
      title: 'Gaming Laptop i7',
      status: 'active',
      price: 1200,
      views: 45,
      orders: 2,
      image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=100',
    },
    {
      id: '2',
      title: 'Wireless Headphones',
      status: 'active',
      price: 150,
      views: 32,
      orders: 1,
      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=100',
    },
    {
      id: '3',
      title: 'USB-C Hub',
      status: 'draft',
      price: 45,
      views: 0,
      orders: 0,
      image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=100',
    },
  ]

  const quickActions = [
    {
      title: 'Neues Produkt',
      description: 'Produkt zum Marketplace hinzufügen',
      href: '/dashboard/seller/products/new',
      icon: Plus,
      color: 'bg-green-500',
    },
    {
      title: 'Meine Produkte',
      description: 'Alle Ihre Produkte verwalten',
      href: '/dashboard/seller/products',
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Verkäufe',
      description: 'Bestellungen und Verkäufe anzeigen',
      href: '/dashboard/seller/sales',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Analytics',
      description: 'Produkt-Performance analysieren',
      href: '/dashboard/seller/analytics',
      icon: BarChart3,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Seller Dashboard
        </h1>
        <p className="text-green-100">
          Verwalten Sie Ihre Produkte im RevampIT Marketplace und verfolgen Sie Ihre Verkäufe.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Meine Produkte</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{sellerStats.totalProducts}</p>
              <p className="text-sm text-green-600">{sellerStats.activeProducts} aktiv</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monatlicher Umsatz</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">CHF {sellerStats.monthlyRevenue}</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +15%
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Produkt-Aufrufe</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{sellerStats.views.toLocaleString()}</p>
              <p className="text-sm text-blue-600">diese Woche</p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bestellungen</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{sellerStats.orders}</p>
              <p className="text-sm text-purple-600">ausstehend: 3</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Meine Produkte
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Übersicht Ihrer aktiven Produkte
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {recentProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      CHF {product.price} • {product.views} Aufrufe • {product.orders} Bestellungen
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {product.status === 'active' ? 'Aktiv' : 'Entwurf'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Link
                href="/dashboard/seller/products"
                className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 font-medium flex items-center gap-1"
              >
                Alle Produkte verwalten
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Schnellzugriff
            </h2>
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
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                      {action.title}
                    </h3>
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
            <h3 className="font-medium text-blue-900 dark:text-blue-200">
              RevampIT Marketplace
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Als Seller können Sie Ihre eigenen refurbished Produkte im RevampIT Marketplace verkaufen.
              Ihre Produkte erscheinen neben den offiziellen RevampIT Produkten und helfen dabei,
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
                href="/dashboard/seller/products/new"
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




'use client'

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
import { LISTING_STATUS_CONFIG, formatCHF } from '@/config/marketplace'
import { useTranslations } from 'next-intl'
import type { ListingStatus } from '@/config/marketplace'
import { useSellerDashboard } from '@/hooks/useSellerDashboard'

function getStatusLabel(status: string) {
  const config = LISTING_STATUS_CONFIG[status as ListingStatus]
  if (config) return { label: config.label, className: config.color }
  return { label: status, className: 'bg-neutral-100 text-neutral-800' }
}

export default function SellerDashboard() {
  const t = useTranslations('dashboard.seller')

  const { sessionStatus, isLoading, error, stats, products, fetchDashboardData } =
    useSellerDashboard(t('unexpectedError'))

  const quickActions = [
    { title: t('quickNewProduct'), description: t('quickNewProductDesc'), href: '/marketplace/sell', icon: Plus, color: 'bg-primary-500' },
    { title: t('quickMyProducts'), description: t('quickMyProductsDesc'), href: '/dashboard/listings', icon: Package, color: 'bg-neutral-500' },
    { title: t('quickSales'), description: t('quickSalesDesc'), href: '/dashboard/orders', icon: TrendingUp, color: 'bg-purple-500' },
    { title: t('quickMarketplace'), description: t('quickMarketplaceDesc'), href: '/marketplace', icon: BarChart3, color: 'bg-orange-500' },
  ]

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-neutral-600 dark:text-neutral-400">{t('loading')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-error-800 dark:text-error-200 mb-2">
          {t('loadErrorTitle')}
        </h3>
        <p className="text-error-600 dark:text-error-300 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 bg-error-600 hover:bg-error-700 text-white px-4 py-2 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          {t('retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {t('pageTitle')}
            </h1>
            <p className="text-primary-100">
              {t('pageSubtitle')}
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title={t('refresh')}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t('statsProducts')}</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.totalProducts}</p>
              <p className="text-sm text-primary-600">{t('statsActive', { count: stats.activeProducts })}</p>
            </div>
            <Package className="w-8 h-8 text-neutral-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t('statsRevenue')}</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                {formatCHF(stats.totalRevenue)}
              </p>
              <p className="text-sm text-primary-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {t('statsTotalRevenue')}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t('statsViews')}</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.totalViews.toLocaleString()}</p>
              <p className="text-sm text-neutral-600">{t('statsFavorites', { count: stats.totalFavorites })}</p>
            </div>
            <Eye className="w-8 h-8 text-neutral-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t('statsOrders')}</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.totalOrders}</p>
              <p className="text-sm text-purple-600">{t('statsPending', { count: stats.pendingOrders })}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Products */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {t('recentTitle')}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {t('recentSubtitle')}
            </p>
          </div>

          <div className="p-6">
            {products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  {t('noProducts')}
                </p>
                <Link
                  href="/marketplace/sell"
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  {t('createFirst')}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => {
                  const statusInfo = getStatusLabel(product.status)
                  return (
                    <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg border border-neutral-100 dark:border-neutral-700">
                      <div className="w-12 h-12 rounded-lg overflow-hidden">
                        <ListingImage src={product.image} alt={product.title} fallbackIconSize="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-neutral-900 dark:text-white truncate">
                          {product.title}
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          CHF {product.price} • {t('viewCount', { count: product.viewsCount })}
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
              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                <Link
                  href="/dashboard/listings"
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium flex items-center gap-1"
                >
                  {t('manageAll')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {t('quickActionsTitle')}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {t('quickActionsSubtitle')}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-medium text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      {action.title}
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace Info */}
      <div className="bg-neutral-50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-neutral-600" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-900 dark:text-neutral-200">
              {t('infoTitle')}
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">
              {t('infoDesc')}
            </p>
            <div className="mt-3 flex gap-3">
              <Link
                href="/marketplace"
                className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded hover:bg-primary-700 transition-colors"
              >
                {t('viewMarketplace')}
              </Link>
              <Link
                href="/marketplace/sell"
                className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded hover:bg-primary-700 transition-colors"
              >
                {t('addProduct')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

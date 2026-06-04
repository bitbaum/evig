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
import { Button } from '@/components/ui/button'
import { ListingImage } from '@/components/marketplace/ListingImage'
import { LISTING_STATUS_CONFIG, formatCHF } from '@/config/marketplace'
import { useTranslations } from 'next-intl'
import type { ListingStatus } from '@/config/marketplace'
import { useSellerDashboard } from '@/hooks/useSellerDashboard'
import { ROUTES } from '@/config/routes'

function getStatusLabel(status: string) {
  const config = LISTING_STATUS_CONFIG[status as ListingStatus]
  if (config) return { label: config.label, className: config.color }
  return { label: status, className: 'bg-surface-raised text-text-primary' }
}

export default function SellerDashboard() {
  const t = useTranslations('dashboard.seller')

  const { sessionStatus, isLoading, error, stats, products, fetchDashboardData } =
    useSellerDashboard(t('unexpectedError'))

  const quickActions = [
    { title: t('quickNewProduct'), description: t('quickNewProductDesc'), href: ROUTES.public.marketplaceSell, icon: Plus, color: 'bg-action' },
    { title: t('quickMyProducts'), description: t('quickMyProductsDesc'), href: '/dashboard/listings', icon: Package, color: 'bg-neutral-500' },
    { title: t('quickSales'), description: t('quickSalesDesc'), href: '/dashboard/orders', icon: TrendingUp, color: 'bg-action' },
    { title: t('quickMarketplace'), description: t('quickMarketplaceDesc'), href: ROUTES.public.marketplace, icon: BarChart3, color: 'bg-secondary-500' },
  ]

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-action animate-spin" />
        <span className="ml-3 text-text-secondary">{t('loading')}</span>
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
        <Button variant="destructive" onClick={fetchDashboardData} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {t('retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-action rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {t('pageTitle')}
            </h1>
            <p className="text-action-text">
              {t('pageSubtitle')}
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-lg bg-surface-base/10 hover:bg-surface-base/20 transition-colors"
            title={t('refresh')}
            aria-label={t('refresh')}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">{t('statsProducts')}</p>
              <p className="text-3xl font-bold text-text-primary">{stats.totalProducts}</p>
              <p className="text-sm text-action">{t('statsActive', { count: stats.activeProducts })}</p>
            </div>
            <Package className="w-8 h-8 text-text-secondary" />
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">{t('statsRevenue')}</p>
              <p className="text-3xl font-bold text-text-primary">
                {formatCHF(stats.totalRevenue)}
              </p>
              <p className="text-sm text-action flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {t('statsTotalRevenue')}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-action" />
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">{t('statsViews')}</p>
              <p className="text-3xl font-bold text-text-primary">{stats.totalViews.toLocaleString()}</p>
              <p className="text-sm text-text-secondary">{t('statsFavorites', { count: stats.totalFavorites })}</p>
            </div>
            <Eye className="w-8 h-8 text-text-secondary" />
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">{t('statsOrders')}</p>
              <p className="text-3xl font-bold text-text-primary">{stats.totalOrders}</p>
              <p className="text-sm text-warning-600 dark:text-warning-400">{t('statsPending', { count: stats.pendingOrders })}</p>
            </div>
            <Users className="w-8 h-8 text-text-secondary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Products */}
        <div className="bg-surface-base rounded-xl shadow-xs border border-subtle">
          <div className="p-6 border-b border-subtle">
            <h2 className="text-lg font-semibold text-text-primary">
              {t('recentTitle')}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {t('recentSubtitle')}
            </p>
          </div>

          <div className="p-6">
            {products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary mb-4">
                  {t('noProducts')}
                </p>
                <Button as={Link} href={ROUTES.public.marketplaceSell} variant="primary" size="sm">
                  <Plus className="w-4 h-4" />
                  {t('createFirst')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => {
                  const statusInfo = getStatusLabel(product.status)
                  return (
                    <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg border border-subtle">
                      <div className="w-12 h-12 rounded-lg overflow-hidden">
                        <ListingImage src={product.image} alt={product.title} fallbackIconSize="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-primary truncate">
                          {product.title}
                        </h3>
                        <p className="text-sm text-text-tertiary">
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
              <div className="mt-6 pt-4 border-t border-subtle">
                <Link
                  href="/dashboard/listings"
                  className="text-sm text-action hover:text-action font-medium flex items-center gap-1"
                >
                  {t('manageAll')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface-base rounded-xl shadow-xs border border-subtle">
          <div className="p-6 border-b border-subtle">
            <h2 className="text-lg font-semibold text-text-primary">
              {t('quickActionsTitle')}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {t('quickActionsSubtitle')}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group p-4 bg-surface-raised rounded-lg hover:bg-surface-raised transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-medium text-text-primary group-hover:text-action transition-colors">
                      {action.title}
                    </h3>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace Info */}
      <div className="bg-surface-raised border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-surface-raised rounded-lg flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-text-secondary" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">
              {t('infoTitle')}
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              {t('infoDesc')}
            </p>
            <div className="mt-3 flex gap-3">
              <Button as={Link} href={ROUTES.public.marketplace} variant="primary" size="sm">
                {t('viewMarketplace')}
              </Button>
              <Button as={Link} href={ROUTES.public.marketplaceSell} variant="primary" size="sm">
                {t('addProduct')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

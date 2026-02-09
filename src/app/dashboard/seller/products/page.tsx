import { Metadata } from 'next'
import { ROLES } from '@/lib/constants'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getConditionBadge } from '@/config/erfassung/conditions'
import Link from 'next/link'
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  TrendingUp,
  DollarSign,
  Users,
  Star
} from 'lucide-react'
import { hasAdminAccessUnified, type UnifiedUser } from '@/lib/auth/unified-permissions'

export const metadata: Metadata = {
  title: 'Meine Produkte | Seller Dashboard',
  description: 'Verwalten Sie Ihre Produkte im RevampIT Marketplace.',
}

export default async function SellerProductsPage() {
  // Check if user has access (seller or admin role)
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const userRole = session.user.role as string

  // UNIFIED: Build user object for admin check
  const user: UnifiedUser = {
    email: session.user.email || '',
    role: userRole,
    isStaff: session.user.isStaff,
    staffPermissions: session.user.staffPermissions,
    isSuperAdmin: session.user.isSuperAdmin,
  }

  // Access granted if: seller role OR admin access (via old or new system)
  const hasAccess = userRole === ROLES.SELLER || hasAdminAccessUnified(user)

  if (!hasAccess) {
    redirect('/dashboard')
  }

  // Mock seller products data
  const products = [
    {
      id: 'seller_prod_1',
      title: 'MacBook Air M1 - Perfekt Zustand',
      handle: 'macbook-air-m1-perfect',
      status: 'active',
      price: 899,
      originalPrice: 1199,
      condition: 'like_new',
      category: 'Laptops',
      inventory: 1,
      views: 145,
      orders: 3,
      rating: 4.8,
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100'],
      createdAt: '2024-11-15',
      updatedAt: '2024-12-01',
    },
    {
      id: 'seller_prod_2',
      title: 'Dell XPS 13 - Studenten-PC',
      handle: 'dell-xps-13-student',
      status: 'active',
      price: 699,
      originalPrice: 999,
      condition: 'good',
      category: 'Laptops',
      inventory: 1,
      views: 89,
      orders: 1,
      rating: 4.5,
      images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100'],
      createdAt: '2024-11-20',
      updatedAt: '2024-11-25',
    },
    {
      id: 'seller_prod_3',
      title: '27" 4K Monitor - LG',
      handle: '4k-monitor-lg-27',
      status: 'draft',
      price: 349,
      originalPrice: 599,
      condition: 'good',
      category: 'Monitore',
      inventory: 1,
      views: 0,
      orders: 0,
      rating: 0,
      images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100'],
      createdAt: '2024-12-01',
      updatedAt: '2024-12-01',
    },
  ]

  const getConditionLabel = (condition: string) => getConditionBadge(condition)

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    draftProducts: products.filter(p => p.status === 'draft').length,
    totalViews: products.reduce((sum, p) => sum + p.views, 0),
    totalOrders: products.reduce((sum, p) => sum + p.orders, 0),
    totalRevenue: products.reduce((sum, p) => sum + (p.price * p.orders), 0),
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Meine Produkte
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Verwalten Sie Ihre Produkte im RevampIT Marketplace
          </p>
        </div>
        <Link
          href="/dashboard/seller/products/new"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neues Produkt
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktive Produkte</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeProducts}</p>
            </div>
            <Package className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Aufrufe</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bestellungen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Umsatz</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                CHF {stats.totalRevenue.toLocaleString('de-CH')}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Produkte suchen..."
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">Alle Stati</option>
              <option value="active">Aktiv</option>
              <option value="draft">Entwurf</option>
              <option value="inactive">Inaktiv</option>
            </select>

            <select className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">Alle Kategorien</option>
              <option value="laptops">Laptops</option>
              <option value="desktop-pcs">Desktop PCs</option>
              <option value="monitore">Monitore</option>
              <option value="zubehoer">Zubehör</option>
            </select>

            <button className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Produkt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Preis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Zustand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aktualisiert
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => {
                const conditionInfo = getConditionLabel(product.condition)
                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 flex-shrink-0">
                          <img
                            className="w-12 h-12 rounded-lg object-cover"
                            src={product.images[0]}
                            alt={product.title}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {product.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}>
                        {product.status === 'active' ? 'Aktiv' : 'Entwurf'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div>
                        <div className="font-medium">CHF {product.price}</div>
                        {product.originalPrice && (
                          <div className="text-gray-500 line-through">CHF {product.originalPrice}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${conditionInfo.color}`}>
                        {conditionInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{product.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{product.orders}</span>
                        </div>
                        {product.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span>{product.rating}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(product.updatedAt).toLocaleDateString('de-CH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/seller/products/${product.id}/edit`}
                          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Bearbeiten"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          className={`text-gray-400 hover:text-green-600 dark:hover:text-green-400 ${
                            product.status === 'active' ? 'hover:text-gray-600 dark:hover:text-gray-400' : ''
                          }`}
                          title={product.status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
                        >
                          {product.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Zeige <span className="font-medium">1</span> bis <span className="font-medium">{products.length}</span> von{' '}
              <span className="font-medium">{products.length}</span> Ergebnissen
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                Vorherige
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                Nächste
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-200">
              Tipps für erfolgreiche Verkäufe
            </h3>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Verwenden Sie hochwertige Fotos von allen Seiten des Produkts</li>
              <li>• Beschreiben Sie den Zustand ehrlich und detailliert</li>
              <li>• Setzen Sie faire Preise basierend auf Marktstandards</li>
              <li>• Antworten Sie schnell auf Kundenanfragen</li>
              <li>• Bieten Sie flexible Lieferoptionen an</li>
            </ul>
            <Link
              href="/help/seller-guide"
              className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Vollständige Anleitung lesen
              <TrendingUp className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}




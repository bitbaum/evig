"use client";

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Package,
  DollarSign,
  Tag,
  Image as ImageIcon,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Upload,
  FileText,
  Users,
  Store
} from 'lucide-react'
import { useProducts, MedusaProduct } from '@/lib/medusa/hooks'
import { cn } from '@/lib/utils'

interface ProductWithOwner extends MedusaProduct {
  owner_id?: string;
  owner_name?: string;
  status?: 'published' | 'draft';
}

interface ProductStats {
  total: number
  published: number
  draft: number
  lowStock: number
  userListings: number
  adminInventory: number
}

export default function ProductManagement() {
  const { data: productsData, isLoading, error, refetch } = useProducts({ limit: 100 })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSource, setFilterSource] = useState<'all' | 'admin' | 'user'>('all')
  const [showBulkImport, setShowBulkImport] = useState(false)

  // Mock user marketplace products (in real app, this would come from API)
  const userMarketplaceProducts: ProductWithOwner[] = [
    {
      id: "user_prod_001",
      title: "Vintage MacBook Pro 2015",
      description: "Guter Zustand, alle Ports funktionieren",
      handle: "vintage-macbook-2015",
      subtitle: null,
      thumbnail: null,
      is_giftcard: false,
      discountable: true,
      collection_id: null,
      type_id: null,
      weight: null,
      material: null,
      images: [],
      options: [],
      status: "published",
      variants: [{
        id: "variant_001",
        title: "Default",
        sku: "user_prod_001",
        inventory_quantity: 1,
        allow_backorder: false,
        manage_inventory: true,
        product_id: "user_prod_001",
        prices: [{ amount: 45000, currency_code: "CHF" }],
        options: []
      }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: "user_123",
      owner_name: "Anna Müller"
    },
    {
      id: "user_prod_002",
      title: "Gaming Maus Logitech G305",
      description: "Wireless, kaum benutzt",
      handle: "gaming-maus-logitech",
      subtitle: null,
      thumbnail: null,
      is_giftcard: false,
      discountable: true,
      collection_id: null,
      type_id: null,
      weight: null,
      material: null,
      images: [],
      options: [],
      status: "published",
      variants: [{
        id: "variant_002",
        title: "Default",
        sku: "user_prod_002",
        inventory_quantity: 1,
        allow_backorder: false,
        manage_inventory: true,
        product_id: "user_prod_002",
        prices: [{ amount: 2500, currency_code: "CHF" }],
        options: []
      }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: "user_456",
      owner_name: "Max Weber"
    }
  ]

  const adminProducts = productsData?.products || []
  const allProducts = [...adminProducts, ...userMarketplaceProducts] as ProductWithOwner[]

  // Calculate stats
  const stats: ProductStats = {
    total: allProducts.length,
    published: allProducts.filter(p => p.status === 'published').length,
    draft: allProducts.filter(p => p.status === 'draft').length,
    lowStock: allProducts.filter(p => {
      const totalInventory = p.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0
      return totalInventory < 5
    }).length,
    userListings: userMarketplaceProducts.length,
    adminInventory: adminProducts.length
  }

  // Filter products
  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus
    const matchesCategory = filterCategory === 'all' ||
                           product.collection?.title?.toLowerCase().includes(filterCategory.toLowerCase())
    const matchesSource = filterSource === 'all' ||
                         (filterSource === 'admin' && !product.owner_id) ||
                         (filterSource === 'user' && product.owner_id)

    return matchesSearch && matchesStatus && matchesCategory && matchesSource
  })

  const handleSelectAll = (checked: boolean) => {
    setSelectedProducts(checked ? filteredProducts.map(p => p.id) : [])
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(prev =>
      checked
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Produkte werden geladen...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Fehler beim Laden der Produkte
          </h3>
          <p className="text-gray-600 mb-4">
            {error.message || 'Bitte versuchen Sie es später erneut.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Gesamt</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-6 h-6 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Veröffentlicht</p>
              <p className="text-xl font-bold text-green-600">{stats.published}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Admin Inventory</p>
              <p className="text-xl font-bold text-indigo-600">{stats.adminInventory}</p>
            </div>
            <Store className="w-6 h-6 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">User Listings</p>
              <p className="text-xl font-bold text-purple-600">{stats.userListings}</p>
            </div>
            <Users className="w-6 h-6 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Entwürfe</p>
              <p className="text-xl font-bold text-yellow-600">{stats.draft}</p>
            </div>
            <XCircle className="w-6 h-6 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Niedriger Bestand</p>
              <p className="text-xl font-bold text-red-600">{stats.lowStock}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Produkte suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value as 'all' | 'admin' | 'user')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Alle Quellen</option>
                <option value="admin">Admin Inventory</option>
                <option value="user">User Marketplace</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Alle Status</option>
                <option value="published">Veröffentlicht</option>
                <option value="draft">Entwurf</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Alle Kategorien</option>
                <option value="Laptops">Laptops</option>
                <option value="Desktops">Desktops</option>
                <option value="Monitore">Monitore</option>
                <option value="Zubehör">Zubehör</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {selectedProducts.length > 0 && (
              <button className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                {selectedProducts.length} löschen
              </button>
            )}
            <button
              onClick={() => setShowBulkImport(true)}
              className="px-4 py-2 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Bulk Import
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4 inline mr-2" />
              Neues Produkt
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produkt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bestand
                </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quelle
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description?.substring(0, 60)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                      product.status === 'published'
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    )}>
                      {product.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="font-medium">
                        CHF {product.variants?.[0]?.prices?.[0]?.amount ?
                          (product.variants[0].prices[0].amount / 100).toFixed(2) : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "font-medium",
                      (product.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0) < 5
                        ? "text-red-600"
                        : "text-gray-900"
                    )}>
                      {product.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-gray-900">{product.collection?.title || 'Keine Kategorie'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.owner_id ? (
                        <>
                          <Users className="w-4 h-4 text-purple-400 mr-1" />
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            User: {product.owner_name}
                          </span>
                        </>
                      ) : (
                        <>
                          <Store className="w-4 h-4 text-indigo-400 mr-1" />
                          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                            Admin
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Produkte gefunden
            </h3>
            <p className="text-gray-600">
              {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
                ? 'Versuchen Sie andere Suchkriterien.'
                : 'Erstellen Sie Ihr erstes Produkt, um zu beginnen.'}
            </p>
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {showBulkImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBulkImport(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Bulk-Import von Produkten
                  </h2>
                  <button
                    onClick={() => setShowBulkImport(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    CSV-Datei auswählen
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Laden Sie eine CSV-Datei mit Ihren Produkten hoch
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer inline-block"
                  >
                    Datei auswählen
                  </label>
                </div>

                {/* CSV Format Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Erforderliches CSV-Format:
                  </h4>
                  <div className="text-sm text-blue-800 font-mono bg-blue-100 p-3 rounded">
                    Titel,Beschreibung,Preis (CHF),Kategorie,Marke,Bild-URL<br/>
                    "Dell Latitude E7470","Professioneller Laptop",599.00,"Laptops","Dell","https://..."<br/>
                    "Samsung Monitor 27""","4K Monitor",449.00,"Monitore","Samsung","https://..."
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Hinweis: Die erste Zeile muss die Spaltenüberschriften enthalten
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowBulkImport(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Produkte importieren
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

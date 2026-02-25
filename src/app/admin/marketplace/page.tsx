/**
 * Admin Marketplace Page - Server Component
 *
 * Lists all active marketplace listings for staff to review and verify.
 * Verification marks items as "Geprüft von RevampIT" (tested by RevampIT).
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { Store, ShieldCheck, ShieldOff, Package, Clock } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { formatPrice } from '@/config/marketplace'
import { getCategoryLabel } from '@/config/marketplace'
import { getConditionLabel } from '@/config/erfassung/conditions'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { VerifyActions } from './VerifyActions'

export const metadata: Metadata = {
  title: 'Marketplace | RevampIT Admin',
  description: 'Inserate prüfen und verifizieren.',
}

interface ListingRow {
  id: string
  title: string
  price_chf: number
  category: string
  condition: string | null
  status: string
  is_revampit: boolean
  verified_at: string | null
  verified_by: string | null
  verification_notes: string | null
  created_at: string
  seller_name: string | null
  seller_email: string
}

interface ListingStats {
  total_active: number
  verified: number
  unverified: number
  revampit: number
  community: number
}

async function getListingStats(): Promise<ListingStats> {
  try {
    const result = await query<{
      total_active: string
      verified: string
      unverified: string
      revampit: string
      community: string
    }>(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'active') as total_active,
        COUNT(*) FILTER (WHERE status = 'active' AND verified_at IS NOT NULL) as verified,
        COUNT(*) FILTER (WHERE status = 'active' AND verified_at IS NULL) as unverified,
        COUNT(*) FILTER (WHERE status = 'active' AND is_revampit = true) as revampit,
        COUNT(*) FILTER (WHERE status = 'active' AND is_revampit = false) as community
       FROM ${TABLE_NAMES.LISTINGS}`
    )
    const row = result.rows[0]
    return {
      total_active: parseInt(row?.total_active || '0'),
      verified: parseInt(row?.verified || '0'),
      unverified: parseInt(row?.unverified || '0'),
      revampit: parseInt(row?.revampit || '0'),
      community: parseInt(row?.community || '0'),
    }
  } catch {
    return { total_active: 0, verified: 0, unverified: 0, revampit: 0, community: 0 }
  }
}

async function getListings(): Promise<ListingRow[]> {
  try {
    const result = await query<ListingRow>(
      `SELECT
        l.id,
        l.title,
        l.price_chf,
        l.category,
        l.condition,
        l.status,
        l.is_revampit,
        l.verified_at,
        l.verified_by,
        l.verification_notes,
        l.created_at,
        u.name as seller_name,
        u.email as seller_email
       FROM ${TABLE_NAMES.LISTINGS} l
       JOIN ${TABLE_NAMES.USERS} u ON l.seller_id = u.id
       WHERE l.status IN ('active', 'reserved')
       ORDER BY l.verified_at IS NULL DESC, l.created_at DESC
       LIMIT 100`
    )
    return result.rows
  } catch {
    return []
  }
}

export default async function MarketplacePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/marketplace')
  }

  const [stats, listings] = await Promise.all([
    getListingStats(),
    getListings(),
  ])

  return (
    <AdminPageWrapper
      title="Marketplace"
      description="Inserate prüfen und verifizieren"
      icon={Store}
      iconColor="green"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.total_active}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Aktive Inserate</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{stats.unverified}</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Ungeprüft</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.verified}</p>
              <p className="text-sm text-green-600 dark:text-green-400">Geprüft</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{stats.revampit}</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">RevampIT</p>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Aktive Inserate</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ungeprüfte Inserate zuerst, dann nach Erstellungsdatum sortiert
          </p>
        </div>

        {listings.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {listings.map(listing => (
              <div key={listing.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`/marketplace/${listing.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      >
                        {listing.title}
                      </a>
                      {listing.verified_at && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <ShieldCheck className="w-3 h-3" />
                          Geprüft
                        </span>
                      )}
                      {listing.is_revampit && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          RevampIT
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getCategoryLabel(listing.category)}
                      {listing.condition && ` · ${getConditionLabel(listing.condition)}`}
                      {' · '}{formatPrice(Number(listing.price_chf))}
                      {' · '}{listing.seller_name || listing.seller_email}
                      {' · '}{formatDateShort(listing.created_at)}
                    </p>
                    {listing.verification_notes && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Notiz: {listing.verification_notes}
                      </p>
                    )}
                  </div>
                  <VerifyActions
                    listingId={listing.id}
                    isVerified={!!listing.verified_at}
                    title={listing.title}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <ShieldOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Keine aktiven Inserate
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Es gibt derzeit keine aktiven Inserate im Marketplace.
            </p>
          </div>
        )}
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Hinweis:</strong> Verifizierte Inserate erhalten das &quot;Geprüft von RevampIT&quot;-Badge.
          Dies zeigt Käufern, dass das Gerät von RevampIT getestet wurde.
          Die Verifizierung kann jederzeit wieder entfernt werden.
        </p>
      </div>
    </AdminPageWrapper>
  )
}

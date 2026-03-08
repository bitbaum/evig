'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Tab, Stats, ListingRow, ReportRow, OrderRow, PaginatedResponse } from './types'

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMarketplaceAdmin() {
  const [tab, setTab] = useState<Tab>('listings')
  const [stats, setStats] = useState<Stats | null>(null)

  // Listings state
  const [listings, setListings] = useState<PaginatedResponse<ListingRow> | null>(null)
  const [listingsFilter, setListingsFilter] = useState({ status: 'all', category: '', seller_type: 'all', verified: 'all', reported: 'all', search: '' })
  const [listingsOffset, setListingsOffset] = useState(0)

  // Reports state
  const [reports, setReports] = useState<PaginatedResponse<ReportRow> | null>(null)
  const [reportsFilter, setReportsFilter] = useState({ status: 'pending' })
  const [reportsOffset, setReportsOffset] = useState(0)

  // Orders state
  const [orders, setOrders] = useState<PaginatedResponse<OrderRow> | null>(null)
  const [ordersFilter, setOrdersFilter] = useState({ status: 'all' })
  const [ordersOffset, setOrdersOffset] = useState(0)

  // Edit modal state
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ admin_notes: string; status: string }>({ admin_notes: '', status: '' })
  const [editLoading, setEditLoading] = useState(false)

  // Report handling state
  const [handlingReportId, setHandlingReportId] = useState<string | null>(null)
  const [reportAction, setReportAction] = useState<string>('dismiss')
  const [reportNotes, setReportNotes] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  const [loading, setLoading] = useState(true)

  // ------- Fetchers -------

  const refreshStats = useCallback(() => {
    fetch('/api/admin/marketplace/stats')
      .then(r => r.json())
      .then(r => { if (r.success) setStats(r.data) })
  }, [])

  useEffect(() => { refreshStats() }, [refreshStats])

  const fetchListings = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: listingsFilter.status,
      seller_type: listingsFilter.seller_type,
      verified: listingsFilter.verified,
      reported: listingsFilter.reported,
      limit: '50',
      offset: String(listingsOffset),
    })
    if (listingsFilter.category) params.set('category', listingsFilter.category)
    if (listingsFilter.search) params.set('search', listingsFilter.search)
    const r = await fetch(`/api/admin/marketplace?${params}`)
    const data = await r.json()
    if (data.success) setListings(data.data)
    setLoading(false)
  }, [listingsFilter, listingsOffset])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: reportsFilter.status,
      limit: '50',
      offset: String(reportsOffset),
    })
    const r = await fetch(`/api/admin/marketplace/reports?${params}`)
    const data = await r.json()
    if (data.success) setReports(data.data)
    setLoading(false)
  }, [reportsFilter, reportsOffset])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: ordersFilter.status,
      limit: '50',
      offset: String(ordersOffset),
    })
    const r = await fetch(`/api/admin/marketplace/orders?${params}`)
    const data = await r.json()
    if (data.success) setOrders(data.data)
    setLoading(false)
  }, [ordersFilter, ordersOffset])

  // Data fetching — subscribe to external API data (valid effect usage)
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (tab === 'listings') {
        const params = new URLSearchParams({
          status: listingsFilter.status,
          seller_type: listingsFilter.seller_type,
          verified: listingsFilter.verified,
          reported: listingsFilter.reported,
          limit: '50',
          offset: String(listingsOffset),
        })
        if (listingsFilter.category) params.set('category', listingsFilter.category)
        if (listingsFilter.search) params.set('search', listingsFilter.search)
        const r = await fetch(`/api/admin/marketplace?${params}`)
        const data = await r.json()
        if (!cancelled && data.success) setListings(data.data)
      } else if (tab === 'reports') {
        const params = new URLSearchParams({ status: reportsFilter.status, limit: '50', offset: String(reportsOffset) })
        const r = await fetch(`/api/admin/marketplace/reports?${params}`)
        const data = await r.json()
        if (!cancelled && data.success) setReports(data.data)
      } else if (tab === 'orders') {
        const params = new URLSearchParams({ status: ordersFilter.status, limit: '50', offset: String(ordersOffset) })
        const r = await fetch(`/api/admin/marketplace/orders?${params}`)
        const data = await r.json()
        if (!cancelled && data.success) setOrders(data.data)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [tab, listingsFilter, listingsOffset, reportsFilter, reportsOffset, ordersFilter, ordersOffset])

  // ------- Actions -------

  async function handleEditSave() {
    if (!editId) return
    setEditLoading(true)
    await fetch(`/api/admin/marketplace/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })
    setEditLoading(false)
    setEditId(null)
    fetchListings()
    refreshStats()
  }

  async function handleRemove(id: string, title: string) {
    if (!confirm(`Inserat "${title}" entfernen?`)) return
    await fetch(`/api/admin/marketplace/${id}`, { method: 'DELETE' })
    fetchListings()
    refreshStats()
  }

  async function handleReport() {
    if (!handlingReportId) return
    setReportLoading(true)
    await fetch(`/api/admin/marketplace/reports/${handlingReportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: reportAction, admin_notes: reportNotes || null }),
    })
    setReportLoading(false)
    setHandlingReportId(null)
    setReportNotes('')
    fetchReports()
    refreshStats()
  }

  function openEditModal(id: string, admin_notes: string, status: string) {
    setEditId(id)
    setEditData({ admin_notes, status })
  }

  function closeEditModal() {
    setEditId(null)
  }

  function openReportModal(id: string) {
    setHandlingReportId(id)
    setReportAction('dismiss')
    setReportNotes('')
  }

  function closeReportModal() {
    setHandlingReportId(null)
  }

  function switchTab(newTab: Tab) {
    setTab(newTab)
    setListingsOffset(0)
    setReportsOffset(0)
    setOrdersOffset(0)
  }

  return {
    // Tab
    tab,
    switchTab,

    // Stats
    stats,

    // Loading
    loading,

    // Listings
    listings,
    listingsFilter,
    setListingsFilter,
    listingsOffset,
    setListingsOffset,
    handleRemove,

    // Reports
    reports,
    reportsFilter,
    setReportsFilter,
    reportsOffset,
    setReportsOffset,

    // Orders
    orders,
    ordersFilter,
    setOrdersFilter,
    ordersOffset,
    setOrdersOffset,

    // Edit modal
    editId,
    editData,
    setEditData,
    editLoading,
    openEditModal,
    closeEditModal,
    handleEditSave,

    // Report modal
    handlingReportId,
    reportAction,
    setReportAction,
    reportNotes,
    setReportNotes,
    reportLoading,
    openReportModal,
    closeReportModal,
    handleReport,
  }
}

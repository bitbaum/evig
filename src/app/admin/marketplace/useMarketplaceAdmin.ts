'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { Tab, Stats, ListingRow, ReportRow, OrderRow, QuestionRow, PaginatedResponse } from './types'

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

  // Questions state
  const [questions, setQuestions] = useState<PaginatedResponse<QuestionRow> | null>(null)
  const [questionsFilter, setQuestionsFilter] = useState({ status: 'open' })
  const [questionsOffset, setQuestionsOffset] = useState(0)

  // Edit modal state
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ admin_notes: string; status: string }>({ admin_notes: '', status: '' })
  const [editLoading, setEditLoading] = useState(false)

  // Report handling state
  const [handlingReportId, setHandlingReportId] = useState<string | null>(null)
  const [reportAction, setReportAction] = useState<string>('dismiss')
  const [reportNotes, setReportNotes] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<{ id: string; title: string } | null>(null)

  const [loading, setLoading] = useState(true)

  // ------- Fetchers -------

  const refreshStats = useCallback(() => {
    apiFetch<Stats>('/api/admin/marketplace/stats')
      .then(r => { if (r.success && r.data) setStats(r.data) })
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
    const result = await apiFetch<PaginatedResponse<ListingRow>>(`/api/admin/marketplace?${params}`)
    if (result.success && result.data) setListings(result.data)
    setLoading(false)
  }, [listingsFilter, listingsOffset])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: reportsFilter.status,
      limit: '50',
      offset: String(reportsOffset),
    })
    const result = await apiFetch<PaginatedResponse<ReportRow>>(`/api/admin/marketplace/reports?${params}`)
    if (result.success && result.data) setReports(result.data)
    setLoading(false)
  }, [reportsFilter, reportsOffset])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: ordersFilter.status,
      limit: '50',
      offset: String(ordersOffset),
    })
    const result = await apiFetch<PaginatedResponse<OrderRow>>(`/api/admin/marketplace/orders?${params}`)
    if (result.success && result.data) setOrders(result.data)
    setLoading(false)
  }, [ordersFilter, ordersOffset])

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: questionsFilter.status,
      limit: '50',
      offset: String(questionsOffset),
    })
    const result = await apiFetch<PaginatedResponse<QuestionRow>>(`/api/admin/marketplace/questions?${params}`)
    if (result.success && result.data) setQuestions(result.data)
    setLoading(false)
  }, [questionsFilter, questionsOffset])

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
        const result = await apiFetch<PaginatedResponse<ListingRow>>(`/api/admin/marketplace?${params}`)
        if (!cancelled && result.success && result.data) setListings(result.data)
      } else if (tab === 'reports') {
        const params = new URLSearchParams({ status: reportsFilter.status, limit: '50', offset: String(reportsOffset) })
        const result = await apiFetch<PaginatedResponse<ReportRow>>(`/api/admin/marketplace/reports?${params}`)
        if (!cancelled && result.success && result.data) setReports(result.data)
      } else if (tab === 'orders') {
        const params = new URLSearchParams({ status: ordersFilter.status, limit: '50', offset: String(ordersOffset) })
        const result = await apiFetch<PaginatedResponse<OrderRow>>(`/api/admin/marketplace/orders?${params}`)
        if (!cancelled && result.success && result.data) setOrders(result.data)
      } else if (tab === 'questions') {
        const params = new URLSearchParams({ status: questionsFilter.status, limit: '50', offset: String(questionsOffset) })
        const result = await apiFetch<PaginatedResponse<QuestionRow>>(`/api/admin/marketplace/questions?${params}`)
        if (!cancelled && result.success && result.data) setQuestions(result.data)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [tab, listingsFilter, listingsOffset, reportsFilter, reportsOffset, ordersFilter, ordersOffset, questionsFilter, questionsOffset])

  // ------- Actions -------

  async function handleEditSave() {
    if (!editId) return
    setEditLoading(true)
    await apiFetch<void>(`/api/admin/marketplace/${editId}`, {
      method: 'PATCH',
      body: editData,
    })
    setEditLoading(false)
    setEditId(null)
    fetchListings()
    refreshStats()
  }

  function handleRemove(id: string, title: string) {
    setPendingRemove({ id, title })
  }

  async function doRemove() {
    if (!pendingRemove) return
    const { id } = pendingRemove
    setPendingRemove(null)
    await apiFetch<void>(`/api/admin/marketplace/${id}`, { method: 'DELETE' })
    fetchListings()
    refreshStats()
  }

  async function handleReport() {
    if (!handlingReportId) return
    setReportLoading(true)
    await apiFetch<void>(`/api/admin/marketplace/reports/${handlingReportId}`, {
      method: 'PATCH',
      body: { action: reportAction, admin_notes: reportNotes || null },
    })
    setReportLoading(false)
    setHandlingReportId(null)
    setReportNotes('')
    fetchReports()
    refreshStats()
  }

  async function handleQuestionModeration(id: string, action: 'hide' | 'restore') {
    await apiFetch<void>(`/api/admin/marketplace/questions/${id}`, {
      method: 'PATCH',
      body: { action },
    })
    fetchQuestions()
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
    setQuestionsOffset(0)
  }

  return {
    fetchListings,
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
    pendingRemove,
    doRemove,
    cancelRemove: () => setPendingRemove(null),

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

    // Questions
    questions,
    questionsFilter,
    setQuestionsFilter,
    questionsOffset,
    setQuestionsOffset,
    handleQuestionModeration,

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

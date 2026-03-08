// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Data fetching hook
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react'
import type {
  Tab, Stats, RequestRow, HelperRow, PaginatedResponse,
  RequestFilter, HelperFilter, EditData,
} from './types'

export function useITHilfeAdmin() {
  const [tab, setTab] = useState<Tab>('requests')
  const [stats, setStats] = useState<Stats | null>(null)

  // Requests state
  const [requests, setRequests] = useState<PaginatedResponse<RequestRow> | null>(null)
  const [reqFilter, setReqFilter] = useState<RequestFilter>({ status: 'all', category: 'all', urgency: 'all', canton: '', search: '' })
  const [reqOffset, setReqOffset] = useState(0)

  // Helpers state
  const [helpers, setHelpers] = useState<PaginatedResponse<HelperRow> | null>(null)
  const [helpFilter, setHelpFilter] = useState<HelperFilter>({ status: 'all', canton: '' })
  const [helpOffset, setHelpOffset] = useState(0)

  // Edit modal
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<EditData>({ status: '', urgency: '', admin_notes: '' })
  const [editLoading, setEditLoading] = useState(false)

  // Helper action
  const [actionHelperId, setActionHelperId] = useState<string | null>(null)
  const [helperAction, setHelperAction] = useState<string>('verify')
  const [helperNotes, setHelperNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [loading, setLoading] = useState(true)

  // Fetch stats
  useEffect(() => {
    fetch('/api/admin/it-hilfe/stats')
      .then(r => r.json())
      .then(r => { if (r.success) setStats(r.data) })
  }, [])

  // Fetch functions (for use in event handlers after mutations)
  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: reqFilter.status,
      category: reqFilter.category,
      urgency: reqFilter.urgency,
      limit: '50',
      offset: String(reqOffset),
    })
    if (reqFilter.canton) params.set('canton', reqFilter.canton)
    if (reqFilter.search) params.set('search', reqFilter.search)
    const r = await fetch(`/api/admin/it-hilfe?${params}`)
    const data = await r.json()
    if (data.success) setRequests(data.data)
    setLoading(false)
  }, [reqFilter, reqOffset])

  const fetchHelpers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      status: helpFilter.status,
      limit: '50',
      offset: String(helpOffset),
    })
    if (helpFilter.canton) params.set('canton', helpFilter.canton)
    const r = await fetch(`/api/admin/it-hilfe/helpers?${params}`)
    const data = await r.json()
    if (data.success) setHelpers(data.data)
    setLoading(false)
  }, [helpFilter, helpOffset])

  // Data fetching — subscribe to external API data (valid effect usage)
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (tab === 'requests') {
        const params = new URLSearchParams({
          status: reqFilter.status,
          category: reqFilter.category,
          urgency: reqFilter.urgency,
          limit: '50',
          offset: String(reqOffset),
        })
        if (reqFilter.canton) params.set('canton', reqFilter.canton)
        if (reqFilter.search) params.set('search', reqFilter.search)
        const r = await fetch(`/api/admin/it-hilfe?${params}`)
        const data = await r.json()
        if (!cancelled && data.success) setRequests(data.data)
      } else {
        const params = new URLSearchParams({ status: helpFilter.status, limit: '50', offset: String(helpOffset) })
        if (helpFilter.canton) params.set('canton', helpFilter.canton)
        const r = await fetch(`/api/admin/it-hilfe/helpers?${params}`)
        const data = await r.json()
        if (!cancelled && data.success) setHelpers(data.data)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [tab, reqFilter, reqOffset, helpFilter, helpOffset])

  const refreshStats = () => {
    fetch('/api/admin/it-hilfe/stats').then(r => r.json()).then(r => { if (r.success) setStats(r.data) })
  }

  // Actions
  async function handleEditSave() {
    if (!editId) return
    setEditLoading(true)
    await fetch(`/api/admin/it-hilfe/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })
    setEditLoading(false)
    setEditId(null)
    fetchRequests()
    refreshStats()
  }

  async function handleHelperAction() {
    if (!actionHelperId) return
    setActionLoading(true)
    await fetch(`/api/admin/it-hilfe/helpers/${actionHelperId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: helperAction, admin_notes: helperNotes || null }),
    })
    setActionLoading(false)
    setActionHelperId(null)
    setHelperNotes('')
    fetchHelpers()
    refreshStats()
  }

  function openEditModal(id: string, status: string, urgency: string, admin_notes: string | null) {
    setEditId(id)
    setEditData({ status, urgency, admin_notes: admin_notes || '' })
  }

  function closeEditModal() {
    setEditId(null)
  }

  function openHelperAction(helperId: string, action: string) {
    setActionHelperId(helperId)
    setHelperAction(action)
    setHelperNotes('')
  }

  function closeHelperAction() {
    setActionHelperId(null)
  }

  function switchTab(t: Tab) {
    setTab(t)
    setReqOffset(0)
    setHelpOffset(0)
  }

  return {
    // Tab
    tab, switchTab,
    // Stats
    stats,
    // Requests
    requests, reqFilter, setReqFilter, reqOffset, setReqOffset,
    // Helpers
    helpers, helpFilter, setHelpFilter, helpOffset, setHelpOffset,
    // Edit modal
    editId, editData, setEditData, editLoading, openEditModal, closeEditModal, handleEditSave,
    // Helper action
    actionHelperId, helperAction, helperNotes, setHelperNotes, actionLoading,
    openHelperAction, closeHelperAction, handleHelperAction,
    // Loading
    loading,
  }
}

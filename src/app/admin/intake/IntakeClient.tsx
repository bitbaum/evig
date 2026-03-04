'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Plus, Search, Filter, ChevronDown, ChevronRight,
  Check, X, Package, RefreshCw, ExternalLink,
  AlertCircle, Type, Mic, Camera, Loader2, ArrowDownUp, Clock,
} from 'lucide-react'
import {
  INTAKE_TIER_LABELS,
  INTAKE_TIER_ICONS,
  CHECKLIST_CATEGORY_LABELS,
  getIntakeTierOptions,
  getChecklistProgress,
} from '@/config/intake-checklist'
import type { IntakeTier, ChecklistState, ChecklistCategory } from '@/config/intake-checklist'
import { KATEGORIEN } from '@/config/erfassung/categories'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { Pagination } from '@/components/ui/Pagination'
import { ImageCapture } from '@/components/erfassung/ImageCapture'
import type { StoredIntakeEvent, IntakeEventType } from '@/lib/intake/timeline-types'
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '@/lib/intake/timeline-types'

// =============================================================================
// TYPES
// =============================================================================

interface PipelineItem {
  id: string
  ai_product_id: string
  item_uuid: string
  product_name: string
  brand: string
  condition: string
  category: string | null
  subcategory: string | null
  short_description: string | null
  intake_tier: IntakeTier
  intake_checklist: ChecklistState
  checklist_complete: boolean
  checklist_progress: {
    completed: number
    total: number
    requiredCompleted: number
    requiredTotal: number
    percentage: number
  }
  marketplace_status: string
  selling_price_chf: number | null
  source_donation_id: string | null
  donor_name: string | null
  created_by_name: string | null
  created_at: string
}

interface ChecklistItemWithState {
  id: string
  label: string
  description: string
  category: ChecklistCategory
  required: boolean
  state: {
    completed: boolean
    completedBy: string | null
    completedAt: string | null
    notes: string
  }
}

interface ChecklistGroup {
  category: string
  label: string
  items: ChecklistItemWithState[]
}

interface DetailData {
  id: string
  item_uuid: string
  brand: string
  product_name: string
  short_description: string | null
  condition: string
  category: string | null
  intake_tier: IntakeTier
  marketplace_status: string
  selling_price_chf: number | null
  source_donation_id: string | null
  donor_name: string | null
  donor_email: string | null
  created_at: string
  created_by_name: string | null
  checklist_complete: boolean
  checklist_progress: {
    completed: number
    total: number
    requiredCompleted: number
    requiredTotal: number
    percentage: number
  }
  checklist_grouped: ChecklistGroup[]
  intake_events: StoredIntakeEvent[]
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function IntakeClient() {
  const [view, setView] = useState<'pipeline' | 'create' | 'detail'>('pipeline')
  const [items, setItems] = useState<PipelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false })

  // Filters
  const [tierFilter, setTierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')

  // Detail
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Create form
  const [formData, setFormData] = useState({
    hersteller: '',
    produktname: '',
    kurzbeschreibung: '',
    verkaufspreis: 0,
    zustand: 'good',
    hauptkategorie: '',
    unterkategorie: '',
    intake_tier: 'refurbish' as IntakeTier,
    is_donation: false,
    donor_name: '',
    donor_email: '',
    donor_notes: '',
    image: null as string | null,
  })
  const [saving, setSaving] = useState(false)

  // Publish
  const [publishPrice, setPublishPrice] = useState(0)
  const [publishing, setPublishing] = useState(false)

  // AI input
  const [aiTab, setAiTab] = useState<'text' | 'voice' | 'photo'>('text')
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)

  // Voice recording
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'processing'>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Tier change
  const [showTierChange, setShowTierChange] = useState(false)
  const [newTier, setNewTier] = useState<IntakeTier>('refurbish')
  const [tierChangeReason, setTierChangeReason] = useState('')
  const [tierChanging, setTierChanging] = useState(false)

  // URL params for donation cross-link
  const searchParams = useSearchParams()

  // ----------------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------------

  const fetchItems = useCallback(async (offset = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20', offset: String(offset) })
      if (tierFilter) params.set('tier', tierFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (searchFilter) params.set('search', searchFilter)

      const res = await fetch(`/api/admin/intake?${params}`)
      const json = await res.json()
      if (json.success) {
        setItems(json.data.items)
        setPagination(json.data.pagination)
      }
    } finally {
      setLoading(false)
    }
  }, [tierFilter, statusFilter, categoryFilter, searchFilter])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (view === 'pipeline') {
        setLoading(true)
        try {
          const params = new URLSearchParams({ limit: '20', offset: '0' })
          if (tierFilter) params.set('tier', tierFilter)
          if (statusFilter) params.set('status', statusFilter)
          if (categoryFilter) params.set('category', categoryFilter)
          if (searchFilter) params.set('search', searchFilter)

          const res = await fetch(`/api/admin/intake?${params}`)
          const json = await res.json()
          if (!cancelled && json.success) {
            setItems(json.data.items)
            setPagination(json.data.pagination)
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [view, tierFilter, statusFilter, categoryFilter, searchFilter])

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/intake/${id}`)
      const json = await res.json()
      if (json.success) {
        setDetail(json.data)
        setPublishPrice(json.data.selling_price_chf || 0)
      }
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const openDetail = (id: string) => {
    setSelectedId(id)
    setView('detail')
    fetchDetail(id)
  }

  // ----------------------------------------------------------
  // URL PARAM PRE-FILL (donation cross-link)
  // ----------------------------------------------------------

  useEffect(() => {
    const donationId = searchParams.get('donation_id')
    const donorName = searchParams.get('donor_name')
    const donorEmail = searchParams.get('donor_email')
    if (donationId || donorName || donorEmail) {
      setView('create')
      setFormData(f => ({
        ...f,
        is_donation: true,
        donor_name: donorName || '',
        donor_email: donorEmail || '',
      }))
    }
  }, [searchParams])

  // ----------------------------------------------------------
  // AI INPUT HANDLERS
  // ----------------------------------------------------------

  const applyAiData = useCallback((data: Record<string, unknown>) => {
    setFormData(f => ({
      ...f,
      hersteller: (data.hersteller as string) || f.hersteller,
      produktname: (data.produktname as string) || f.produktname,
      kurzbeschreibung: (data.kurzbeschreibung as string) || f.kurzbeschreibung,
      zustand: (data.zustand as string) || f.zustand,
      hauptkategorie: (data.hauptkategorie as string) || f.hauptkategorie,
      unterkategorie: (data.unterkategorie as string) || f.unterkategorie,
      verkaufspreis: data.verkaufspreis ? Number(data.verkaufspreis) : f.verkaufspreis,
    }))
  }, [])

  const handleAiTextExtract = async () => {
    if (aiText.trim().length < 3) return
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/admin/intake/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      })
      const json = await res.json()
      if (json.success) {
        applyAiData(json.data.data)
      } else {
        setAiError(json.error || 'Extraktion fehlgeschlagen')
      }
    } catch {
      setAiError('Netzwerkfehler')
    } finally {
      setAiLoading(false)
    }
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setVoiceState('processing')

        try {
          const fd = new FormData()
          fd.append('audio', audioBlob, 'recording.webm')
          const res = await fetch('/api/admin/intake/extract-voice', { method: 'POST', body: fd })
          const json = await res.json()
          if (json.success) {
            applyAiData(json.data.data)
            setAiText(json.data.transcription || '')
          } else {
            setAiError(json.error || 'Spracherkennung fehlgeschlagen')
          }
        } catch {
          setAiError('Netzwerkfehler')
        } finally {
          setVoiceState('idle')
        }
      }

      mediaRecorder.start()
      setVoiceState('recording')
      setAiError(null)
    } catch {
      setAiError('Mikrofon nicht verfügbar')
    }
  }

  const stopVoiceRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  const handlePhotoAnalysis = (data: Record<string, unknown>) => {
    applyAiData(data)
  }

  // ----------------------------------------------------------
  // TIER CHANGE
  // ----------------------------------------------------------

  const handleTierChange = async () => {
    if (!selectedId || !tierChangeReason.trim()) return
    setTierChanging(true)
    try {
      const res = await fetch(`/api/admin/intake/${selectedId}/change-tier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_tier: newTier, reason: tierChangeReason }),
      })
      const json = await res.json()
      if (json.success) {
        setShowTierChange(false)
        setTierChangeReason('')
        fetchDetail(selectedId)
      }
    } finally {
      setTierChanging(false)
    }
  }

  // ----------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------

  const handleCreate = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          verkaufspreis: formData.verkaufspreis || undefined,
          donor_email: formData.donor_email || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setView('pipeline')
        setFormData({
          hersteller: '', produktname: '', kurzbeschreibung: '',
          verkaufspreis: 0, zustand: 'good', hauptkategorie: '',
          unterkategorie: '', intake_tier: 'refurbish',
          is_donation: false, donor_name: '', donor_email: '', donor_notes: '',
          image: null,
        })
        fetchItems()
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleChecklist = async (itemId: string, completed: boolean) => {
    if (!selectedId) return
    const res = await fetch(`/api/admin/intake/${selectedId}/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, completed }),
    })
    const json = await res.json()
    if (json.success && detail) {
      // Refresh detail to get updated state
      fetchDetail(selectedId)
    }
  }

  const handlePublish = async () => {
    if (!selectedId) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/admin/intake/${selectedId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_chf: publishPrice }),
      })
      const json = await res.json()
      if (json.success) {
        fetchDetail(selectedId)
      }
    } finally {
      setPublishing(false)
    }
  }

  // ----------------------------------------------------------
  // RENDER: PIPELINE VIEW
  // ----------------------------------------------------------

  const renderPipeline = () => (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: pagination.total, color: 'bg-gray-100 text-gray-800' },
          { label: 'In Bearbeitung', value: items.filter(i => !i.checklist_complete && i.marketplace_status === 'draft').length, color: 'bg-yellow-100 text-yellow-800' },
          { label: 'Bereit', value: items.filter(i => i.checklist_complete && i.marketplace_status === 'draft').length, color: 'bg-green-100 text-green-800' },
          { label: 'Publiziert', value: items.filter(i => i.marketplace_status === 'published').length, color: 'bg-blue-100 text-blue-800' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg p-3 ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setView('create')}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Neues Gerät
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <Filter className="w-4 h-4 text-gray-400" />
        </div>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="border rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="">Alle Stufen</option>
          {getIntakeTierOptions().map(o => (
            <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="">Alle Status</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="ready">Bereit</option>
          <option value="published">Publiziert</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="">Alle Kategorien</option>
          {KATEGORIEN.map(k => (
            <option key={k.value} value={k.value}>{k.icon} {k.label}</option>
          ))}
        </select>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Suche..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="border rounded-lg pl-8 pr-3 py-1.5 text-sm w-40"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Laden...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-2">Keine Geräte in der Pipeline</p>
          <button
            onClick={() => setView('create')}
            className="text-blue-600 hover:underline text-sm"
          >
            Erstes Gerät erfassen
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">UUID</th>
                  <th className="pb-2 font-medium">Gerät</th>
                  <th className="pb-2 font-medium">Stufe</th>
                  <th className="pb-2 font-medium">Checkliste</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Spende</th>
                  <th className="pb-2 font-medium">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => {
                  const progress = item.checklist_progress
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openDetail(item.id)}
                    >
                      <td className="py-2.5 font-mono text-xs text-gray-500">{item.item_uuid}</td>
                      <td className="py-2.5">
                        <div className="font-medium">{item.brand} {item.product_name}</div>
                        <div className="text-xs text-gray-500">
                          {KATEGORIEN.find(k => k.value === item.category)?.label || '-'}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1 text-xs">
                          {INTAKE_TIER_ICONS[item.intake_tier]} {INTAKE_TIER_LABELS[item.intake_tier]}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                progress.percentage === 100 ? 'bg-green-500' :
                                progress.percentage > 50 ? 'bg-yellow-500' : 'bg-red-400'
                              }`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {progress.requiredCompleted}/{progress.requiredTotal}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        {item.marketplace_status === 'published' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                            <Check className="w-3 h-3" /> Publiziert
                          </span>
                        ) : item.checklist_complete ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                            Bereit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            In Bearbeitung
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {item.source_donation_id ? (
                          <span className="text-xs text-green-600">{item.donor_name || 'Ja'}</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('de-CH')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={Math.floor(pagination.offset / pagination.limit) + 1}
            totalPages={Math.ceil(pagination.total / pagination.limit)}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(page: number) => fetchItems((page - 1) * pagination.limit)}
          />
        </>
      )}
    </div>
  )

  // ----------------------------------------------------------
  // RENDER: CREATE FORM
  // ----------------------------------------------------------

  const renderCreateForm = () => {
    const tierOptions = getIntakeTierOptions()
    const selectedCategory = KATEGORIEN.find(k => k.value === formData.hauptkategorie)

    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Neues Gerät erfassen</h2>
          <button
            onClick={() => setView('pipeline')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tier Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Verarbeitungsstufe</label>
          <div className="grid grid-cols-3 gap-3">
            {tierOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData(f => ({ ...f, intake_tier: opt.value }))}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  formData.intake_tier === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{opt.icon}</div>
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Quick Input */}
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setAiOpen(!aiOpen)}
            className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 text-left"
          >
            <span className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <Loader2 className="w-4 h-4" />
              KI-Schnelleingabe
            </span>
            {aiOpen ? <ChevronDown className="w-4 h-4 text-purple-600" /> : <ChevronRight className="w-4 h-4 text-purple-600" />}
          </button>

          {aiOpen && (
            <div className="p-4 space-y-3 bg-white">
              {/* Tabs */}
              <div className="flex gap-1 border-b">
                {([
                  { key: 'text' as const, icon: Type, label: 'Text' },
                  { key: 'voice' as const, icon: Mic, label: 'Sprache' },
                  { key: 'photo' as const, icon: Camera, label: 'Foto' },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setAiTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                      aiTab === tab.key
                        ? 'border-purple-600 text-purple-700 font-medium'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Text Tab */}
              {aiTab === 'text' && (
                <div className="space-y-2">
                  <textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="z.B. Dell Latitude E7470 i5 8GB 256GB SSD guter Zustand"
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAiTextExtract}
                    disabled={aiLoading || aiText.trim().length < 3}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm flex items-center gap-1.5"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Type className="w-3.5 h-3.5" />}
                    Analysieren
                  </button>
                </div>
              )}

              {/* Voice Tab */}
              {aiTab === 'voice' && (
                <div className="space-y-2">
                  {voiceState === 'idle' && (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 w-full justify-center text-sm text-gray-600"
                    >
                      <Mic className="w-5 h-5" />
                      Aufnahme starten
                    </button>
                  )}
                  {voiceState === 'recording' && (
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="flex items-center gap-2 px-4 py-3 bg-red-50 border-2 border-red-300 rounded-lg w-full justify-center text-sm text-red-700 animate-pulse"
                    >
                      <Mic className="w-5 h-5" />
                      Aufnahme stoppen
                    </button>
                  )}
                  {voiceState === 'processing' && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 rounded-lg justify-center text-sm text-purple-700">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verarbeite Sprache...
                    </div>
                  )}
                  {aiText && voiceState === 'idle' && (
                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">Transkription: {aiText}</p>
                  )}
                </div>
              )}

              {/* Photo Tab */}
              {aiTab === 'photo' && (
                <ImageCapture
                  onImageCapture={(base64) => setFormData(f => ({ ...f, image: base64 }))}
                  onAnalysisComplete={(data) => handlePhotoAnalysis(data as Record<string, unknown>)}
                />
              )}

              {/* Error */}
              {aiError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {aiError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Device Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Hersteller *</label>
            <input
              type="text"
              value={formData.hersteller}
              onChange={(e) => setFormData(f => ({ ...f, hersteller: e.target.value }))}
              placeholder="z.B. Lenovo, Apple, Dell"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Produktname *</label>
            <input
              type="text"
              value={formData.produktname}
              onChange={(e) => setFormData(f => ({ ...f, produktname: e.target.value }))}
              placeholder="z.B. ThinkPad T480"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kurzbeschreibung</label>
          <textarea
            value={formData.kurzbeschreibung}
            onChange={(e) => setFormData(f => ({ ...f, kurzbeschreibung: e.target.value }))}
            placeholder="Kurze Beschreibung des Geräts und seines Zustands"
            rows={2}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kategorie</label>
            <select
              value={formData.hauptkategorie}
              onChange={(e) => setFormData(f => ({ ...f, hauptkategorie: e.target.value, unterkategorie: '' }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Wählen...</option>
              {KATEGORIEN.map(k => (
                <option key={k.value} value={k.value}>{k.icon} {k.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unterkategorie</label>
            <select
              value={formData.unterkategorie}
              onChange={(e) => setFormData(f => ({ ...f, unterkategorie: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              disabled={!selectedCategory}
            >
              <option value="">Wählen...</option>
              {selectedCategory?.subs.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Zustand *</label>
            <select
              value={formData.zustand}
              onChange={(e) => setFormData(f => ({ ...f, zustand: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {ZUSTAND_OPTIONS.map(z => (
                <option key={z.value} value={z.value}>{z.label}</option>
              ))}
            </select>
          </div>
        </div>

        {formData.intake_tier === 'refurbish' && (
          <div>
            <label className="block text-sm font-medium mb-1">Geschätzter Verkaufspreis (CHF)</label>
            <input
              type="number"
              value={formData.verkaufspreis || ''}
              onChange={(e) => setFormData(f => ({ ...f, verkaufspreis: Number(e.target.value) }))}
              placeholder="0"
              min={0}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}

        {/* Donation Toggle */}
        <div className="border rounded-lg p-4 bg-green-50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_donation}
              onChange={(e) => setFormData(f => ({ ...f, is_donation: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm font-medium">Dies ist eine Spende</span>
          </label>

          {formData.is_donation && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">Name Spender/in</label>
                <input
                  type="text"
                  value={formData.donor_name}
                  onChange={(e) => setFormData(f => ({ ...f, donor_name: e.target.value }))}
                  placeholder="Optional"
                  className="w-full border rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">E-Mail Spender/in</label>
                <input
                  type="email"
                  value={formData.donor_email}
                  onChange={(e) => setFormData(f => ({ ...f, donor_email: e.target.value }))}
                  placeholder="Optional"
                  className="w-full border rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1 text-gray-600">Notizen zur Spende</label>
                <input
                  type="text"
                  value={formData.donor_notes}
                  onChange={(e) => setFormData(f => ({ ...f, donor_notes: e.target.value }))}
                  placeholder="z.B. Übergeben am Standort Zürich"
                  className="w-full border rounded px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            disabled={saving || !formData.hersteller || !formData.produktname}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'Speichern...' : 'Gerät erfassen'}
          </button>
          <button
            onClick={() => setView('pipeline')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
          >
            Abbrechen
          </button>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------------
  // RENDER: DETAIL VIEW WITH CHECKLIST
  // ----------------------------------------------------------

  const renderDetail = () => {
    if (detailLoading || !detail) {
      return <div className="text-center py-8 text-gray-500">Laden...</div>
    }

    const progress = detail.checklist_progress

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => { setView('pipeline'); setDetail(null) }}
              className="text-sm text-blue-600 hover:underline mb-2 flex items-center gap-1"
            >
              ← Zurück zur Pipeline
            </button>
            <h2 className="text-lg font-semibold">{detail.brand} {detail.product_name}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="font-mono">{detail.item_uuid}</span>
              <span>{INTAKE_TIER_ICONS[detail.intake_tier]} {INTAKE_TIER_LABELS[detail.intake_tier]}</span>
              {detail.source_donation_id && (
                <span className="text-green-600">Spende{detail.donor_name ? `: ${detail.donor_name}` : ''}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {detail.marketplace_status === 'published' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                <Check className="w-4 h-4" /> Im Shop
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setNewTier(detail.intake_tier === 'refurbish' ? 'parts' : 'refurbish'); setShowTierChange(true) }}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs border rounded-lg hover:bg-gray-50"
                  title="Stufe ändern"
                >
                  <ArrowDownUp className="w-3.5 h-3.5" /> Stufe ändern
                </button>
                <button
                  onClick={() => fetchDetail(detail.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Aktualisieren"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Fortschritt: {progress.requiredCompleted}/{progress.requiredTotal} Pflichtpunkte
            </span>
            <span className={`text-sm font-bold ${
              progress.percentage === 100 ? 'text-green-600' : 'text-gray-600'
            }`}>
              {progress.percentage}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progress.percentage === 100 ? 'bg-green-500' :
                progress.percentage > 50 ? 'bg-yellow-500' : 'bg-red-400'
              }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Checklist Groups */}
        <div className="space-y-4">
          {detail.checklist_grouped.map((group) => (
            <ChecklistGroupComponent
              key={group.category}
              group={group}
              onToggle={toggleChecklist}
            />
          ))}
        </div>

        {/* Publish Section */}
        {detail.intake_tier === 'refurbish' && detail.marketplace_status !== 'published' && (
          <div className={`border-2 rounded-lg p-4 ${
            detail.checklist_complete
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 bg-gray-50'
          }`}>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Im Shop veröffentlichen
            </h3>

            {!detail.checklist_complete && (
              <div className="flex items-start gap-2 mb-3 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Alle Pflichtpunkte der Checkliste müssen abgehakt sein, bevor das Gerät publiziert werden kann.</span>
              </div>
            )}

            <div className="flex items-end gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Verkaufspreis (CHF)</label>
                <input
                  type="number"
                  value={publishPrice || ''}
                  onChange={(e) => setPublishPrice(Number(e.target.value))}
                  min={0}
                  className="border rounded-lg px-3 py-2 text-sm w-32"
                  disabled={!detail.checklist_complete}
                />
              </div>
              <button
                onClick={handlePublish}
                disabled={!detail.checklist_complete || publishing || publishPrice <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
              >
                {publishing ? 'Publizieren...' : 'Jetzt publizieren'}
              </button>
            </div>
          </div>
        )}

        {/* Published confirmation */}
        {detail.marketplace_status === 'published' && (
          <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4 text-center">
            <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-800">Dieses Gerät ist im Shop veröffentlicht</p>
            {detail.selling_price_chf && (
              <p className="text-sm text-green-700 mt-1">Preis: CHF {detail.selling_price_chf.toFixed(2)}</p>
            )}
          </div>
        )}

        {/* Tier Change Dialog */}
        {showTierChange && (
          <div className="border-2 border-orange-300 bg-orange-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2 text-orange-800">
              <ArrowDownUp className="w-4 h-4" /> Stufe ändern
            </h3>
            <div className="flex items-start gap-2 text-sm text-orange-700 bg-orange-100 p-2 rounded">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Alle Checklisten-Fortschritte werden zurückgesetzt.</span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Neue Stufe</label>
              <select
                value={newTier}
                onChange={(e) => setNewTier(e.target.value as IntakeTier)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                {getIntakeTierOptions().filter(o => o.value !== detail.intake_tier).map(o => (
                  <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Begründung *</label>
              <input
                type="text"
                value={tierChangeReason}
                onChange={(e) => setTierChangeReason(e.target.value)}
                placeholder="z.B. Gerät ist nicht reparierbar"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTierChange}
                disabled={tierChanging || !tierChangeReason.trim()}
                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
              >
                {tierChanging ? 'Ändern...' : 'Stufe ändern'}
              </button>
              <button
                type="button"
                onClick={() => setShowTierChange(false)}
                className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-sm"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Timeline */}
        {detail.intake_events && detail.intake_events.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-gray-50 border-b">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Verlauf</span>
              <span className="text-xs text-gray-500">({detail.intake_events.length})</span>
            </div>
            <div className="divide-y max-h-64 overflow-y-auto">
              {[...detail.intake_events].reverse().map((event, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2 text-xs">
                  <span className="mt-0.5 text-base leading-none">{EVENT_TYPE_ICONS[event.type as IntakeEventType] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{EVENT_TYPE_LABELS[event.type as IntakeEventType] || event.type}</span>
                    <span className="text-gray-500 ml-1.5">{event.description}</span>
                    <div className="text-gray-400 mt-0.5">
                      {event.userEmail && <span>{event.userEmail}</span>}
                      {event.timestamp && (
                        <span className="ml-2">{new Date(event.timestamp).toLocaleString('de-CH')}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ----------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------

  return (
    <div>
      {view === 'pipeline' && renderPipeline()}
      {view === 'create' && renderCreateForm()}
      {view === 'detail' && renderDetail()}
    </div>
  )
}

// =============================================================================
// CHECKLIST GROUP COMPONENT
// =============================================================================

function ChecklistGroupComponent({
  group,
  onToggle,
}: {
  group: ChecklistGroup
  onToggle: (itemId: string, completed: boolean) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const completedCount = group.items.filter(i => i.state.completed).length

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-left"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-medium text-sm">{group.label}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          completedCount === group.items.length
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-200 text-gray-600'
        }`}>
          {completedCount}/{group.items.length}
        </span>
      </button>

      {expanded && (
        <div className="divide-y">
          {group.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 ${
                item.state.completed ? 'bg-green-50' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => onToggle(item.id, !item.state.completed)}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  item.state.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                {item.state.completed && <Check className="w-3 h-3" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${item.state.completed ? 'line-through text-gray-500' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  {item.required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                {item.state.completed && item.state.completedAt && (
                  <p className="text-xs text-green-600 mt-1">
                    Erledigt am {new Date(item.state.completedAt).toLocaleDateString('de-CH')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

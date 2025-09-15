import React, { useState, useEffect, useMemo } from 'react'
import { 
  Suggestion, 
  SuggestionStatus, 
  SuggestionFilters,
  SuggestionStats,
  AINativeCMS
} from '../../../ai-native-cms-core/src'

export interface AdminDashboardProps {
  cms: AINativeCMS
  className?: string
  style?: React.CSSProperties
  onSuggestionSelect?: (suggestion: Suggestion) => void
  onStatusUpdate?: (suggestionId: string, newStatus: SuggestionStatus) => void
  showStats?: boolean
  showFilters?: boolean
  pageSize?: number
}

interface FilterState {
  status?: SuggestionStatus
  page?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  cms,
  className = '',
  style,
  onSuggestionSelect,
  onStatusUpdate,
  showStats = true,
  showFilters = true,
  pageSize = 10
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [stats, setStats] = useState<SuggestionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const suggestionFilters: SuggestionFilters = {
        status: filters.status,
        page: filters.page,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      }

      if (filters.dateFrom) {
        suggestionFilters.dateFrom = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        suggestionFilters.dateTo = new Date(filters.dateTo)
      }

      const [suggestionsData, statsData] = await Promise.all([
        cms.getSuggestions(suggestionFilters),
        showStats ? cms.getStats() : Promise.resolve(null)
      ])

      setSuggestions(suggestionsData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [cms, filters, currentPage, pageSize])

  // Handle status update
  const handleStatusUpdate = async (suggestionId: string, newStatus: SuggestionStatus) => {
    try {
      await cms.updateSuggestionStatus(suggestionId, newStatus)
      
      // Update local state
      setSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...s, status: newStatus } : s)
      )

      if (onStatusUpdate) {
        onStatusUpdate(suggestionId, newStatus)
      }

      // Reload stats
      if (showStats) {
        const newStats = await cms.getStats()
        setStats(newStats)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  // Generate AI instructions
  const handleGenerateAI = async (suggestionId: string) => {
    try {
      const instructions = await cms.generateAIInstructions(suggestionId)
      
      // Update local state
      setSuggestions(prev =>
        prev.map(s => 
          s.id === suggestionId 
            ? { ...s, aiInstructions: instructions, status: SuggestionStatus.AI_GENERATED }
            : s
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI instructions')
    }
  }

  // Filter suggestions based on search
  const filteredSuggestions = useMemo(() => {
    if (!filters.search) return suggestions

    const searchLower = filters.search.toLowerCase()
    return suggestions.filter(s => 
      s.content.toLowerCase().includes(searchLower) ||
      s.page.toLowerCase().includes(searchLower) ||
      (s.contact && s.contact.toLowerCase().includes(searchLower))
    )
  }, [suggestions, filters.search])

  // Get unique pages for filter dropdown
  const uniquePages = useMemo(() => {
    const pages = suggestions.map(s => s.page)
    return Array.from(new Set(pages)).sort()
  }, [suggestions])

  // Status color mapping
  const getStatusColor = (status: SuggestionStatus) => {
    const colors = {
      [SuggestionStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [SuggestionStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
      [SuggestionStatus.AI_GENERATED]: 'bg-green-100 text-green-800',
      [SuggestionStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-800',
      [SuggestionStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [SuggestionStatus.REJECTED]: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  if (loading) {
    return (
      <div className={`ai-cms-admin-dashboard ${className}`} style={style}>
        <div className="ai-cms-loading">
          <div className="ai-cms-spinner"></div>
          <p>Loading suggestions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`ai-cms-admin-dashboard ${className}`} style={style}>
      {/* Header */}
      <div className="ai-cms-dashboard-header">
        <h1>AI-Native CMS Dashboard</h1>
        <button onClick={loadData} className="ai-cms-refresh-button">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="ai-cms-error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Stats */}
      {showStats && stats && (
        <div className="ai-cms-stats-grid">
          <div className="ai-cms-stat-card">
            <h3>Total Suggestions</h3>
            <p className="ai-cms-stat-number">{stats.total}</p>
          </div>
          <div className="ai-cms-stat-card">
            <h3>Pending</h3>
            <p className="ai-cms-stat-number text-yellow-600">{stats.byStatus[SuggestionStatus.PENDING]}</p>
          </div>
          <div className="ai-cms-stat-card">
            <h3>In Progress</h3>
            <p className="ai-cms-stat-number text-blue-600">{stats.byStatus[SuggestionStatus.IN_PROGRESS]}</p>
          </div>
          <div className="ai-cms-stat-card">
            <h3>Completed</h3>
            <p className="ai-cms-stat-number text-green-600">{stats.byStatus[SuggestionStatus.COMPLETED]}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="ai-cms-filters">
          <div className="ai-cms-filter-row">
            <input
              type="text"
              placeholder="Search suggestions..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="ai-cms-search-input"
            />
            
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as SuggestionStatus || undefined }))}
              className="ai-cms-filter-select"
            >
              <option value="">All Statuses</option>
              {Object.values(SuggestionStatus).map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={filters.page || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, page: e.target.value || undefined }))}
              className="ai-cms-filter-select"
            >
              <option value="">All Pages</option>
              {uniquePages.map(page => (
                <option key={page} value={page}>{page}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Suggestions List */}
      <div className="ai-cms-suggestions-list">
        {filteredSuggestions.length === 0 ? (
          <div className="ai-cms-empty-state">
            <p>No suggestions found</p>
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <div 
              key={suggestion.id} 
              className="ai-cms-suggestion-card"
              onClick={() => {
                setSelectedSuggestion(suggestion)
                if (onSuggestionSelect) {
                  onSuggestionSelect(suggestion)
                }
              }}
            >
              <div className="ai-cms-suggestion-header">
                <div className="ai-cms-suggestion-meta">
                  <span className="ai-cms-suggestion-page">{suggestion.page}</span>
                  <span className="ai-cms-suggestion-time">
                    {new Date(suggestion.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <span className={`ai-cms-status-badge ${getStatusColor(suggestion.status)}`}>
                  {suggestion.status.replace('_', ' ')}
                </span>
              </div>

              <div className="ai-cms-suggestion-content">
                <p>"{suggestion.content}"</p>
                {suggestion.contact && (
                  <p className="ai-cms-suggestion-contact">
                    Contact: {suggestion.contact}
                  </p>
                )}
              </div>

              <div className="ai-cms-suggestion-actions">
                <select
                  value={suggestion.status}
                  onChange={(e) => {
                    e.stopPropagation()
                    handleStatusUpdate(suggestion.id, e.target.value as SuggestionStatus)
                  }}
                  className="ai-cms-status-select"
                >
                  {Object.values(SuggestionStatus).map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>

                {!suggestion.aiInstructions && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleGenerateAI(suggestion.id)
                    }}
                    className="ai-cms-action-button"
                  >
                    🤖 Generate AI
                  </button>
                )}

                {suggestion.aiInstructions && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(suggestion.aiInstructions!)
                    }}
                    className="ai-cms-action-button"
                  >
                    📋 Copy Instructions
                  </button>
                )}
              </div>

              {suggestion.aiInstructions && (
                <div className="ai-cms-ai-instructions">
                  <h4>🤖 AI Instructions:</h4>
                  <pre>{suggestion.aiInstructions}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {suggestions.length >= pageSize && (
        <div className="ai-cms-pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="ai-cms-pagination-button"
          >
            Previous
          </button>
          <span className="ai-cms-pagination-info">
            Page {currentPage}
          </span>
          <button
            disabled={suggestions.length < pageSize}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="ai-cms-pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Suggestion, SuggestionStatus, SuggestionStats, SuggestionCategory } from '@/types/suggestion'

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [stats, setStats] = useState<SuggestionStats | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [filter, setFilter] = useState<SuggestionStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    fetch('/api/admin/auth')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsAuthenticated(true)
          loadData()
        } else {
          router.push('/admin/login')
        }
        setIsLoading(false)
      })
      .catch(() => {
        router.push('/admin/login')
        setIsLoading(false)
      })
  }, [router])

  const loadData = async () => {
    try {
      const [suggestionsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/suggestions?limit=50`),
        fetch('/api/admin/suggestions?stats=true')
      ])

      if (suggestionsRes.ok && statsRes.ok) {
        const suggestionsData = await suggestionsRes.json()
        const statsData = await statsRes.json()
        
        setSuggestions(suggestionsData)
        setStats(statsData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleAction = async (action: string, suggestionId: string, notes?: string) => {
    setActionLoading(suggestionId)
    
    try {
      const response = await fetch('/api/admin/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, suggestionId, notes })
      })

      if (response.ok) {
        await loadData() // Refresh data
        if (selectedSuggestion?.id === suggestionId) {
          const updated = suggestions.find(s => s.id === suggestionId)
          if (updated) setSelectedSuggestion(updated)
        }
      }
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  const getStatusColor = (status: SuggestionStatus) => {
    const colors = {
      [SuggestionStatus.PENDING_REVIEW]: 'bg-yellow-100 text-yellow-800',
      [SuggestionStatus.NEEDS_APPROVAL]: 'bg-blue-100 text-blue-800',
      [SuggestionStatus.APPROVED]: 'bg-green-100 text-green-800',
      [SuggestionStatus.READY_FOR_IMPLEMENTATION]: 'bg-green-100 text-green-800',
      [SuggestionStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-800',
      [SuggestionStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [SuggestionStatus.REJECTED]: 'bg-red-100 text-red-800',
      [SuggestionStatus.DEFERRED]: 'bg-gray-100 text-gray-800',
      [SuggestionStatus.AWAITING_CLARIFICATION]: 'bg-orange-100 text-orange-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',  
      low: 'bg-green-100 text-green-800'
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesFilter = filter === 'all' || suggestion.status === filter
    const matchesSearch = !searchTerm || 
      suggestion.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.page.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (suggestion.contact && suggestion.contact.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesFilter && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI-Native CMS</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={loadData}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Suggestions</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Review</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.byStatus[SuggestionStatus.PENDING_REVIEW] + stats.byStatus[SuggestionStatus.NEEDS_APPROVAL]}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-indigo-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.byStatus[SuggestionStatus.IN_PROGRESS]}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.byStatus[SuggestionStatus.COMPLETED]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search suggestions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as SuggestionStatus | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Statuses</option>
                <option value={SuggestionStatus.PENDING_REVIEW}>Pending Review</option>
                <option value={SuggestionStatus.NEEDS_APPROVAL}>Needs Approval</option>
                <option value={SuggestionStatus.READY_FOR_IMPLEMENTATION}>Ready for Implementation</option>
                <option value={SuggestionStatus.IN_PROGRESS}>In Progress</option>
                <option value={SuggestionStatus.COMPLETED}>Completed</option>
                <option value={SuggestionStatus.REJECTED}>Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Suggestions List */}
        <div className="space-y-4">
          {filteredSuggestions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No suggestions found</h3>
                <p className="text-gray-500">
                  {filter === 'all' ? "No suggestions have been submitted yet." : `No suggestions with status "${filter}".`}
                </p>
              </div>
            </div>
          ) : (
            filteredSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                          {suggestion.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority.toUpperCase()} PRIORITY
                        </span>
                        <span className="text-sm text-gray-500">
                          {suggestion.page}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        "{suggestion.content}"
                      </h3>
                      
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Contact: {suggestion.contact || 'Anonymous'}</p>
                        <p>Submitted: {new Date(suggestion.timestamp).toLocaleString()}</p>
                        {suggestion.confidence > 0 && (
                          <p>AI Confidence: {suggestion.confidence}%</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Instructions */}
                  {suggestion.aiInstructions && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-blue-900">🤖 AI Instructions:</h4>
                        <button
                          onClick={() => copyToClipboard(suggestion.aiInstructions!)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <div className="text-sm text-blue-800 max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-mono text-xs">
                          {suggestion.aiInstructions.substring(0, 300)}
                          {suggestion.aiInstructions.length > 300 && '...'}
                        </pre>
                      </div>
                      {suggestion.aiInstructions.length > 300 && (
                        <button
                          onClick={() => setSelectedSuggestion(suggestion)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2"
                        >
                          View Full Instructions
                        </button>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {suggestion.status === SuggestionStatus.PENDING_REVIEW && (
                      <>
                        {!suggestion.aiInstructions && (
                          <button
                            onClick={() => handleAction('generate_ai', suggestion.id)}
                            disabled={actionLoading === suggestion.id}
                            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50"
                          >
                            {actionLoading === suggestion.id ? 'Generating...' : '🤖 Generate AI'}
                          </button>
                        )}
                        <button
                          onClick={() => handleAction('approve', suggestion.id)}
                          disabled={actionLoading === suggestion.id}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleAction('reject', suggestion.id)}
                          disabled={actionLoading === suggestion.id}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}

                    {suggestion.status === SuggestionStatus.NEEDS_APPROVAL && (
                      <>
                        <button
                          onClick={() => handleAction('approve', suggestion.id)}
                          disabled={actionLoading === suggestion.id}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleAction('reject', suggestion.id)}
                          disabled={actionLoading === suggestion.id}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}

                    {(suggestion.status === SuggestionStatus.READY_FOR_IMPLEMENTATION || suggestion.status === SuggestionStatus.APPROVED) && (
                      <button
                        onClick={() => handleAction('mark_in_progress', suggestion.id)}
                        disabled={actionLoading === suggestion.id}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
                      >
                        🚀 Start Implementation
                      </button>
                    )}

                    {suggestion.status === SuggestionStatus.IN_PROGRESS && (
                      <button
                        onClick={() => handleAction('mark_completed', suggestion.id)}
                        disabled={actionLoading === suggestion.id}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
                      >
                        ✅ Mark Complete
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedSuggestion(suggestion)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      👁️ View Details
                    </button>

                    <a
                      href={suggestion.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      🔗 View Page
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Suggestion Details
              </h3>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Suggestion
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                  "{selectedSuggestion.content}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page
                  </label>
                  <p className="text-gray-900">{selectedSuggestion.page}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSuggestion.status)}`}>
                    {selectedSuggestion.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact
                </label>
                <p className="text-gray-900">{selectedSuggestion.contact || 'Anonymous'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <a 
                  href={selectedSuggestion.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 underline"
                >
                  {selectedSuggestion.url}
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submitted
                </label>
                <p className="text-gray-900">
                  {new Date(selectedSuggestion.timestamp).toLocaleString()}
                </p>
              </div>

              {selectedSuggestion.aiInstructions && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      AI Instructions
                    </label>
                    <button
                      onClick={() => copyToClipboard(selectedSuggestion.aiInstructions!)}
                      className="text-sm text-green-600 hover:text-green-800 font-medium"
                    >
                      📋 Copy Instructions
                    </button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {selectedSuggestion.aiInstructions}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
              <a
                href={selectedSuggestion.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                View Page
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

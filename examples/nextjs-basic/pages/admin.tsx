import { useState } from 'react'
import Link from 'next/link'
import { AdminDashboard, AINativeCMSProvider } from '@ai-native-cms/react'
import { createDefaultConfig } from '@ai-native-cms/core'
import '@ai-native-cms/react/styles'

// Configure AI-Native CMS
const cmsConfig = createDefaultConfig({
  name: 'My Next.js Website',
  domain: 'localhost:3000',
  framework: 'nextjs',
  aiProvider: 'template'
})

// Override with production settings
cmsConfig.storage = {
  adapter: 'postgres',
  config: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ai_cms',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  }
}

export default function AdminPage() {
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null)

  return (
    <AINativeCMSProvider 
      config={cmsConfig}
      onError={(error) => {
        console.error('CMS initialization failed:', error)
      }}
    >
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
              </div>
              <nav className="flex space-x-4">
                <Link
                  href="/"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Back to Site
                </Link>
                <Link
                  href="/admin"
                  className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg">
              <AdminDashboard
                cms={null as any} // Will be provided by the provider
                showStats={true}
                showFilters={true}
                pageSize={10}
                onSuggestionSelect={(suggestion) => {
                  setSelectedSuggestion(suggestion)
                  console.log('Selected suggestion:', suggestion)
                }}
                onStatusUpdate={(suggestionId, newStatus) => {
                  console.log(`Updated suggestion ${suggestionId} to ${newStatus}`)
                }}
              />
            </div>
          </div>
        </main>

        {/* Suggestion Detail Modal */}
        {selectedSuggestion && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
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
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
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
                      className="text-indigo-600 hover:text-indigo-800 underline"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AI Instructions
                      </label>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 max-h-64 overflow-y-auto">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                          {selectedSuggestion.aiInstructions}
                        </pre>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedSuggestion.aiInstructions)
                          alert('Instructions copied to clipboard!')
                        }}
                        className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                      >
                        📋 Copy Instructions
                      </button>
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
                  {selectedSuggestion.url && (
                    <a
                      href={selectedSuggestion.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                    >
                      View Page
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AINativeCMSProvider>
  )
}
'use client'

import { useState, useEffect } from 'react'

export default function AdminTestPage() {
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const results: any = {}

    try {
      // Test 1: Check if API is accessible
      const healthResponse = await fetch('/api/admin/profile')
      results.apiHealth = {
        status: healthResponse.status,
        accessible: healthResponse.status !== 401,
      }

      // Test 2: Check Reboot Content API
      const rebootResponse = await fetch(`${process.env.NEXT_PUBLIC_REBOOT_CONTENT_URL}/health`)
      results.rebootContent = {
        status: rebootResponse.status,
        accessible: rebootResponse.ok,
      }

      // Test 3: Check if pages can be fetched
      const pagesResponse = await fetch('/api/admin/pages')
      results.pagesApi = {
        status: pagesResponse.status,
        accessible: pagesResponse.status !== 401,
      }

    } catch (error: any) {
      results.error = error.message
    }

    setTestResults(results)
    setLoading(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Interface Test</h1>

      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Environment Check</h2>
          <div className="space-y-2">
            <p><strong>Frontend URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
            <p><strong>Reboot Content URL:</strong> {process.env.NEXT_PUBLIC_REBOOT_CONTENT_URL}</p>
            <p><strong>JWT Secret Configured:</strong> {process.env.JWT_SECRET ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">API Tests</h2>
            <button
              onClick={runTests}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Run Tests'}
            </button>
          </div>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Admin Profile API</h3>
                  <p className={`text-sm ${testResults.apiHealth?.accessible ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {testResults.apiHealth?.status} {testResults.apiHealth?.accessible ? '✅' : '❌'}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Reboot Content API</h3>
                  <p className={`text-sm ${testResults.rebootContent?.accessible ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {testResults.rebootContent?.status} {testResults.rebootContent?.accessible ? '✅' : '❌'}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Pages API</h3>
                  <p className={`text-sm ${testResults.pagesApi?.accessible ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {testResults.pagesApi?.status} {testResults.pagesApi?.accessible ? '✅' : '❌'}
                  </p>
                </div>
              </div>

              {testResults.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 mb-2">Error</h3>
                  <p className="text-red-700">{testResults.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/admin/pages"
              className="block w-full text-left px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
            >
              📄 Go to Pages Management
            </a>
            <a
              href="/admin/pages/new"
              className="block w-full text-left px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
            >
              ➕ Create New Page
            </a>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-yellow-900 mb-4">Next Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-yellow-800">
            <li>Ensure Reboot Content API is running on port 3001</li>
            <li>Check that JWT_SECRET is configured in your environment</li>
            <li>Try logging in with admin credentials</li>
            <li>Create or edit some pages to test the interface</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

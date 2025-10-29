'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const logout = async () => {
      try {
        await fetch('/api/admin/logout', { method: 'POST' })
      } catch (error) {
        console.error('Logout failed:', error)
      } finally {
        // Redirect to login page after logout
        router.push('/admin/login')
      }
    }

    logout()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Logging out...</h1>
        <p className="text-gray-600">Please wait while we sign you out.</p>
      </div>
    </div>
  )
}


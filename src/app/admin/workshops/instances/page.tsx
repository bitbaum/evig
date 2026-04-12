'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import {
  useWorkshopInstances,
  InstanceFilters,
  InstanceList,
  InstanceFormModal,
} from '@/components/admin/workshops/instances'
import Heading from '@/components/ui/Heading'

export default function AdminWorkshopInstancesPage() {
  const router = useRouter()
  const hook = useWorkshopInstances()

  if (hook.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!hook.session?.user) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Heading level={1} className="text-2xl font-bold text-gray-900">Workshop-Termine</Heading>
              <p className="mt-1 text-sm text-gray-600">
                Verwalte Termine für Workshops
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/workshops"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Workshop-Vorschläge
              </Link>
              <button
                onClick={() => hook.setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Neuer Termin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InstanceFilters
          filters={hook.filters}
          setFilters={hook.setFilters}
          workshops={hook.workshops}
        />

        {hook.error && !hook.showCreateModal && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{hook.error}</p>
          </div>
        )}

        <InstanceList
          instances={hook.instances}
          loading={hook.loading}
          onEdit={hook.openEditModal}
          onDelete={hook.handleDelete}
          onCreateNew={() => hook.setShowCreateModal(true)}
          getStatusBadge={hook.getStatusBadge}
        />
      </div>

      {hook.showCreateModal && (
        <InstanceFormModal
          editingInstance={hook.editingInstance}
          formData={hook.formData}
          setFormData={hook.setFormData}
          workshops={hook.workshops}
          submitting={hook.submitting}
          error={hook.error}
          onSubmit={hook.handleCreateOrUpdate}
          onClose={hook.closeModal}
        />
      )}
    </div>
  )
}

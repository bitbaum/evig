'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import {
  useWorkshopInstances,
  InstanceFilters,
  InstanceList,
  InstanceFormModal,
} from '@/components/admin/workshops/instances'
import Heading from '@/components/admin/AdminHeading'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ROUTES } from '@/config/routes'

export default function AdminWorkshopInstancesPage() {
  const router = useRouter()
  const hook = useWorkshopInstances()

  if (hook.loading) {
    return (
      <div className="min-h-screen bg-surface-raised flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-action" />
      </div>
    )
  }

  if (!hook.session?.user) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-surface-raised">
      <div className="bg-surface-base shadow-xs border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Heading level={1} className="text-2xl font-bold text-text-primary">Workshop-Termine</Heading>
              <p className="mt-1 text-sm text-text-secondary">
                Verwalte Termine für Workshops
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={ROUTES.admin.workshops}
                className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-lg text-text-secondary hover:bg-surface-raised transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Workshop-Vorschläge
              </Link>
              <Button onClick={() => hook.setShowCreateModal(true)} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Neuer Termin
              </Button>
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
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg p-4 mb-6">
            <p className="text-error-800 dark:text-error-400">{hook.error}</p>
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

      <ConfirmDialog
        isOpen={!!hook.pendingDeleteId}
        title="Termin löschen"
        message="Möchtest du diesen Termin wirklich löschen?"
        onConfirm={hook.doDelete}
        onClose={hook.cancelDelete}
      />
    </div>
  )
}

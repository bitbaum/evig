'use client'

import { Plus, Heart } from 'lucide-react'
import {
  useDonations,
  DonationStatsCards,
  DonationFilters,
  DonationsTable,
  DonationFormModal,
} from '@/components/admin/donations'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { adminBtn } from '@/lib/admin-ui'

export default function AdminDonationsPage() {
  const {
    donations,
    stats,
    loading,
    error,
    filters,
    setFilters,
    showForm,
    setShowForm,
    formType,
    setFormType,
    formData,
    setFormData,
    submitting,
    handleSubmit,
    userSearch,
    setUserSearch,
    userResults,
    searchingUsers,
    selectedUser,
    handleSelectUser,
    handleClearUser,
    handleMarkThanked,
    handleMarkReceiptSent,
  } = useDonations()

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-neutral-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-neutral-200 rounded"></div>
      </div>
    )
  }

  return (
    <AdminPageWrapper
      title="Spenden"
      description="Geld- und Sachspenden verwalten"
      icon={Heart}
      iconColor="green"
      actions={
        <button onClick={() => setShowForm(true)} className={adminBtn.primary}>
          <Plus className="w-4 h-4" />
          Spende erfassen
        </button>
      }
    >
      {stats && <DonationStatsCards stats={stats} />}

      <DonationFilters filters={filters} onFiltersChange={setFilters} />

      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <p className="text-error-700">{error}</p>
        </div>
      )}

      <DonationsTable
        donations={donations}
        onMarkThanked={handleMarkThanked}
        onMarkReceiptSent={handleMarkReceiptSent}
      />

      {showForm && (
        <DonationFormModal
          formType={formType}
          formData={formData}
          submitting={submitting}
          selectedUser={selectedUser}
          userSearch={userSearch}
          userResults={userResults}
          searchingUsers={searchingUsers}
          onFormTypeChange={setFormType}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          onSearchChange={setUserSearch}
          onSelectUser={handleSelectUser}
          onClearUser={handleClearUser}
        />
      )}
    </AdminPageWrapper>
  )
}

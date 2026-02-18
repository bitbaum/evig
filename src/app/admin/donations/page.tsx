'use client'

import { Plus } from 'lucide-react'
import {
  useDonations,
  DonationStatsCards,
  DonationFilters,
  DonationsTable,
  DonationFormModal,
} from '@/components/admin/donations'

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
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spenden</h1>
          <p className="text-gray-600">Geld- und Sachspenden verwalten</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          Spende erfassen
        </button>
      </div>

      {stats && <DonationStatsCards stats={stats} />}

      <DonationFilters filters={filters} onFiltersChange={setFilters} />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
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
    </div>
  )
}

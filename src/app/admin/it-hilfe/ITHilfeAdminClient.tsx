'use client'

import { HelpCircle, Users, Loader2, Clock, ShieldCheck } from 'lucide-react'
import { TABS } from './types'
import { StatsCard } from './shared'
import { useITHilfeAdmin } from './useITHilfeAdmin'
import { RequestsTab } from './RequestsTab'
import { HelpersTab } from './HelpersTab'
import { EditRequestModal } from './EditRequestModal'
import { HelperActionModal } from './HelperActionModal'

export default function ITHilfeAdminClient() {
  const {
    tab, switchTab,
    stats,
    requests, reqFilter, setReqFilter, reqOffset, setReqOffset,
    helpers, helpFilter, setHelpFilter, helpOffset, setHelpOffset,
    editId, editData, setEditData, editLoading, openEditModal, closeEditModal, handleEditSave,
    actionHelperId, helperAction, helperNotes, setHelperNotes, actionLoading,
    openHelperAction, closeHelperAction, handleHelperAction,
    loading,
  } = useITHilfeAdmin()

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="Offene Anfragen" value={stats.byStatus.open ?? 0} icon={HelpCircle} color="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" />
          <StatsCard label="Aktive Helfer" value={stats.activeHelpers} icon={Users} color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200" />
          <StatsCard label="Dringend" value={stats.byUrgency.urgent ?? 0} icon={Clock} color="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200" />
          <StatsCard label="Lösungsrate" value={`${stats.resolutionRate}%`} icon={ShieldCheck} color="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200" />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading && !requests && !helpers ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {tab === 'requests' && (
            <RequestsTab
              requests={requests}
              reqFilter={reqFilter}
              setReqFilter={setReqFilter}
              reqOffset={reqOffset}
              setReqOffset={setReqOffset}
              onEdit={openEditModal}
            />
          )}

          {tab === 'helpers' && (
            <HelpersTab
              helpers={helpers}
              helpFilter={helpFilter}
              setHelpFilter={setHelpFilter}
              helpOffset={helpOffset}
              setHelpOffset={setHelpOffset}
              stats={stats}
              onAction={openHelperAction}
            />
          )}
        </>
      )}

      {/* Edit Request Modal */}
      {editId && (
        <EditRequestModal
          editData={editData}
          setEditData={setEditData}
          editLoading={editLoading}
          onSave={handleEditSave}
          onClose={closeEditModal}
        />
      )}

      {/* Helper Action Modal */}
      {actionHelperId && (
        <HelperActionModal
          helperAction={helperAction}
          helperNotes={helperNotes}
          setHelperNotes={setHelperNotes}
          actionLoading={actionLoading}
          onConfirm={handleHelperAction}
          onClose={closeHelperAction}
        />
      )}
    </div>
  )
}

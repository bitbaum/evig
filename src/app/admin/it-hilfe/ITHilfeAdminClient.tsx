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
          <StatsCard label="Offene Anfragen" value={stats.byStatus.open ?? 0} icon={HelpCircle} color="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200" />
          <StatsCard label="Aktive Helfer" value={stats.activeHelpers} icon={Users} color="bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800 text-info-800 dark:text-info-200" />
          <StatsCard label="Dringend" value={stats.byUrgency.urgent ?? 0} icon={Clock} color="bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 text-error-800 dark:text-error-200" />
          <StatsCard label="Lösungsrate" value={`${stats.resolutionRate}%`} icon={ShieldCheck} color="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200" />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-info-600 text-info-700 dark:text-info-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
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
          <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
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

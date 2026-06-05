'use client'

import { HelpCircle, Users, Loader2, Clock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
          <StatsCard label="Offene Anfragen" value={stats.byStatus.open ?? 0} icon={HelpCircle} color="bg-action-muted border-strong text-action-text" />
          <StatsCard label="Aktive Helfer" value={stats.activeHelpers} icon={Users} color="bg-surface-raised border text-text-primary" />
          <StatsCard label="Dringend" value={stats.byUrgency.urgent ?? 0} icon={Clock} color="bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 text-error-800 dark:text-error-200" />
          <StatsCard label="Lösungsrate" value={`${stats.resolutionRate}%`} icon={ShieldCheck} color="bg-action-muted border-strong text-action-text" />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border">
        {TABS.map(t => (
          <Button
            key={t.id}
            variant="ghost"
            size="sm"
            onClick={() => switchTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-action text-action'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {loading && !requests && !helpers ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
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

'use client'

/**
 * Users Table Client Component
 *
 * Main table displaying all users with permissions management.
 * Uses extracted sub-components for modularity.
 */

import { isSuperAdmin } from '@/lib/permissions'
import { UserPermissionsEditor } from '../UserPermissionsEditor'
import { UserTableRow } from './UserTableRow'
import { EditProfileModal } from './EditProfileModal'
import { DeleteUserModal } from './DeleteUserModal'
import { EmptyState } from '@/components/common/EmptyState'
import { useUserManagement } from './useUserManagement'
import type { UsersTableClientProps } from './types'

export function UsersTableClient({ users, currentUserIsSuperAdmin }: UsersTableClientProps) {
  const {
    editingUser,
    editingProfile,
    deletingUser,
    isDeleting,
    isSaving,
    error,
    editName,
    editEmail,
    setEditName,
    setEditEmail,
    handleEditPermissions,
    handleEditProfile,
    handleDeleteClick,
    handleCloseModal,
    handleSaveProfile,
    handleDeleteUser,
  } = useUserManagement()

  const handleSaved = () => {
    window.location.reload()
  }

  return (
    <>
      <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-raised dark:bg-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary dark:text-neutral-300 uppercase tracking-wider">
                  Benutzer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary dark:text-neutral-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary dark:text-neutral-300 uppercase tracking-wider">
                  Berechtigungen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary dark:text-neutral-300 uppercase tracking-wider">
                  Registriert
                </th>
                {currentUserIsSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary dark:text-neutral-300 uppercase tracking-wider">
                    Aktionen
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-surface-base divide-y divide-neutral-200 dark:divide-white/4">
              {users.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  currentUserIsSuperAdmin={currentUserIsSuperAdmin}
                  onEditProfile={handleEditProfile}
                  onEditPermissions={handleEditPermissions}
                  onDelete={handleDeleteClick}
                />
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && <EmptyState title="Noch keine Benutzer" message="Es wurden noch keine Benutzer registriert." />}
      </div>

      {/* Permission Editor Modal */}
      {editingUser && (
        <UserPermissionsEditor
          userId={editingUser.id}
          userName={editingUser.name || ''}
          userEmail={editingUser.email}
          currentPermissions={editingUser.staff_permissions || []}
          isSuperAdmin={isSuperAdmin(editingUser.email)}
          isInHardcodedList={isSuperAdmin(editingUser.email)}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}

      {/* Edit Profile Modal */}
      {editingProfile && (
        <EditProfileModal
          user={editingProfile}
          editName={editName}
          editEmail={editEmail}
          isSaving={isSaving}
          error={error}
          onNameChange={setEditName}
          onEmailChange={setEditEmail}
          onSave={handleSaveProfile}
          onClose={handleCloseModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          isDeleting={isDeleting}
          error={error}
          onConfirm={handleDeleteUser}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}

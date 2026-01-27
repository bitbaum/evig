'use client'

import { useState } from 'react'
import { Eye, Edit, Crown, Shield, UserCheck, Mail, Trash2, Pencil, X, Loader2 } from 'lucide-react'
import { UserPermissionsEditor } from './UserPermissionsEditor'
import { isSuperAdmin, isStaffEmail } from '@/lib/permissions'

interface UserRow {
  id: string
  name: string | null
  email: string
  is_staff: boolean
  staff_permissions: string[] | null
  created_at: string
  email_verified: string | null
}

interface UsersTableClientProps {
  users: UserRow[]
  currentUserIsSuperAdmin: boolean
}

export function UsersTableClient({ users, currentUserIsSuperAdmin }: UsersTableClientProps) {
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [editingProfile, setEditingProfile] = useState<UserRow | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit profile form state
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const handleEditPermissions = (user: UserRow) => {
    setEditingUser(user)
  }

  const handleEditProfile = (user: UserRow) => {
    setEditingProfile(user)
    setEditName(user.name || '')
    setEditEmail(user.email)
    setError(null)
  }

  const handleCloseModal = () => {
    setEditingUser(null)
    setEditingProfile(null)
    setDeletingUser(null)
    setError(null)
  }

  const handleSaved = () => {
    window.location.reload()
  }

  const handleSaveProfile = async () => {
    if (!editingProfile) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${editingProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName || null,
          email: editEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update user')
        return
      }

      window.location.reload()
    } catch {
      setError('Failed to update user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to delete user')
        return
      }

      window.location.reload()
    } catch {
      setError('Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Benutzer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Berechtigungen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Registriert
                </th>
                {currentUserIsSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Aktionen
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => {
                const userIsSuperAdmin = isSuperAdmin(user.email)
                const userIsStaff = user.is_staff || isStaffEmail(user.email)
                const permissions = user.staff_permissions || []
                const hasFullAccess = permissions.includes('*')

                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            userIsSuperAdmin
                              ? 'bg-gradient-to-r from-purple-500 to-pink-600'
                              : userIsStaff
                                ? 'bg-gradient-to-r from-blue-500 to-green-600'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500'
                          }`}>
                            <span className="text-white font-medium text-sm">
                              {user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : user.email[0].toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name || 'Kein Name'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {userIsSuperAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            <Crown className="w-3 h-3" />
                            Super Admin
                          </span>
                        )}
                        {userIsStaff && !userIsSuperAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            <Shield className="w-3 h-3" />
                            Staff
                          </span>
                        )}
                        {!userIsStaff && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                            Benutzer
                          </span>
                        )}
                        {user.email_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <UserCheck className="w-3 h-3" />
                            Verifiziert
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {userIsStaff ? (
                        hasFullAccess ? (
                          <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                            Voller Zugriff
                          </span>
                        ) : permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {permissions.slice(0, 3).map(p => (
                              <span key={p} className="inline-flex px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                                {p}
                              </span>
                            ))}
                            {permissions.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{permissions.length - 3} mehr
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Keine Berechtigungen</span>
                        )
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(user.created_at).toLocaleDateString('de-CH')}
                      </div>
                    </td>
                    {currentUserIsSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProfile(user)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Profil bearbeiten"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {userIsStaff && (
                            <button
                              onClick={() => handleEditPermissions(user)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Berechtigungen bearbeiten"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {!userIsSuperAdmin && (
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Benutzer löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Noch keine Benutzer
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Es wurden noch keine Benutzer registriert.
            </p>
          </div>
        )}
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Benutzer bearbeiten
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Name eingeben"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="E-Mail eingeben"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  Benutzer löschen
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?
                </p>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {deletingUser.name || 'Kein Name'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {deletingUser.email}
                  </p>
                </div>
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten des Benutzers werden permanent gelöscht.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Endgültig löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

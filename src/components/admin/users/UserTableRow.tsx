'use client'

/**
 * Individual user row in the users table
 */

import { Edit, Crown, Shield, UserCheck, Mail, Trash2, Pencil } from 'lucide-react'
import { isSuperAdmin, isStaffEmail } from '@/lib/permissions'
import { formatDateShort } from '@/lib/date-formats'
import type { UserRow } from './types'

interface UserTableRowProps {
  user: UserRow
  currentUserIsSuperAdmin: boolean
  onEditProfile: (user: UserRow) => void
  onEditPermissions: (user: UserRow) => void
  onDelete: (user: UserRow) => void
}

export function UserTableRow({
  user,
  currentUserIsSuperAdmin,
  onEditProfile,
  onEditPermissions,
  onDelete,
}: UserTableRowProps) {
  const userIsSuperAdmin = isSuperAdmin(user.email)
  const userIsStaff = user.is_staff || isStaffEmail(user.email)
  const permissions = user.staff_permissions || []
  const hasFullAccess = permissions.includes('*')

  return (
    <tr className="hover:bg-surface-raised dark:hover:bg-surface-base/6">
      <UserInfoCell user={user} userIsSuperAdmin={userIsSuperAdmin} userIsStaff={userIsStaff} />
      <StatusCell
        userIsSuperAdmin={userIsSuperAdmin}
        userIsStaff={userIsStaff}
        emailVerified={user.email_verified}
      />
      <PermissionsCell
        userIsStaff={userIsStaff}
        hasFullAccess={hasFullAccess}
        permissions={permissions}
      />
      <DateCell date={user.created_at} />
      {currentUserIsSuperAdmin && (
        <ActionsCell
          user={user}
          userIsStaff={userIsStaff}
          userIsSuperAdmin={userIsSuperAdmin}
          onEditProfile={onEditProfile}
          onEditPermissions={onEditPermissions}
          onDelete={onDelete}
        />
      )}
    </tr>
  )
}

function UserInfoCell({
  user,
  userIsSuperAdmin,
  userIsStaff,
}: {
  user: UserRow
  userIsSuperAdmin: boolean
  userIsStaff: boolean
}) {
  const avatarClass = userIsSuperAdmin
    ? 'bg-action'
    : userIsStaff
      ? 'bg-action'
      : 'bg-neutral-500'

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2)
    : user.email[0].toUpperCase()

  return (
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${avatarClass}`}>
            <span className="text-white font-medium text-sm">{initials}</span>
          </div>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-text-primary">
            {user.name || 'Kein Name'}
          </div>
          <div className="text-sm text-text-tertiary flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {user.email}
          </div>
        </div>
      </div>
    </td>
  )
}

function StatusCell({
  userIsSuperAdmin,
  userIsStaff,
  emailVerified,
}: {
  userIsSuperAdmin: boolean
  userIsStaff: boolean
  emailVerified: string | null
}) {
  return (
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex flex-col gap-1">
        {userIsSuperAdmin && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-action-muted text-action-muted">
            <Crown className="w-3 h-3" />
            Super Admin
          </span>
        )}
        {userIsStaff && !userIsSuperAdmin && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-action-muted text-action-muted">
            <Shield className="w-3 h-3" />
            Staff
          </span>
        )}
        {!userIsStaff && (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-surface-raised text-text-primary">
            Benutzer
          </span>
        )}
        {emailVerified && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-action-muted text-action-muted">
            <UserCheck className="w-3 h-3" />
            Verifiziert
          </span>
        )}
      </div>
    </td>
  )
}

function PermissionsCell({
  userIsStaff,
  hasFullAccess,
  permissions,
}: {
  userIsStaff: boolean
  hasFullAccess: boolean
  permissions: string[]
}) {
  if (!userIsStaff) {
    return (
      <td className="px-6 py-4">
        <span className="text-sm text-text-tertiary">-</span>
      </td>
    )
  }

  if (hasFullAccess) {
    return (
      <td className="px-6 py-4">
        <span className="text-sm text-action font-medium">
          Voller Zugriff
        </span>
      </td>
    )
  }

  if (permissions.length === 0) {
    return (
      <td className="px-6 py-4">
        <span className="text-sm text-text-tertiary">Keine Berechtigungen</span>
      </td>
    )
  }

  return (
    <td className="px-6 py-4">
      <div className="flex flex-wrap gap-1 max-w-xs">
        {permissions.slice(0, 3).map(p => (
          <span key={p} className="inline-flex px-2 py-0.5 text-xs bg-surface-raised rounded-sm">
            {p}
          </span>
        ))}
        {permissions.length > 3 && (
          <span className="text-xs text-text-tertiary">
            +{permissions.length - 3} mehr
          </span>
        )}
      </div>
    </td>
  )
}

function DateCell({ date }: { date: string }) {
  return (
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm text-text-primary">
        {formatDateShort(date)}
      </div>
    </td>
  )
}

function ActionsCell({
  user,
  userIsStaff,
  userIsSuperAdmin,
  onEditProfile,
  onEditPermissions,
  onDelete,
}: {
  user: UserRow
  userIsStaff: boolean
  userIsSuperAdmin: boolean
  onEditProfile: (user: UserRow) => void
  onEditPermissions: (user: UserRow) => void
  onDelete: (user: UserRow) => void
}) {
  return (
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEditProfile(user)}
          className="text-action hover:text-action"
          title="Profil bearbeiten"
        >
          <Pencil className="w-4 h-4" />
        </button>
        {userIsStaff && (
          <button
            onClick={() => onEditPermissions(user)}
            className="text-action hover:text-action"
            title="Berechtigungen bearbeiten"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
        {!userIsSuperAdmin && (
          <button
            onClick={() => onDelete(user)}
            className="text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300"
            title="Benutzer löschen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </td>
  )
}

/**
 * User Detail Page
 *
 * Shows detailed user information with link to team profile if exists.
 */

import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { canAccessSection, isSuperAdmin, isStaffEmail } from '@/lib/permissions'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { formatDateShort } from '@/lib/date-formats'
import {
  ArrowLeft,
  Mail,
  Calendar,
  Phone,
  MapPin,
  Crown,
  Shield,
  UserCheck,
  User,
  ExternalLink,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const user = await getUser(id)

  return {
    title: user
      ? `${user.name || user.email} | Benutzer`
      : 'Benutzer',
    description: 'Benutzerdetails',
  }
}

interface UserData {
  id: string
  name: string | null
  email: string
  is_staff: boolean
  is_super_admin: boolean
  staff_permissions: string[] | null
  created_at: string
  email_verified: string | null
  phone: string | null
  address: string | null
  team_profile_id: string | null
}

async function getUser(id: string): Promise<UserData | null> {
  try {
    const result = await query<UserData>(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.is_staff,
        u.is_super_admin,
        u.staff_permissions,
        u."createdAt" as created_at,
        u."emailVerified" as email_verified,
        u.phone,
        u.address,
        tp.id as team_profile_id
       FROM ${TABLE_NAMES.USERS} u
       LEFT JOIN ${TABLE_NAMES.TEAM_PROFILES} tp ON u.id = tp.user_id
       WHERE u.id = $1`,
      [id]
    )

    return result.rows[0] || null
  } catch (error) {
    logger.error('Failed to fetch user details', { error, userId: id })
    return null
  }
}

export default async function UserDetailPage({ params }: PageProps) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/users')
  }

  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'users')

  if (!hasAccess) {
    redirect('/admin?error=no_users_access')
  }

  const user = await getUser(id)

  if (!user) {
    notFound()
  }

  const userIsSuperAdmin = isSuperAdmin(user.email, user.is_super_admin)
  const userIsStaff = user.is_staff || isStaffEmail(user.email)
  const permissions = user.staff_permissions || []
  const hasFullAccess = permissions.includes('*')

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück zur Übersicht
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 ${
            userIsSuperAdmin
              ? 'bg-gradient-to-r from-primary-500 to-error-600'
              : userIsStaff
                ? 'bg-gradient-to-r from-primary-500 to-primary-700'
                : 'bg-gradient-to-r from-neutral-400 to-neutral-500'
          }`}>
            <span className="text-white font-bold text-2xl">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">
                {user.name || 'Kein Name'}
              </Heading>
              {userIsSuperAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                  <Crown className="w-3 h-3" />
                  Super Admin
                </span>
              )}
              {userIsStaff && !userIsSuperAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                  <Shield className="w-3 h-3" />
                  Staff
                </span>
              )}
              {user.email_verified && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                  <UserCheck className="w-3 h-3" />
                  Verifiziert
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>

              {user.phone && (
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <Calendar className="w-4 h-4" />
                <span>Registriert: {formatDateShort(user.created_at)}</span>
              </div>

              {user.address && (
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <MapPin className="w-4 h-4" />
                  <span>{user.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Team Profile Link */}
      {userIsStaff && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-6">
          <Heading level={2} className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Team-Profil
          </Heading>

          {user.team_profile_id ? (
            <div className="flex items-center justify-between">
              <p className="text-neutral-600 dark:text-neutral-400">
                Dieses Mitglied hat ein Team-Profil.
              </p>
              <Link
                href={`/admin/team/${user.team_profile_id}`}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Profil ansehen
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-neutral-600 dark:text-neutral-400">
                Noch kein Team-Profil vorhanden.
              </p>
              <Link
                href={`/admin/team/new?user_id=${user.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                Profil erstellen
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Permissions */}
      {userIsStaff && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-6">
          <Heading level={2} className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Berechtigungen
          </Heading>

          {userIsSuperAdmin ? (
            <p className="text-primary-600 dark:text-primary-400 font-medium">
              Super Admin - Voller Zugriff auf alle Bereiche
            </p>
          ) : hasFullAccess ? (
            <p className="text-primary-600 dark:text-primary-400 font-medium">
              Voller Zugriff auf alle Bereiche
            </p>
          ) : permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {permissions.map(p => (
                <span
                  key={p}
                  className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-full"
                >
                  {p}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 dark:text-neutral-400">
              Keine speziellen Berechtigungen zugewiesen
            </p>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="text-xs text-neutral-500 flex gap-4">
        <span>Benutzer-ID: {user.id}</span>
        {user.email_verified && (
          <span>E-Mail verifiziert: {formatDateShort(user.email_verified)}</span>
        )}
      </div>
    </div>
  )
}

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
import { buttonClass } from '@/components/ui/button-class'
import { Avatar } from '@/components/ui/Avatar'
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
import { ROUTES } from '@/config/routes'

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
        up.phone,
        up.address_line1 as address,
        tp.id as team_profile_id
       FROM ${TABLE_NAMES.USERS} u
       LEFT JOIN ${TABLE_NAMES.USER_PROFILES} up ON u.id = up.user_id
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={ROUTES.admin.users}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück zur Übersicht
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-surface-base rounded-xl border border p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <Avatar
            name={user.name || user.email}
            size="xl"
            colorClassName={userIsSuperAdmin || userIsStaff ? 'bg-action text-white' : 'bg-surface-overlay text-text-primary'}
          />

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Heading level={1} className="text-2xl font-bold text-text-primary">
                {user.name || 'Kein Name'}
              </Heading>
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
              {user.email_verified && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-action-muted text-action-muted">
                  <UserCheck className="w-3 h-3" />
                  Verifiziert
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>

              {user.phone && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-text-secondary">
                <Calendar className="w-4 h-4" />
                <span>Registriert: {formatDateShort(user.created_at)}</span>
              </div>

              {user.address && (
                <div className="flex items-center gap-2 text-text-secondary">
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
        <div className="bg-surface-base rounded-xl border border p-6">
          <Heading level={2} className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Team-Profil
          </Heading>

          {user.team_profile_id ? (
            <div className="flex items-center justify-between">
              <p className="text-text-secondary">
                Dieses Mitglied hat ein Team-Profil.
              </p>
              <Link href={`/admin/team/${user.team_profile_id}`} className={buttonClass({ variant: 'primary', size: 'sm' })}>
                <ExternalLink className="w-4 h-4" />
                Profil ansehen
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-text-secondary">
                Noch kein Team-Profil vorhanden.
              </p>
              <Link href={`/admin/team/new?user_id=${user.id}`} className={buttonClass({ variant: 'primary', size: 'sm' })}>
                <User className="w-4 h-4" />
                Profil erstellen
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Permissions */}
      {userIsStaff && (
        <div className="bg-surface-base rounded-xl border border p-6">
          <Heading level={2} className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Berechtigungen
          </Heading>

          {userIsSuperAdmin ? (
            <p className="text-action font-medium">
              Super Admin - Voller Zugriff auf alle Bereiche
            </p>
          ) : hasFullAccess ? (
            <p className="text-action font-medium">
              Voller Zugriff auf alle Bereiche
            </p>
          ) : permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {permissions.map(p => (
                <span
                  key={p}
                  className="px-3 py-1 bg-surface-raised text-text-secondary text-sm rounded-full"
                >
                  {p}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-text-tertiary">
              Keine speziellen Berechtigungen zugewiesen
            </p>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="text-xs text-text-tertiary flex gap-4">
        <span>Benutzer-ID: {user.id}</span>
        {user.email_verified && (
          <span>E-Mail verifiziert: {formatDateShort(user.email_verified)}</span>
        )}
      </div>
    </div>
  )
}

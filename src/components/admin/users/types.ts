/**
 * Types for Users Table
 */

export interface UserRow {
  id: string
  name: string | null
  email: string
  is_staff: boolean
  staff_permissions: string[] | null
  created_at: string
  email_verified: string | null
}

export interface UsersTableClientProps {
  users: UserRow[]
  currentUserIsSuperAdmin: boolean
}

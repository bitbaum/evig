/**
 * Database client for RevampIT unified auth
 *
 * Barrel re-export from focused modules.
 * All existing imports from '@/lib/auth/db' continue to work unchanged.
 *
 * SSOT Compliance: All table names must use TABLE_NAMES from config
 */

// Connection layer
export { getPool, query, getClient, getUserColumns, transaction } from './db-connection'

// User & profile queries
export type { DbUser, DbUserProfile, DbDonation } from './db-users'
export {
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getOrCreateProfile,
  updateProfile,
} from './db-users'

// Workshop queries
export type { DbWorkshop, DbWorkshopRegistration } from './db-workshops'
export {
  getWorkshopBySlug,
  getWorkshopsForUser,
  getUserWorkshopRegistrations,
  isUserRegisteredForWorkshop,
} from './db-workshops'

// Service queries
export type { DbServiceAppointment, DbServiceType } from './db-services'
export {
  getServiceTypeBySlug,
  getUserServiceAppointments,
  hasPendingAppointmentForService,
} from './db-services'

// Verification & password reset
export type { DbVerificationToken, DbPasswordResetToken } from './db-verification'
export {
  createVerificationToken,
  verifyEmailWithToken,
  getVerificationToken,
  createVerificationCode,
  verifyEmailCode,
  createPasswordResetToken,
  verifyPasswordResetToken,
  updateUserPassword,
  getPasswordResetToken,
} from './db-verification'

// Roles, permissions, preferences, segments
export type {
  DbUserRole,
  DbPermission,
  DbRolePermission,
  DbCustomerPreference,
  DbCustomerSegment,
  DbUserSegment,
} from './db-roles'
export {
  getUserRoleById,
  getUserRoleBySlug,
  getActiveUserRoles,
  getRolePermissions,
  userHasPermission,
  getUserPreferences,
  setUserPreference,
  getUserSegments,
  addUserToSegment,
  updateUserLastActivity,
  getUserWithProfile,
} from './db-roles'

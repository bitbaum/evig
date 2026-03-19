/**
 * Workshop Types - Single Source of Truth
 *
 * All workshop-related types should be imported from this file.
 * Do NOT define local Workshop/WorkshopInstance interfaces elsewhere.
 *
 * Based on database schema: scripts/db/migrations/001-unified-auth.sql
 * and scripts/db/migrations/016_workshop_proposals.sql
 */

// =============================================================================
// WORKSHOP STATUS ENUMS
// =============================================================================

export type WorkshopInstanceStatus = 'scheduled' | 'cancelled' | 'completed'

export type RegistrationStatus =
  | 'pending'
  | 'confirmed'
  | 'waitlist'
  | 'attended'
  | 'cancelled'
  | 'no_show'

export type PaymentStatus = 'not_required' | 'pending' | 'paid' | 'refunded'

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'requires_changes'

export type LocationType = 'venue' | 'online' | 'home' | 'community_center' | 'business'

export type WorkshopLevel = 'beginner' | 'intermediate' | 'advanced' | 'all'

// =============================================================================
// UI STATE TYPES
// =============================================================================

export type RegistrationUIStatus =
  | 'checking'
  | 'not-registered'
  | 'registered'
  | 'registering'
  | 'payment'
  | 'processing'
  | 'success'
  | 'error'

// =============================================================================
// CORE WORKSHOP TYPES (from DB schema)
// =============================================================================

/**
 * Workshop - Core workshop definition
 * Table: workshops
 */
export interface Workshop {
  id: string
  slug: string
  title: string
  description: string | null
  category: string | null
  duration: string | null  // e.g., '2 Tage', '4 Sitzungen'
  level: string | null     // 'Anfänger', 'Fortgeschrittene', 'Alle Stufen'
  max_participants: number
  price_cents: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Optional fields not in DB but used in some views
  outcomes?: string[]  // Learning outcomes (not in DB, for future use)
}

/**
 * WorkshopInstance - Specific workshop session/date
 * Table: workshop_instances
 */
export interface WorkshopInstance {
  id: string
  workshop_id: string
  start_date: string
  end_date: string | null
  location: string | null
  instructor: string | null
  max_participants: number | null  // Override workshop default
  notes: string | null
  status: WorkshopInstanceStatus
  created_at: string
  updated_at: string
}

/**
 * WorkshopInstance with computed participant count
 * Used in list views
 */
export interface WorkshopInstanceWithCount extends WorkshopInstance {
  current_participants: number
}

/**
 * WorkshopInstance with full details (joined with workshop)
 * Used in admin views and detailed displays
 */
export interface WorkshopInstanceWithDetails extends WorkshopInstanceWithCount {
  workshop_title: string
  workshop_slug: string
  confirmed_count: number
  pending_count: number
}

// =============================================================================
// WORKSHOP REGISTRATION TYPES
// =============================================================================

/**
 * WorkshopRegistration - User registration for a workshop instance
 * Table: workshop_registrations
 */
export interface WorkshopRegistration {
  id: string
  user_id: string
  workshop_instance_id: string
  status: RegistrationStatus
  payment_status: PaymentStatus
  payment_amount_cents: number | null
  payment_reference: string | null
  attended: boolean
  rating: number | null
  feedback: string | null
  notes: string | null
  confirmed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Registration with workshop instance details
 * Used in user dashboard
 */
export interface WorkshopRegistrationWithDetails extends WorkshopRegistration {
  workshop_title: string
  workshop_slug: string
  instance_start_date: string
  instance_location: string | null
}

// =============================================================================
// WORKSHOP PROPOSAL TYPES
// =============================================================================

/**
 * WorkshopProposal - User-submitted workshop idea
 * Table: workshop_proposals
 */
export interface WorkshopProposal {
  id: string
  user_id: string
  title: string
  description: string
  short_description: string | null
  category: string | null
  duration_minutes: number
  level: WorkshopLevel
  max_participants: number
  min_participants: number
  price_cents: number
  prerequisites: string | null
  learning_objectives: string[]
  target_audience: string | null
  materials_provided: string | null
  materials_required: string | null
  location_type: 'venue' | 'online' | 'home'
  selected_location_id: string | null
  proposed_location: string | null
  proposed_date: string | null
  proposed_time: string | null
  special_requirements: string | null
  terms_accepted: boolean
  status: ProposalStatus
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  // Admin edit tracking (migration 034)
  edit_history: EditHistoryEntry[] | null
  last_edited_by: string | null
  last_edited_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Edit history entry for admin edits
 */
export interface EditHistoryEntry {
  timestamp: string
  editor_id: string
  editor_name: string
  fields_changed: string[]
  snapshot: Record<string, any>
}

/**
 * Proposal with proposer info (joined with users)
 * Used in admin list view
 */
export interface WorkshopProposalWithProposer extends WorkshopProposal {
  proposer_name: string
  proposer_email: string
  selected_location_name?: string
  // Joined from users table for reviewer and editor
  reviewer_name?: string | null
  editor_name?: string | null
}

// =============================================================================
// LOCATION TYPES
// =============================================================================

/**
 * Location - Venue for workshops
 * Table: locations
 */
export interface Location {
  id: string
  name: string
  type: LocationType
  description: string | null
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  city: string
  canton: string | null
  country: string
  latitude: number | null
  longitude: number | null
  max_capacity: number | null
  facilities: string[]
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  is_active: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
}

// =============================================================================
// PAYMENT TYPES
// =============================================================================

/**
 * Payment data for Payrexx redirect integration
 */
export interface PaymentData {
  registrationId: string
  paymentUrl: string
  amount: string
  invoiceNumber: string
}

// =============================================================================
// COMPONENT PROPS TYPES
// =============================================================================

/**
 * Workshop instance details for display components
 */
export interface WorkshopInstanceDetails {
  start_date: string
  location: string | null
  workshop_title: string
  workshop_slug: string
}

/**
 * Registration data returned after successful registration
 */
export interface RegistrationData {
  id: string
  status: string
  registered_at: string
  workshop_instance?: WorkshopInstanceDetails
}

// =============================================================================
// LIST VIEW TYPES (for pages)
// =============================================================================

/**
 * Workshop with instances for list pages
 */
export interface WorkshopWithInstances extends Workshop {
  instances: WorkshopInstanceWithCount[]
  user_registered?: boolean
}

/**
 * Minimal workshop type for dropdowns/selects
 */
export interface WorkshopOption {
  id: string
  title: string
  slug: string
}

/**
 * Minimal location type for dropdowns/selects
 */
export interface LocationOption {
  id: string
  name: string
  address?: string
  city?: string
  canton?: string
  max_capacity?: number
}

/**
 * Repository Layer - Index
 *
 * Central export point for all repositories.
 * Import from here for consistent access to data layer.
 *
 * @example
 * ```typescript
 * import { RepairerRepository, TechnicianRepository } from '@/lib/repositories'
 *
 * const repairerRepo = new RepairerRepository()
 * const repairers = await repairerRepo.findActiveWithDetails(50)
 * ```
 */

export { BaseRepository } from './base-repository'
export { RepairerRepository } from './repairer-repository'
export { TechnicianRepository } from './technician-repository'

/** @deprecated Use TechnicianRepository instead */
export { TechnicianRepository as HelperRepository } from './technician-repository'

export type {
  RepairerWithDetails,
} from './repairer-repository'

export type {
  TechnicianWithDetails,
} from './technician-repository'

/** @deprecated Use TechnicianWithDetails instead */
export type {
  TechnicianWithDetails as HelperWithDetails,
} from './technician-repository'

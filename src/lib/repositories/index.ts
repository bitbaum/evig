/**
 * Repository Layer - Index
 *
 * Central export point for all repositories.
 * Import from here for consistent access to data layer.
 *
 * @example
 * ```typescript
 * import { RepairerRepository, HelperRepository } from '@/lib/repositories'
 *
 * const repairerRepo = new RepairerRepository()
 * const repairers = await repairerRepo.findActiveWithDetails(50)
 * ```
 */

export { BaseRepository } from './base-repository'
export { RepairerRepository } from './repairer-repository'
export { HelperRepository } from './helper-repository'

export type {
  RepairerWithDetails,
} from './repairer-repository'

export type {
  HelperWithDetails,
} from './helper-repository'

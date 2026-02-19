/**
 * Repository Layer - Index
 *
 * Central export point for all repositories.
 * Import from here for consistent access to data layer.
 *
 * @example
 * ```typescript
 * import { RepairerRepository } from '@/lib/repositories'
 *
 * const repairerRepo = new RepairerRepository()
 * const repairers = await repairerRepo.findActiveWithDetails(50)
 * ```
 */

export { BaseRepository } from './base-repository'
export { RepairerRepository } from './repairer-repository'

export type {
  RepairerWithDetails,
} from './repairer-repository'

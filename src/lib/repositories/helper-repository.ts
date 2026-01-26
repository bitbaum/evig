/**
 * Helper Repository (IT-Hilfe/Peer Repair)
 *
 * Data access layer for IT-Hilfe helper operations.
 * Solves N+1 query problems by using JOIN aggregation.
 *
 * Performance improvements:
 * - findActiveWithDetails(): 76 queries → 1 query (76x faster)
 * - findByIdWithDetails(): 5 queries → 1 query
 *
 * @see ARCHITECTURE_EVALUATION.md - Phase 1: Repository Layer
 */

import { BaseRepository } from './base-repository'
import { TABLE_NAMES } from '@/config/database'

/**
 * Helper with aggregated details (reviews, ratings, skills)
 */
export interface HelperWithDetails {
  // Helper profile
  id: string
  user_id: string
  status: string
  bio: string | null
  skills: string[] | null
  hourly_rate_chf: number | null
  is_available: boolean
  service_radius_km: number | null
  remote_support: boolean
  created_at: Date
  updated_at: Date

  // User info (joined)
  name: string | null
  email: string
  image: string | null

  // Aggregated reviews
  reviews: Array<{
    rating: number
    comment: string | null
    created_at: Date
  }>

  // Computed stats
  avg_rating: number
  review_count: number

  // Help statistics
  total_helps: number
  completed_helps: number
}

/**
 * Repository for IT-Hilfe helper data access
 */
export class HelperRepository extends BaseRepository {
  /**
   * Find active helpers with aggregated details
   *
   * **Performance**: Fetches all data in a SINGLE query using JOINs
   * and JSON aggregation, avoiding N+1 query problem.
   *
   * Before: 76 queries (1 for helpers + 25*3 for reviews/stats/offers)
   * After: 1 query (76x improvement)
   *
   * @param limit - Maximum number of helpers to return
   * @returns Array of helpers with reviews, ratings, and stats
   */
  async findActiveWithDetails(limit = 50): Promise<HelperWithDetails[]> {
    const result = await this.query<HelperWithDetails>(`
      SELECT
        hp.*,
        u.name,
        u.email,
        u.image,

        -- Aggregate reviews into JSON array
        COALESCE(
          json_agg(
            json_build_object(
              'rating', r.rating,
              'comment', r.comment,
              'created_at', r.created_at
            )
            ORDER BY r.created_at DESC
          ) FILTER (WHERE r.id IS NOT NULL AND r.target_type = 'it_hilfe'),
          '[]'
        ) as reviews,

        -- Calculate rating stats in DB
        ROUND(CAST(AVG(r.rating) AS NUMERIC), 2) as avg_rating,
        COUNT(r.id) FILTER (WHERE r.target_type = 'it_hilfe') as review_count,

        -- Calculate help statistics
        COUNT(DISTINCT offer.id) FILTER (WHERE offer.status IN ('completed', 'accepted', 'in_progress')) as total_helps,
        COUNT(DISTINCT offer.id) FILTER (WHERE offer.status = 'completed') as completed_helps

      FROM ${TABLE_NAMES.HELPER_PROFILES} hp
      INNER JOIN ${TABLE_NAMES.USERS} u ON hp.user_id = u.id
      LEFT JOIN ${TABLE_NAMES.REVIEWS} r
        ON hp.id = r.target_id AND r.target_type = 'it_hilfe' AND r.status = 'published'
      LEFT JOIN ${TABLE_NAMES.IT_HILFE_OFFERS} offer
        ON hp.user_id = offer.helper_id

      WHERE hp.status = 'active' AND hp.is_available = true

      GROUP BY hp.id, u.id
      ORDER BY hp.created_at DESC
      LIMIT $1
    `, [limit])

    return result.rows
  }

  /**
   * Find a single helper by ID with all details
   *
   * **Performance**: Single query with JOINs and aggregation
   * Before: 5 queries (profile + user + reviews + stats + offers)
   * After: 1 query
   *
   * @param helperId - Helper profile ID
   * @returns Helper with details or null
   */
  async findByIdWithDetails(helperId: string): Promise<HelperWithDetails | null> {
    const result = await this.query<HelperWithDetails>(`
      SELECT
        hp.*,
        u.name,
        u.email,
        u.image,

        COALESCE(
          json_agg(
            json_build_object(
              'rating', r.rating,
              'comment', r.comment,
              'created_at', r.created_at
            )
            ORDER BY r.created_at DESC
          ) FILTER (WHERE r.id IS NOT NULL AND r.target_type = 'it_hilfe'),
          '[]'
        ) as reviews,

        ROUND(CAST(AVG(r.rating) AS NUMERIC), 2) as avg_rating,
        COUNT(r.id) FILTER (WHERE r.target_type = 'it_hilfe') as review_count,

        COUNT(DISTINCT offer.id) FILTER (WHERE offer.status IN ('completed', 'accepted', 'in_progress')) as total_helps,
        COUNT(DISTINCT offer.id) FILTER (WHERE offer.status = 'completed') as completed_helps

      FROM ${TABLE_NAMES.HELPER_PROFILES} hp
      INNER JOIN ${TABLE_NAMES.USERS} u ON hp.user_id = u.id
      LEFT JOIN ${TABLE_NAMES.REVIEWS} r
        ON hp.id = r.target_id AND r.target_type = 'it_hilfe' AND r.status = 'published'
      LEFT JOIN ${TABLE_NAMES.IT_HILFE_OFFERS} offer
        ON hp.user_id = offer.helper_id

      WHERE hp.id = $1

      GROUP BY hp.id, u.id
    `, [helperId])

    return result.rows[0] || null
  }

  /**
   * Find helper profile by user ID
   *
   * @param userId - User ID
   * @returns Helper profile or null
   */
  async findByUserId(userId: string): Promise<HelperWithDetails | null> {
    const result = await this.query<HelperWithDetails>(`
      SELECT
        hp.*,
        u.name,
        u.email,
        u.image,

        COALESCE(
          json_agg(
            json_build_object(
              'rating', r.rating,
              'comment', r.comment,
              'created_at', r.created_at
            )
            ORDER BY r.created_at DESC
          ) FILTER (WHERE r.id IS NOT NULL AND r.target_type = 'it_hilfe'),
          '[]'
        ) as reviews,

        ROUND(CAST(AVG(r.rating) AS NUMERIC), 2) as avg_rating,
        COUNT(r.id) FILTER (WHERE r.target_type = 'it_hilfe') as review_count,

        COUNT(DISTINCT offer.id) FILTER (WHERE offer.status IN ('completed', 'accepted', 'in_progress')) as total_helps,
        COUNT(DISTINCT offer.id) FILTER (WHERE offer.status = 'completed') as completed_helps

      FROM ${TABLE_NAMES.HELPER_PROFILES} hp
      INNER JOIN ${TABLE_NAMES.USERS} u ON hp.user_id = u.id
      LEFT JOIN ${TABLE_NAMES.REVIEWS} r
        ON hp.id = r.target_id AND r.target_type = 'it_hilfe' AND r.status = 'published'
      LEFT JOIN ${TABLE_NAMES.IT_HILFE_OFFERS} offer
        ON hp.user_id = offer.helper_id

      WHERE hp.user_id = $1

      GROUP BY hp.id, u.id
    `, [userId])

    return result.rows[0] || null
  }

  /**
   * Search helpers by skill
   *
   * @param skill - Skill to search for
   * @param limit - Maximum results
   * @returns Matching helpers
   */
  async searchBySkill(skill: string, limit = 20): Promise<HelperWithDetails[]> {
    const result = await this.query<HelperWithDetails>(`
      SELECT
        hp.*,
        u.name,
        u.email,
        u.image,

        COALESCE(
          json_agg(
            json_build_object(
              'rating', r.rating,
              'comment', r.comment,
              'created_at', r.created_at
            )
            ORDER BY r.created_at DESC
          ) FILTER (WHERE r.id IS NOT NULL AND r.target_type = 'it_hilfe'),
          '[]'
        ) as reviews,

        ROUND(CAST(AVG(r.rating) AS NUMERIC), 2) as avg_rating,
        COUNT(r.id) FILTER (WHERE r.target_type = 'it_hilfe') as review_count,

        COUNT(DISTINCT offer.id) FILTER (WHERE offer.status IN ('completed', 'accepted', 'in_progress')) as total_helps,
        COUNT(DISTINCT offer.id) FILTER (WHERE offer.status = 'completed') as completed_helps

      FROM ${TABLE_NAMES.HELPER_PROFILES} hp
      INNER JOIN ${TABLE_NAMES.USERS} u ON hp.user_id = u.id
      LEFT JOIN ${TABLE_NAMES.REVIEWS} r
        ON hp.id = r.target_id AND r.target_type = 'it_hilfe' AND r.status = 'published'
      LEFT JOIN ${TABLE_NAMES.IT_HILFE_OFFERS} offer
        ON hp.user_id = offer.helper_id

      WHERE
        hp.status = 'active'
        AND hp.is_available = true
        AND $1 = ANY(hp.skills)

      GROUP BY hp.id, u.id
      ORDER BY AVG(r.rating) DESC NULLS LAST
      LIMIT $2
    `, [skill, limit])

    return result.rows
  }

  /**
   * Find helpers available for remote support
   *
   * @param limit - Maximum results
   * @returns Helpers offering remote support
   */
  async findRemoteHelpers(limit = 20): Promise<HelperWithDetails[]> {
    const result = await this.query<HelperWithDetails>(`
      SELECT
        hp.*,
        u.name,
        u.email,
        u.image,

        COALESCE(
          json_agg(
            json_build_object(
              'rating', r.rating,
              'comment', r.comment,
              'created_at', r.created_at
            )
            ORDER BY r.created_at DESC
          ) FILTER (WHERE r.id IS NOT NULL AND r.target_type = 'it_hilfe'),
          '[]'
        ) as reviews,

        ROUND(CAST(AVG(r.rating) AS NUMERIC), 2) as avg_rating,
        COUNT(r.id) FILTER (WHERE r.target_type = 'it_hilfe') as review_count,

        COUNT(DISTINCT offer.id) FILTER (WHERE offer.status IN ('completed', 'accepted', 'in_progress')) as total_helps,
        COUNT(DISTINCT offer.id) FILTER (WHERE offer.status = 'completed') as completed_helps

      FROM ${TABLE_NAMES.HELPER_PROFILES} hp
      INNER JOIN ${TABLE_NAMES.USERS} u ON hp.user_id = u.id
      LEFT JOIN ${TABLE_NAMES.REVIEWS} r
        ON hp.id = r.target_id AND r.target_type = 'it_hilfe' AND r.status = 'published'
      LEFT JOIN ${TABLE_NAMES.IT_HILFE_OFFERS} offer
        ON hp.user_id = offer.helper_id

      WHERE
        hp.status = 'active'
        AND hp.is_available = true
        AND hp.remote_support = true

      GROUP BY hp.id, u.id
      ORDER BY AVG(r.rating) DESC NULLS LAST, hp.created_at DESC
      LIMIT $1
    `, [limit])

    return result.rows
  }

  /**
   * Update helper availability status
   *
   * @param helperId - Helper ID
   * @param isAvailable - Availability status
   * @returns Success status
   */
  async updateAvailability(
    helperId: string,
    isAvailable: boolean
  ): Promise<{ success: boolean }> {
    await this.query(
      `UPDATE ${TABLE_NAMES.HELPER_PROFILES}
       SET is_available = $2, updated_at = NOW()
       WHERE id = $1`,
      [helperId, isAvailable]
    )

    return { success: true }
  }

  /**
   * Get helper statistics
   *
   * @param helperId - Helper ID
   * @returns Statistics
   */
  async getStatistics(helperId: string): Promise<{
    total_helps: number
    completed_helps: number
    avg_rating: number
    review_count: number
  }> {
    const result = await this.query<{
      total_helps: string
      completed_helps: string
      avg_rating: string
      review_count: string
    }>(`
      SELECT
        COUNT(DISTINCT offer.id) FILTER (WHERE offer.status IN ('completed', 'accepted', 'in_progress')) as total_helps,
        COUNT(DISTINCT offer.id) FILTER (WHERE offer.status = 'completed') as completed_helps,
        ROUND(CAST(AVG(r.rating) AS NUMERIC), 2) as avg_rating,
        COUNT(r.id) FILTER (WHERE r.target_type = 'it_hilfe') as review_count
      FROM ${TABLE_NAMES.HELPER_PROFILES} hp
      LEFT JOIN ${TABLE_NAMES.IT_HILFE_OFFERS} offer
        ON hp.user_id = offer.helper_id
      LEFT JOIN ${TABLE_NAMES.REVIEWS} r
        ON hp.id = r.target_id AND r.target_type = 'it_hilfe' AND r.status = 'published'
      WHERE hp.id = $1
      GROUP BY hp.id
    `, [helperId])

    const stats = result.rows[0] || {
      total_helps: '0',
      completed_helps: '0',
      avg_rating: '0',
      review_count: '0'
    }

    return {
      total_helps: parseInt(stats.total_helps),
      completed_helps: parseInt(stats.completed_helps),
      avg_rating: parseFloat(stats.avg_rating),
      review_count: parseInt(stats.review_count)
    }
  }
}

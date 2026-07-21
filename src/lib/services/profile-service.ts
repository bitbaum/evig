/**
 * Public profile service — one person, everything they offer.
 *
 * Composes a person's public footprint from the sources that link to their
 * account: marketplace listings (`listings.seller_id`), technician services
 * (`technician_profiles.user_id` → `technician_services`), workshops they
 * instruct or created (`workshops.instructor_id | created_by`), content they
 * authored (DB `blog_posts.created_by` + file posts by author email), and their
 * two-sided reputation (reviews received on their listings + reviews written).
 *
 * A profile is public only for people with a real public footprint (a seller
 * profile, an active technician profile, ≥1 listing/workshop/post, or ≥1
 * written review) — otherwise `getPublicProfile` returns null (404), so private
 * accounts are neither enumerable nor exposed.
 */

import { and, eq, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  users,
  userProfiles,
  sellerProfiles,
  listings,
  reviews,
  repairerProfiles,
  repairerServices,
  workshops,
} from '@/db/schema'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import { REVIEW_STATUS } from '@/config/review-status'
import { LISTING_STATUS } from '@/config/marketplace'
import { listingThumbnailSubquery } from '@/lib/marketplace/listing-helpers'
import { getMergedPosts } from '@/lib/blog-merge'
import { getBlogAuthorRecord } from '@/config/blog-authors'

export interface ProfileListing {
  id: string
  title: string
  price_chf: number
  category: string
  condition: string
  is_revampit: boolean
  pickup_location: string | null
  verified_at: string | null
  thumbnail: string | null
}

export interface ProfileService {
  id: string
  name: string
  category: string
  description: string | null
  base_price_cents: number | null
  hourly_rate_cents: number | null
}

export interface ProfileWorkshop {
  slug: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  featured_image: string | null
}

export interface ProfileContent {
  slug: string
  title: string
  excerpt: string | null
  category: string | null
  published_at: string | null
  featured_image: string | null
}

export interface ProfileReview {
  id: string
  target_id: string
  listing_title: string | null
  overall_rating: number
  title: string | null
  content: string
  created_at: string
}

export interface PublicProfile {
  user_id: string
  name: string
  avatar_url: string | null
  bio: string | null
  city: string | null
  canton: string | null
  is_verified: boolean
  is_staff: boolean
  is_technician: boolean
  technician_id: string | null
  member_since: string
  stats: {
    listings: number
    sold: number
    workshops: number
    posts: number
    services: number
    rating: number | null
    reviews_received: number
    reviews_written: number
  }
  listings: ProfileListing[]
  services: ProfileService[]
  workshops: ProfileWorkshop[]
  content: ProfileContent[]
  reviews_received: ProfileReview[]
  reviews_written: ProfileReview[]
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  // Identity — 404 if the account doesn't exist. Public identity (name/avatar/
  // bio/verified) comes from user_profiles (SSOT); city/canton from the seller
  // facet; is_staff from the account.
  const [identity] = await db
    .select({
      user_id: users.id,
      account_name: users.name,
      account_image: users.image,
      email: users.email,
      is_staff: users.isStaff,
      member_since: users.createdAt,
      display_name: userProfiles.displayName,
      avatar_url: userProfiles.avatarUrl,
      bio: userProfiles.bio,
      is_verified: userProfiles.isVerified,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.id, userId))

  if (!identity) return null

  // Seller facet — city/canton + aggregate totals for the stat row.
  const [seller] = await db
    .select({
      city: sellerProfiles.city,
      canton: sellerProfiles.canton,
      total_sold: sellerProfiles.totalSold,
      average_rating: sellerProfiles.averageRating,
      total_reviews: sellerProfiles.totalReviews,
    })
    .from(sellerProfiles)
    .where(eq(sellerProfiles.userId, userId))

  // Active marketplace listings (same shape the storefront uses).
  const listingRows = await db
    .select({
      id: listings.id,
      title: listings.title,
      price_chf: listings.priceChf,
      category: listings.category,
      condition: listings.condition,
      is_revampit: listings.isRevampit,
      pickup_location: listings.pickupLocation,
      verified_at: listings.verifiedAt,
      thumbnail: listingThumbnailSubquery,
    })
    .from(listings)
    .where(and(eq(listings.sellerId, userId), eq(listings.status, LISTING_STATUS.ACTIVE)))
    .orderBy(sql`${listings.createdAt} DESC`)

  // Technician facet — a public technician profile means "offers services".
  const [technician] = await db
    .select({ id: repairerProfiles.id, is_active: repairerProfiles.isActive, status: repairerProfiles.status })
    .from(repairerProfiles)
    .where(eq(repairerProfiles.userId, userId))

  const technicianPublic = !!technician && technician.is_active !== false && technician.status !== 'suspended'
  const serviceRows = technicianPublic
    ? await db
        .select({
          id: repairerServices.id,
          name: repairerServices.serviceName,
          category: repairerServices.serviceCategory,
          description: repairerServices.description,
          base_price_cents: repairerServices.basePriceCents,
          hourly_rate_cents: repairerServices.hourlyRateCents,
        })
        .from(repairerServices)
        .where(and(eq(repairerServices.repairerId, technician.id), eq(repairerServices.isActive, true)))
    : []

  // Workshops this person instructs or created.
  const workshopRows = await db
    .select({
      slug: workshops.slug,
      title: workshops.title,
      description: workshops.shortDescription,
      category: workshops.category,
      level: workshops.level,
      featured_image: workshops.featuredImage,
    })
    .from(workshops)
    .where(and(or(eq(workshops.instructorId, userId), eq(workshops.createdBy, userId)), eq(workshops.isActive, true)))
    .orderBy(sql`${workshops.createdAt} DESC`)

  // Content authored by this person: DB posts (created_by) + file posts whose
  // configured author email matches this account. Deduped by slug in the merge.
  const merged = await getMergedPosts('de')
  const contentRows: ProfileContent[] = merged
    .filter((p) => {
      // Only genuinely public posts on a public profile — never a team/author
      // -restricted post (upstream audience axis) nor an unlisted/link post.
      if (p.visibility !== 'public') return false
      if (p.audience !== 'public') return false
      if (p.authorId && p.authorId === userId) return true
      const rec = getBlogAuthorRecord(p.author)
      return !!rec && !!identity.email && rec.email.toLowerCase() === identity.email.toLowerCase()
    })
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? null,
      category: p.category ?? null,
      published_at: p.publishedAt ?? null,
      featured_image: p.featuredImage ?? null,
    }))

  // Reputation — reviews received on this seller's listings.
  const reviewsReceived = await db
    .select({
      id: reviews.id,
      target_id: reviews.targetId,
      listing_title: listings.title,
      overall_rating: reviews.overallRating,
      title: reviews.title,
      content: reviews.content,
      created_at: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(listings, eq(reviews.targetId, listings.id))
    .where(
      and(
        eq(listings.sellerId, userId),
        eq(reviews.targetType, REVIEW_TARGET_TYPES.LISTING),
        eq(reviews.status, REVIEW_STATUS.PUBLISHED),
      ),
    )
    .orderBy(sql`${reviews.createdAt} DESC`)
    .limit(10)

  // Reputation — reviews this person wrote.
  const reviewsWritten = await db
    .select({
      id: reviews.id,
      target_id: reviews.targetId,
      listing_title: listings.title,
      overall_rating: reviews.overallRating,
      title: reviews.title,
      content: reviews.content,
      created_at: reviews.createdAt,
    })
    .from(reviews)
    .leftJoin(
      listings,
      and(eq(reviews.targetId, listings.id), eq(reviews.targetType, REVIEW_TARGET_TYPES.LISTING)),
    )
    .where(and(eq(reviews.reviewerId, userId), eq(reviews.status, REVIEW_STATUS.PUBLISHED)))
    .orderBy(sql`${reviews.createdAt} DESC`)
    .limit(10)

  const [writtenAgg] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(reviews)
    .where(and(eq(reviews.reviewerId, userId), eq(reviews.status, REVIEW_STATUS.PUBLISHED)))

  const reviewsWrittenCount = writtenAgg?.count ?? 0
  const hasFootprint =
    !!seller ||
    technicianPublic ||
    listingRows.length > 0 ||
    workshopRows.length > 0 ||
    contentRows.length > 0 ||
    reviewsWrittenCount > 0

  // Privacy gate: no public footprint → no public profile.
  if (!hasFootprint) return null

  return {
    user_id: identity.user_id,
    name: identity.display_name || identity.account_name || 'Mitglied',
    avatar_url: identity.avatar_url || identity.account_image || null,
    bio: identity.bio ?? null,
    city: seller?.city ?? null,
    canton: seller?.canton ?? null,
    is_verified: !!identity.is_verified,
    is_staff: !!identity.is_staff,
    is_technician: technicianPublic,
    technician_id: technicianPublic ? technician!.id : null,
    member_since: identity.member_since as unknown as string,
    stats: {
      listings: listingRows.length,
      sold: seller?.total_sold ?? 0,
      workshops: workshopRows.length,
      posts: contentRows.length,
      services: serviceRows.length,
      rating: seller?.average_rating != null ? Number(seller.average_rating) : null,
      reviews_received: seller?.total_reviews ?? reviewsReceived.length,
      reviews_written: reviewsWrittenCount,
    },
    listings: listingRows.map((l) => ({
      ...l,
      price_chf: Number(l.price_chf),
    })),
    services: serviceRows,
    workshops: workshopRows,
    content: contentRows,
    reviews_received: reviewsReceived.map((r) => ({ ...r, created_at: r.created_at as unknown as string })),
    reviews_written: reviewsWritten.map((r) => ({ ...r, created_at: r.created_at as unknown as string })),
  }
}

export interface ListingImageData {
  id: string
  url: string
  position: number
  is_primary: boolean
}

export interface ListingDetail {
  id: string
  seller_id: string
  title: string
  description: string
  price_chf: number
  category: string
  condition: string
  brand: string | null
  model: string | null
  delivery_options: string
  shipping_cost_chf: number | null
  pickup_location: string | null
  payment_mode: string
  status: string
  is_revampit: boolean
  view_count: number
  favorite_count: number
  created_at: string
  seller_name: string
  seller_email: string | null
  seller_display_name: string | null
  seller_bio: string | null
  seller_avatar_url: string | null
  seller_city: string | null
  seller_canton: string | null
  seller_rating: number | null
  seller_total_sold: number | null
  seller_total_reviews: number | null
  images: ListingImageData[]
  is_favorited: boolean
  verified_at: string | null
  verified_by: string | null
  verification_notes: string | null
  condition_checks: Array<{ key: string; label: string; checked: boolean }> | null
  specs: Array<{ key: string; value: string; unit: string | null }> | null
}

export interface SimilarListing {
  id: string
  title: string
  price_chf: number
  condition: string
  thumbnail: string | null
}

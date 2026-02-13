/**
 * Marketplace Type Definitions
 * SSOT for marketplace-related types
 */

/**
 * Marketplace listing (as returned from API)
 */
export interface Listing {
  id: string;
  title: string;
  priceChf: number;
  category: string;
  condition: string;
  brand: string | null;
  model: string | null;
  thumbnail: string | null;
  deliveryOptions: string;
  paymentMode: string;
  status: string;
  isRevampit: boolean;
  pickupLocation: string | null;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  seller: {
    id?: string;
    name: string;
    displayName?: string;
    rating?: number;
    city: string | null;
  };
}

/**
 * Pagination metadata
 */
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

/**
 * API response for listings
 */
export interface ListingsResponse {
  success: boolean;
  data: {
    items: Listing[];
    pagination: Pagination;
  };
  error?: string;
}

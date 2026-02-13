/**
 * IT-Hilfe Type Definitions
 * SSOT for IT-Hilfe-related types
 */

/**
 * IT-Hilfe request (as returned from API)
 */
export interface ITHilfeRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  categoryId: string;
  deviceBrand: string | null;
  deviceModel: string | null;
  title: string;
  description: string;
  urgency: string;
  budgetType: string;
  budgetAmountCents: number | null;
  postalCode: string;
  city: string;
  canton: string;
  serviceType: string;
  skillsNeeded: string[];
  imageUrls: string[];
  status: string;
  offerCount: number;
  expiresAt: string;
  createdAt: string;
}

/**
 * Pagination metadata
 */
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore?: boolean;
}

/**
 * API response for IT-Hilfe requests
 */
export interface ITHilfeRequestsResponse {
  success: boolean;
  data: {
    requests: ITHilfeRequest[];
    total: number;
    pagination?: Pagination;
  };
  error?: string;
}

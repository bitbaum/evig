/**
 * Medusa Client Configuration
 * 
 * This module provides the base URL configuration for connecting to the Medusa backend.
 * All API calls are proxied through Next.js API routes to avoid CORS issues.
 */

import { MEDUSA_CONFIG } from '@/config/medusa'

export const MEDUSA_API_BASE = "/api/shop";
export const MEDUSA_BACKEND_URL = MEDUSA_CONFIG.URL;
export const PUBLISHABLE_KEY = MEDUSA_CONFIG.PUBLISHABLE_KEY;

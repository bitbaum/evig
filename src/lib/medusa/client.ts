/**
 * Medusa Client Configuration
 * 
 * This module provides the base URL configuration for connecting to the Medusa backend.
 * All API calls are proxied through Next.js API routes to avoid CORS issues.
 */

export const MEDUSA_API_BASE = "/api/shop";
export const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
export const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_eee502aced5bea9f350f22cc90c2f98e74417fcfa17a35a230837b069e915a55";

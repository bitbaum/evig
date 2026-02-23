/**
 * Auth.js API Route Handler
 * Handles all authentication requests: /api/auth/*
 */

import { handlers } from '@/auth'

// Auth.js v5 App Router handlers for /api/auth/*
export const { GET, POST } = handlers

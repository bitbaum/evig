// PCI DSS Compliance Middleware
// Ensures payment endpoints meet PCI DSS requirements

import { NextRequest, NextResponse } from 'next/server'
import { PCI_COMPLIANCE, paymentRateLimiter, isSecureRequest, createAuditLog } from '@/lib/payments/security'
import { logger } from '@/lib/logger'

// Route handler context type for dynamic route parameters
interface RouteContext {
  params?: Promise<Record<string, string>>
}

// Extended request type with payment validation
interface PaymentValidatedRequest extends NextRequest {
  paymentValidation?: { isValid: boolean; errors: string[] }
}

// PCI DSS compliance middleware
export function withPCICompliance(handler: Function) {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      // 1. Security Headers
      const response = await handler(request, context)

      if (response instanceof NextResponse) {
        // Add PCI-required security headers
        Object.entries(PCI_COMPLIANCE.SECURITY_HEADERS).forEach(([key, value]) => {
          response.headers.set(key, value)
        })

        // Add additional payment-specific headers
        response.headers.set('X-Payment-Endpoint', 'true')
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
      }

      return response

    } catch (error) {
      logger.error('PCI Compliance middleware error', { error })
      return NextResponse.json(
        { error: 'Payment processing error' },
        { status: 500 }
      )
    }
  }
}

// Payment endpoint protection middleware
export function withPaymentSecurity(handler: Function, options: {
  rateLimit?: { maxAttempts?: number; windowMs?: number }
  requireHttps?: boolean
  auditLog?: boolean
} = {}) {
  return async (request: NextRequest, context?: RouteContext) => {
    const {
      rateLimit = { maxAttempts: 10, windowMs: 60000 },
      requireHttps = true,
      auditLog = true
    } = options

    try {
      // Get client identifier (IP address)
      const clientIP = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown'

      // Rate limiting
      if (!paymentRateLimiter.isAllowed(clientIP, rateLimit.maxAttempts, rateLimit.windowMs)) {
        logger.warn('Rate limit exceeded', { clientIP })
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        )
      }

      // HTTPS requirement (except in development)
      if (requireHttps && !isSecureRequest(request) && process.env.NODE_ENV !== 'development') {
        logger.warn('Insecure request blocked', { clientIP })
        return NextResponse.json(
          { error: 'HTTPS required for payment processing' },
          { status: 403 }
        )
      }

      // Audit logging
      if (auditLog) {
        const auditEntry = createAuditLog(
          'payment_endpoint_access',
          'anonymous', // User ID not available yet
          'payment_endpoint',
          request.nextUrl.pathname,
          {
            method: request.method,
            userAgent: request.headers.get('user-agent'),
            origin: request.headers.get('origin')
          },
          clientIP
        )

        // In production, this would be sent to a secure logging service
        logger.info('Payment audit', auditEntry)
      }

      // Add security headers to response
      const response = await withPCICompliance(handler)(request, context)

      return response

    } catch (error) {
      logger.error('Payment security middleware error', { error })

      // Log security incidents
      const auditEntry = createAuditLog(
        'payment_security_error',
        'system',
        'payment_endpoint',
        request.nextUrl.pathname,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        request.headers.get('x-forwarded-for') || 'unknown'
      )

      logger.error('Security incident', auditEntry)

      return NextResponse.json(
        { error: 'Security error occurred' },
        { status: 500 }
      )
    }
  }
}

// Validate payment data middleware
export function withPaymentValidation(handler: Function) {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      const body = await request.json()

      // Import validation here to avoid circular dependencies
      const { validatePaymentData } = await import('@/lib/payments/security')

      const validation = validatePaymentData(body)

      if (!validation.isValid) {
        logger.warn('Payment validation failed', { errors: validation.errors })
        return NextResponse.json(
          {
            error: 'Payment data validation failed',
            details: validation.errors
          },
          { status: 400 }
        )
      }

      // Add validation result to request for handler access
      ;(request as PaymentValidatedRequest).paymentValidation = validation

      return handler(request, context)

    } catch (error) {
      logger.error('Payment validation error', { error })
      return NextResponse.json(
        { error: 'Invalid payment data format' },
        { status: 400 }
      )
    }
  }
}

// Combined middleware for payment endpoints
export function withSecurePayment(
  handler: Function,
  options: Parameters<typeof withPaymentSecurity>[1] = {}
) {
  return withPaymentSecurity(
    withPaymentValidation(
      withPCICompliance(handler)
    ),
    options
  )
}
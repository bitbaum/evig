import { apiSuccess, apiError } from '@/lib/api/helpers';

export async function GET() {
  try {
    // Check database connectivity (optional)
    // You could add database health checks here

    return apiSuccess({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        frontend: 'up',
        cms_api: process.env.NEXT_PUBLIC_API_URL ? 'configured' : 'not_configured'
      }
    });
  } catch (error) {
    return apiError(
      error,
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

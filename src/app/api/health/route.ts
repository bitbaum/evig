import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check database connectivity (optional)
    // You could add database health checks here

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        frontend: 'up',
        cms_api: process.env.NEXT_PUBLIC_API_URL ? 'configured' : 'not_configured'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

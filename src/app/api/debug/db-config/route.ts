import { NextResponse } from 'next/server'

export async function GET() {
  // Show config (safe values only, no passwords)
  const config = {
    host: process.env.DB_HOST || process.env.AUTH_DB_HOST || 'not set',
    port: process.env.DB_PORT || process.env.AUTH_DB_PORT || 'not set',
    database: process.env.DB_NAME || process.env.AUTH_DB_NAME || 'not set',
    user: process.env.DB_USER || process.env.AUTH_DB_USER || 'not set',
    passwordSet: !!(process.env.DB_PASSWORD || process.env.AUTH_DB_PASSWORD),
    sslConfig: process.env.DB_SSL || 'not set',
  }

  return NextResponse.json(config)
}

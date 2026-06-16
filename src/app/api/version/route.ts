import packageJson from '../../../../package.json'
import { apiSuccess } from '@/lib/api/helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  return apiSuccess({
    app: packageJson.name,
    version: packageJson.version,
    gitSha: process.env.NEXT_PUBLIC_BUILD_SHA ?? 'unknown',
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? 'unknown',
    environment: process.env.NODE_ENV ?? 'unknown',
  })
}

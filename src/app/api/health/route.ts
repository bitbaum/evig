/**
 * Health Check API
 *
 * GET /api/health
 * Returns the health status of all services
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { MEILISEARCH_URL } from '@/config/urls';
import { logger } from '@/lib/logger';
import { apiSuccess } from '@/lib/api/helpers';
import { getLLMHealth } from '@/lib/hirn/health';
import { getAIToolsHealth } from '@/lib/ai/health';

interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    database: ServiceStatus;
    meilisearch: ServiceStatus;
    hirn: ServiceStatus;
    aiTools: ServiceStatus;
  };
}

/**
 * A PASSIVE check — reports what the last real chat/AI-tools attempt
 * actually did, rather than making a fresh vendor call the way
 * `checkDatabase`/`checkMeilisearch` do. "unknown" (nothing has been
 * attempted yet since the last restart) reads as healthy, same as the
 * process itself: there is no evidence of a problem, and treating
 * "untested" as a failure would flap this endpoint on every deploy.
 *
 * A "down" tracker maps to `unhealthy` here, but — same as Meilisearch —
 * the aggregation below only escalates the OVERALL status to `unhealthy`
 * (503) when the database itself is down. A dead API key does not get
 * fixed by a restart, so it must never fail whatever gate decides whether
 * to kill and restart this process.
 */
function fromTrackerStatus(health: ReturnType<typeof getLLMHealth>): ServiceStatus {
  if (health.status === 'down') {
    return { status: 'unhealthy', message: health.lastError ?? undefined };
  }
  if (health.status === 'degraded') {
    return { status: 'degraded', message: health.lastError ?? undefined };
  }
  return { status: 'healthy' };
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT NOW() as now`);
    return {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    logger.error('Database health check failed', { error });
    return {
      status: 'unhealthy',
      message: 'Cannot connect to database',
    };
  }
}

async function checkMeilisearch(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${MEILISEARCH_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        status: 'healthy',
        latency: Date.now() - start,
      };
    }
    return {
      status: 'unhealthy',
      message: `HTTP ${response.status}`,
    };
  } catch {
    return {
      status: 'unhealthy',
      message: 'Service not running',
    };
  }
}

export async function GET() {
  const [database, meilisearch] = await Promise.all([checkDatabase(), checkMeilisearch()]);
  const hirn = fromTrackerStatus(getLLMHealth());
  const aiTools = fromTrackerStatus(getAIToolsHealth());

  const services = { database, meilisearch, hirn, aiTools };

  // Determine overall status
  const statuses = Object.values(services).map((s) => s.status);
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

  if (statuses.includes('unhealthy')) {
    // If database is down, system is unhealthy
    // If optional services are down, system is degraded
    if (database.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
  };

  return apiSuccess(response, overallStatus === 'unhealthy' ? 503 : 200);
}

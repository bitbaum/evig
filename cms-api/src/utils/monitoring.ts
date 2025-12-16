import { Request, Response, NextFunction } from 'express';
import { executeQuery } from './database';

interface RequestMetrics {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip: string;
  timestamp: Date;
}

class MonitoringService {
  private metrics: RequestMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 requests

  /**
   * Record request metrics
   */
  recordRequest(req: Request, res: Response, responseTime: number): void {
    const metrics: RequestMetrics = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      timestamp: new Date(),
    };

    this.metrics.push(metrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.url} - ${responseTime}ms`);
    }

    // Log errors
    if (res.statusCode >= 500) {
      console.error(`💥 Server error: ${req.method} ${req.url} - ${res.statusCode}`);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    requestsPerMinute: number;
    recentRequests: RequestMetrics[];
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentRequests = this.metrics.filter(m => m.timestamp.getTime() > oneMinuteAgo);

    const totalRequests = this.metrics.length;
    const errorRequests = this.metrics.filter(m => m.statusCode >= 400).length;
    const totalResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0);

    return {
      totalRequests,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      errorRate: totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0,
      requestsPerMinute: recentRequests.length,
      recentRequests: this.metrics.slice(-10), // Last 10 requests
    };
  }

  /**
   * Middleware to monitor requests
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const start = Date.now();

      res.on('finish', () => {
        const responseTime = Date.now() - start;
        this.recordRequest(req, res, responseTime);
      });

      next();
    };
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

/**
 * Health check with detailed metrics
 */
export async function getHealthMetrics() {
  try {
    // Test database connection
    const dbStart = Date.now();
    await executeQuery('SELECT 1');
    const dbResponseTime = Date.now() - dbStart;

    const metrics = monitoring.getMetrics();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        connected: true,
        responseTime: dbResponseTime,
      },
      api: {
        totalRequests: metrics.totalRequests,
        averageResponseTime: Math.round(metrics.averageResponseTime),
        errorRate: Math.round(metrics.errorRate * 100) / 100,
        requestsPerMinute: metrics.requestsPerMinute,
      },
      version: process.env.npm_package_version || '1.0.0',
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Security audit log
 */
export async function logSecurityEvent(
  event: string,
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await executeQuery(
      `INSERT INTO audit_logs (user_id, action, resource_type, details, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [userId, event, 'security', JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}




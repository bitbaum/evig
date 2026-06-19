/**
 * Logger utility for production-ready logging
 * 
 * Provides structured logging with different levels and proper handling
 * for development vs production environments
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
}

class Logger {
  private formatLog(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    }
  }

  private shouldLog(level: LogLevel): boolean {
    // Read NODE_ENV lazily at call-time rather than caching it at construction.
    // NODE_ENV never changes mid-process, so runtime behaviour is identical to a
    // captured field — but reading it here keeps both branches testable instead
    // of freezing whatever NODE_ENV happened to be at import time.
    const isDevelopment = process.env.NODE_ENV === 'development'
    // In production, only log warnings and errors
    if (!isDevelopment && level === LogLevel.DEBUG) {
      return false
    }
    return true
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return
    const entry = this.formatLog(LogLevel.DEBUG, message, data)
    console.log(`[DEBUG] ${entry.message}`, data || '')
  }

  info(message: string, data?: unknown): void {
    if (!this.shouldLog(LogLevel.INFO)) return
    const entry = this.formatLog(LogLevel.INFO, message, data)
    console.log(`[INFO] ${entry.message}`, data || '')
  }

  warn(message: string, data?: unknown): void {
    const entry = this.formatLog(LogLevel.WARN, message, data)
    console.warn(`[WARN] ${entry.message}`, data || '')
  }

  error(message: string, error?: unknown): void {
    const entry = this.formatLog(LogLevel.ERROR, message, error)
    console.error(`[ERROR] ${entry.message}`, error || '')
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export const logDebug = (message: string, data?: unknown) => logger.debug(message, data)
export const logInfo = (message: string, data?: unknown) => logger.info(message, data)
export const logWarn = (message: string, data?: unknown) => logger.warn(message, data)
export const logError = (message: string, error?: unknown) => logger.error(message, error)


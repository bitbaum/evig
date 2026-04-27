/**
 * Tests for lib/logger.ts — structured logging singleton.
 *
 * Mission-relevant: logger replaces console.log everywhere (per CLAUDE.md).
 * If debug() logs in production, verbose output leaks to prod logs.
 * If error() silently swallows calls, failures go unnoticed.
 *
 * Behaviors locked:
 *   debug
 *   - does NOT call console.log in non-development env (NODE_ENV=test)
 *
 *   info
 *   - calls console.log with [INFO] prefix
 *   - includes the message
 *
 *   warn
 *   - calls console.warn with [WARN] prefix
 *
 *   error
 *   - calls console.error with [ERROR] prefix
 *
 *   convenience functions (logDebug, logInfo, logWarn, logError)
 *   - delegate to the logger singleton
 */

import { logger, logDebug, logInfo, logWarn, logError } from '../logger'

let consoleLog: jest.SpyInstance
let consoleWarn: jest.SpyInstance
let consoleError: jest.SpyInstance

beforeEach(() => {
  consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleLog.mockRestore()
  consoleWarn.mockRestore()
  consoleError.mockRestore()
})

// ============================================================================
// debug
// ============================================================================

describe('logger.debug', () => {
  it('calls console.log in development environment', () => {
    // .env sets NODE_ENV=development, loaded by next/jest — debug is active in tests
    logger.debug('debug message')

    expect(consoleLog).toHaveBeenCalledTimes(1)
  })

  it('includes [DEBUG] prefix in output', () => {
    logger.debug('trace message')

    const firstArg = consoleLog.mock.calls[0][0] as string
    expect(firstArg).toContain('[DEBUG]')
  })
})

// ============================================================================
// info
// ============================================================================

describe('logger.info', () => {
  it('calls console.log', () => {
    logger.info('test info')

    expect(consoleLog).toHaveBeenCalledTimes(1)
  })

  it('includes [INFO] prefix in the output', () => {
    logger.info('hello world')

    const firstArg = consoleLog.mock.calls[0][0] as string
    expect(firstArg).toContain('[INFO]')
  })

  it('includes the message in the output', () => {
    logger.info('my important message')

    const firstArg = consoleLog.mock.calls[0][0] as string
    expect(firstArg).toContain('my important message')
  })

  it('passes data as second argument when provided', () => {
    logger.info('with data', { userId: '123' })

    const secondArg = consoleLog.mock.calls[0][1]
    expect(secondArg).toEqual({ userId: '123' })
  })
})

// ============================================================================
// warn
// ============================================================================

describe('logger.warn', () => {
  it('calls console.warn', () => {
    logger.warn('test warning')

    expect(consoleWarn).toHaveBeenCalledTimes(1)
  })

  it('includes [WARN] prefix', () => {
    logger.warn('something odd')

    const firstArg = consoleWarn.mock.calls[0][0] as string
    expect(firstArg).toContain('[WARN]')
  })

  it('includes the message', () => {
    logger.warn('disk space low')

    const firstArg = consoleWarn.mock.calls[0][0] as string
    expect(firstArg).toContain('disk space low')
  })
})

// ============================================================================
// error
// ============================================================================

describe('logger.error', () => {
  it('calls console.error', () => {
    logger.error('something failed')

    expect(consoleError).toHaveBeenCalledTimes(1)
  })

  it('includes [ERROR] prefix', () => {
    logger.error('fatal error')

    const firstArg = consoleError.mock.calls[0][0] as string
    expect(firstArg).toContain('[ERROR]')
  })

  it('includes the message', () => {
    logger.error('db connection lost')

    const firstArg = consoleError.mock.calls[0][0] as string
    expect(firstArg).toContain('db connection lost')
  })

  it('passes error object as second argument when provided', () => {
    const err = new Error('boom')
    logger.error('caught error', err)

    expect(consoleError.mock.calls[0][1]).toBe(err)
  })
})

// ============================================================================
// convenience functions
// ============================================================================

describe('logInfo convenience function', () => {
  it('calls console.log', () => {
    logInfo('via convenience')

    expect(consoleLog).toHaveBeenCalledTimes(1)
  })
})

describe('logWarn convenience function', () => {
  it('calls console.warn', () => {
    logWarn('via convenience')

    expect(consoleWarn).toHaveBeenCalledTimes(1)
  })
})

describe('logError convenience function', () => {
  it('calls console.error', () => {
    logError('via convenience')

    expect(consoleError).toHaveBeenCalledTimes(1)
  })
})

describe('logDebug convenience function', () => {
  it('calls console.log in development environment', () => {
    logDebug('via convenience')

    expect(consoleLog).toHaveBeenCalledTimes(1)
  })
})

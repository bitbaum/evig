/**
 * Tests for error utility (lib/utils/error.ts)
 *
 * getErrorMessage is used throughout the app to safely extract error messages
 * from unknown throw values. Client-safe: must never expose internal details.
 */

import { getErrorMessage } from '../error'

describe('getErrorMessage', () => {
  it('returns the message from an Error instance', () => {
    expect(getErrorMessage(new Error('Etwas ist schiefgelaufen'))).toBe('Etwas ist schiefgelaufen')
  })

  it('returns "Unbekannter Fehler" for null', () => {
    expect(getErrorMessage(null)).toBe('Unbekannter Fehler')
  })

  it('returns "Unbekannter Fehler" for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Unbekannter Fehler')
  })

  it('returns "Unbekannter Fehler" for a plain string', () => {
    expect(getErrorMessage('raw string error')).toBe('Unbekannter Fehler')
  })

  it('returns "Unbekannter Fehler" for a number', () => {
    expect(getErrorMessage(42)).toBe('Unbekannter Fehler')
  })

  it('returns "Unbekannter Fehler" for a plain object', () => {
    expect(getErrorMessage({ message: 'not an Error' })).toBe('Unbekannter Fehler')
  })

  it('returns "Unbekannter Fehler" for an array', () => {
    expect(getErrorMessage(['error'])).toBe('Unbekannter Fehler')
  })

  it('preserves empty message from Error', () => {
    expect(getErrorMessage(new Error(''))).toBe('')
  })

  it('works with Error subclasses (TypeError, RangeError)', () => {
    expect(getErrorMessage(new TypeError('Ungültiger Typ'))).toBe('Ungültiger Typ')
    expect(getErrorMessage(new RangeError('Ausserhalb des Bereichs'))).toBe('Ausserhalb des Bereichs')
  })

  it('returns a string always', () => {
    expect(typeof getErrorMessage(null)).toBe('string')
    expect(typeof getErrorMessage(new Error('x'))).toBe('string')
  })
})

/**
 * Tests for design system utilities (lib/design-system.ts)
 *
 * The design system is the SSOT for WCAG-compliant color combinations.
 * Bugs here mean the wrong CSS classes reach components, breaking
 * accessibility. Tests verify that each background returns correct
 * contrast-safe text, background, and border classes.
 *
 * Covers: getTextColor, getBackgroundColor, getBorderColor,
 *         getStatusColors, getButtonVariant.
 */

import {
  getTextColor,
  getBackgroundColor,
  getBorderColor,
  getStatusColors,
  getButtonVariant,
  designPrimitive,
} from '../design-system'

// ============================================================================
// getTextColor
// ============================================================================

describe('getTextColor', () => {
  it('returns dark text on white background (WCAG contrast)', () => {
    expect(getTextColor('white')).toBe('text-text-primary')
  })

  it('returns white text on primary (green) background', () => {
    expect(getTextColor('primary')).toBe('text-white')
  })

  it('returns white text on secondary (orange) background', () => {
    expect(getTextColor('secondary')).toBe('text-white')
  })

  it('returns dark text on warning (warning) background — better contrast', () => {
    expect(getTextColor('warning')).toBe('text-neutral-900')
  })

  it('returns white text on error (red) background', () => {
    expect(getTextColor('error')).toBe('text-white')
  })

  it('returns white text on success (green) background', () => {
    expect(getTextColor('success')).toBe('text-white')
  })

  it('returns white text on info background', () => {
    expect(getTextColor('info')).toBe('text-white')
  })

  it('returns neutral-900 on neutral background', () => {
    expect(getTextColor('neutral')).toBe('text-text-primary')
  })

  it('defaults to primary variant when no variant specified', () => {
    const withDefault = getTextColor('white')
    const withExplicit = getTextColor('white', 'primary')
    expect(withDefault).toBe(withExplicit)
  })

  it('returns secondary text variant', () => {
    const result = getTextColor('white', 'secondary')
    expect(result).toBe('text-text-secondary')
  })

  it('returns muted text variant', () => {
    const result = getTextColor('white', 'muted')
    expect(result).toBe('text-text-tertiary')
  })

  it('returns white text on dark background', () => {
    const result = getTextColor('dark')
    expect(result).toBe('text-text-inverted')
  })

  it('returns a non-empty string', () => {
    expect(getTextColor('white').length).toBeGreaterThan(0)
    expect(getTextColor('primary').length).toBeGreaterThan(0)
  })
})

// ============================================================================
// getBackgroundColor
// ============================================================================

describe('getBackgroundColor', () => {
  it('returns bg-surface-base for white', () => {
    expect(getBackgroundColor('white')).toBe('bg-surface-base')
  })

  it('returns bg-surface-raised for neutral', () => {
    expect(getBackgroundColor('neutral')).toBe('bg-surface-raised')
  })

  it('returns bg-primary-600 for primary', () => {
    expect(getBackgroundColor('primary')).toBe('bg-primary-600')
  })

  it('returns bg-secondary-500 for secondary', () => {
    expect(getBackgroundColor('secondary')).toBe('bg-secondary-500')
  })

  it('returns bg-success-600 for success', () => {
    expect(getBackgroundColor('success')).toBe('bg-success-600')
  })

  it('returns bg-warning-500 for warning', () => {
    expect(getBackgroundColor('warning')).toBe('bg-warning-500')
  })

  it('returns bg-surface-page for dark background', () => {
    expect(getBackgroundColor('dark')).toBe('bg-surface-page')
  })

  it('returns a Tailwind class string', () => {
    expect(getBackgroundColor('white')).toMatch(/^bg-/)
  })
})

// ============================================================================
// getBorderColor
// ============================================================================

describe('getBorderColor', () => {
  it('returns border-subtle for white', () => {
    expect(getBorderColor('white')).toBe('border-subtle')
  })

  it('returns border-default for neutral', () => {
    expect(getBorderColor('neutral')).toBe('border-default')
  })

  it('returns border-primary-700 for primary', () => {
    expect(getBorderColor('primary')).toBe('border-primary-700')
  })

  it('returns border-subtle for dark background', () => {
    expect(getBorderColor('dark')).toBe('border-subtle')
  })

  it('returns a Tailwind border class', () => {
    expect(getBorderColor('white')).toMatch(/^border-/)
  })
})

// ============================================================================
// getStatusColors
// ============================================================================

describe('getStatusColors', () => {
  it('returns success colors', () => {
    const result = getStatusColors('success')
    expect(result.bg).toBe('bg-success-50')
    expect(result.text).toBe('text-success-800')
    expect(result.border).toBe('border-success-200')
    expect(result.icon).toBe('text-success-600')
  })

  it('returns warning colors', () => {
    const result = getStatusColors('warning')
    expect(result.bg).toBe('bg-warning-50')
    expect(result.text).toBe('text-warning-800')
  })

  it('returns error colors', () => {
    const result = getStatusColors('error')
    expect(result.bg).toContain('bg-error-50')
    expect(result.text).toContain('text-error-800')
  })

  it('returns info colors', () => {
    const result = getStatusColors('info')
    expect(result.bg).toBe('bg-surface-raised')
    expect(result.text).toBe('text-text-primary')
  })

  it('returns neutral colors', () => {
    const result = getStatusColors('neutral')
    expect(result.bg).toBe('bg-surface-raised')
    expect(result.text).toBe('text-text-primary')
  })

  it('each status result has bg, text, border, icon', () => {
    for (const status of ['success', 'warning', 'error', 'info', 'neutral'] as const) {
      const result = getStatusColors(status)
      expect(result).toHaveProperty('bg')
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('border')
      expect(result).toHaveProperty('icon')
    }
  })
})

// ============================================================================
// getButtonVariant
// ============================================================================

describe('getButtonVariant', () => {
  it('returns primary button classes', () => {
    const result = getButtonVariant('primary')
    expect(result.bg).toBe('bg-action')
    expect(result.text).toBe('text-action-text')
    expect(result.hover).toBe('hover:bg-action-hover')
  })

  it('returns secondary button classes', () => {
    const result = getButtonVariant('secondary')
    expect(result.bg).toBe('bg-secondary-500')
    expect(result.text).toBe('text-white')
  })

  it('returns outline-solid button classes (transparent bg)', () => {
    const result = getButtonVariant('outline')
    expect(result.bg).toBe('bg-transparent')
    expect(result.text).toBe('text-text-secondary')
  })

  it('returns ghost button classes', () => {
    const result = getButtonVariant('ghost')
    expect(result.bg).toBe('bg-transparent')
    expect(result.border).toBe('border-transparent')
  })

  it('returns success button classes', () => {
    const result = getButtonVariant('success')
    expect(result.bg).toBe('bg-success-600')
    expect(result.text).toBe('text-white')
  })

  it('returns error button classes', () => {
    const result = getButtonVariant('error')
    expect(result.bg).toBe('bg-error-600')
    expect(result.text).toBe('text-white')
  })

  it('each variant has bg, hover, text, border', () => {
    for (const variant of ['primary', 'secondary', 'outline', 'ghost', 'success', 'error'] as const) {
      const result = getButtonVariant(variant)
      expect(result).toHaveProperty('bg')
      expect(result).toHaveProperty('hover')
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('border')
    }
  })
})

// ============================================================================
// designPrimitive
// ============================================================================

describe('designPrimitive', () => {
  it('exposes semantic primitive groups for app-wide styling', () => {
    expect(designPrimitive).toHaveProperty('type')
    expect(designPrimitive).toHaveProperty('surface')
    expect(designPrimitive).toHaveProperty('button')
    expect(designPrimitive).toHaveProperty('badge')
    expect(designPrimitive).toHaveProperty('form')
    expect(designPrimitive).toHaveProperty('table')
  })

  it('uses compact text-sm in shared body and form primitives (x.ai tight-tracking style)', () => {
    expect(designPrimitive.type.body).toContain('text-sm')
    expect(designPrimitive.form.input).toContain('text-sm')
    expect(designPrimitive.table.td).toContain('text-sm')
  })

  it('keeps default button touch target at least 44px (WCAG 2.1 SC 2.5.5)', () => {
    expect(designPrimitive.buttonSize.default).toContain('min-h-touch')
  })
})

/**
 * Tests for form primitive components: Input, Textarea, Select, FormField
 *
 * These components are the SSOT for form field styling across the app.
 * Bugs here mean inconsistent focus rings, missing dark-mode tokens, or
 * broken accessibility attributes — failures that affect every form.
 *
 * Covers:
 *   Input     — renders with design-system class, passes through HTML attrs
 *   Textarea  — renders with design-system class, passes through HTML attrs
 *   Select    — renders with design-system class, renders children
 *   FormField — label / required marker / hint / error rendering and priority
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Input } from '../input'
import { Textarea } from '../textarea'
import { Select } from '../select'
import { FormField } from '../form-field'
import { designPrimitive } from '@/lib/design-system'

// ============================================================================
// Input
// ============================================================================

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('passes through standard HTML attributes', () => {
    render(<Input type="email" placeholder="E-Mail" name="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('name', 'email')
    expect(input).toHaveAttribute('placeholder', 'E-Mail')
  })

  it('applies a custom className on top of design-system classes', () => {
    render(<Input className="custom-class" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-class')
  })

  it('supports disabled state', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('applies the elevated form primitive class when variant="elevated"', () => {
    render(<Input variant="elevated" data-testid="elev" />)
    const el = screen.getByTestId('elev')
    // The elevated bg is what differentiates the two — `bg-surface-raised`
    // sits a layer above the default `bg-surface-base` so inputs inside
    // a modal/aside stay visible against the panel's own bg.
    expect(el).toHaveClass('bg-surface-raised')
    expect(el).not.toHaveClass('bg-surface-base')
  })

  it('defaults to the regular form primitive when variant is omitted', () => {
    render(<Input data-testid="def" />)
    const el = screen.getByTestId('def')
    expect(el).toHaveClass('bg-surface-base')
    expect(el).not.toHaveClass('bg-surface-raised')
  })
})

// ============================================================================
// Textarea
// ============================================================================

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('passes through rows and maxLength', () => {
    render(<Textarea rows={5} maxLength={1000} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('rows', '5')
    expect(textarea).toHaveAttribute('maxLength', '1000')
  })

  it('applies a custom className', () => {
    render(<Textarea className="resize-none" />)
    expect(screen.getByRole('textbox')).toHaveClass('resize-none')
  })

  it('applies the elevated form primitive class when variant="elevated"', () => {
    render(<Textarea variant="elevated" data-testid="elev" />)
    const el = screen.getByTestId('elev')
    expect(el).toHaveClass('bg-surface-raised')
    expect(el).not.toHaveClass('bg-surface-base')
  })
})

// ============================================================================
// Select
// ============================================================================

describe('Select', () => {
  it('renders a select element with its options', () => {
    render(
      <Select>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </Select>
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option A' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option B' })).toBeInTheDocument()
  })

  it('reflects the selected value', () => {
    render(
      <Select defaultValue="b">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    )
    expect(screen.getByRole('combobox')).toHaveValue('b')
  })

  it('applies a custom className', () => {
    render(
      <Select className="extra">
        <option value="">–</option>
      </Select>
    )
    expect(screen.getByRole('combobox')).toHaveClass('extra')
  })

  it('applies the elevated form primitive class when variant="elevated"', () => {
    render(
      <Select variant="elevated" data-testid="elev">
        <option value="">–</option>
      </Select>
    )
    const el = screen.getByTestId('elev')
    expect(el).toHaveClass('bg-surface-raised')
    expect(el).not.toHaveClass('bg-surface-base')
  })
})

// ============================================================================
// designPrimitive.form — SSOT for variant pairing
// ============================================================================

describe('designPrimitive.form variants', () => {
  it('exports paired regular + elevated class strings for input/textarea/select', () => {
    expect(typeof designPrimitive.form.input).toBe('string')
    expect(typeof designPrimitive.form.inputElevated).toBe('string')
    expect(typeof designPrimitive.form.textarea).toBe('string')
    expect(typeof designPrimitive.form.textareaElevated).toBe('string')
    expect(typeof designPrimitive.form.select).toBe('string')
    expect(typeof designPrimitive.form.selectElevated).toBe('string')
  })

  it('elevated variants sit on surface-raised, default variants on surface-base', () => {
    // Semantic tokens flip light/dark via CSS vars in globals.css — no
    // explicit `dark:` variant needed. The differentiator is which
    // surface tier the control sits on.
    expect(designPrimitive.form.inputElevated).toContain('bg-surface-raised')
    expect(designPrimitive.form.input).toContain('bg-surface-base')

    expect(designPrimitive.form.textareaElevated).toContain('bg-surface-raised')
    expect(designPrimitive.form.textarea).toContain('bg-surface-base')

    expect(designPrimitive.form.selectElevated).toContain('bg-surface-raised')
    expect(designPrimitive.form.select).toContain('bg-surface-base')
  })
})

// ============================================================================
// FormField
// ============================================================================

describe('FormField', () => {
  it('renders children without label or hint', () => {
    render(
      <FormField>
        <input type="text" />
      </FormField>
    )
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders a visible label when label prop is provided', () => {
    render(
      <FormField label="Titel" htmlFor="title">
        <input type="text" id="title" />
      </FormField>
    )
    expect(screen.getByText('Titel')).toBeInTheDocument()
    expect(screen.getByLabelText('Titel')).toBeInTheDocument()
  })

  it('adds a required marker (*) when required prop is set', () => {
    render(
      <FormField label="Pflichtfeld" required htmlFor="field">
        <input type="text" id="field" />
      </FormField>
    )
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders hint text below the field', () => {
    render(
      <FormField hint="Mehrere Werte mit Komma trennen">
        <input type="text" />
      </FormField>
    )
    expect(screen.getByText('Mehrere Werte mit Komma trennen')).toBeInTheDocument()
  })

  it('renders error text and hides hint when both are provided', () => {
    render(
      <FormField hint="Hilfetext" error="Dieses Feld ist ungültig">
        <input type="text" />
      </FormField>
    )
    expect(screen.getByText('Dieses Feld ist ungültig')).toBeInTheDocument()
    expect(screen.queryByText('Hilfetext')).not.toBeInTheDocument()
  })

  it('marks error message with alert role for screen readers', () => {
    render(
      <FormField error="Pflichtfeld">
        <input type="text" />
      </FormField>
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Pflichtfeld')
  })
})

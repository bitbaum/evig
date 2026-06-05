/**
 * Tests for auth Zod schemas (lib/schemas/auth.ts)
 *
 * Auth schemas guard registration, login, and password reset — the entry
 * point for all user accounts. Validation correctness is security-critical.
 *
 * Covers: RegisterSchema, LoginSchema, ForgotPasswordSchema,
 *         ResetPasswordSchema, ChangePasswordSchema, VerifyCodeSchema,
 *         VerifyEmailTokenSchema, RegistrationRoleSchema.
 *
 * Password rules: min 8, max 128, no complexity requirements (see AUTH_CONFIG).
 */

import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  VerifyCodeSchema,
} from '../auth'

// ============================================================================
// RegisterSchema
// ============================================================================

describe('RegisterSchema', () => {
  const valid = {
    email: 'benutzer@example.com',
    password: 'sicher1234',
  }

  it('accepts minimal valid registration', () => {
    const result = RegisterSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('normalizes email to lowercase', () => {
    const result = RegisterSchema.safeParse({ ...valid, email: 'USER@EXAMPLE.COM' })
    if (result.success) expect(result.data.email).toBe('user@example.com')
  })

  it('rejects invalid email', () => {
    const result = RegisterSchema.safeParse({ ...valid, email: 'no-at-sign' })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = RegisterSchema.safeParse({ ...valid, password: 'short' })
    expect(result.success).toBe(false)
  })

  it('accepts password of exactly 8 characters', () => {
    const result = RegisterSchema.safeParse({ ...valid, password: '12345678' })
    expect(result.success).toBe(true)
  })

  it('rejects password longer than 128 characters', () => {
    const result = RegisterSchema.safeParse({ ...valid, password: 'x'.repeat(129) })
    expect(result.success).toBe(false)
  })

  it('accepts password of exactly 128 characters', () => {
    const result = RegisterSchema.safeParse({ ...valid, password: 'x'.repeat(128) })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 characters', () => {
    const result = RegisterSchema.safeParse({ ...valid, name: 'X' })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 100 characters', () => {
    const result = RegisterSchema.safeParse({ ...valid, name: 'x'.repeat(101) })
    expect(result.success).toBe(false)
  })

})

// ============================================================================
// LoginSchema
// ============================================================================

describe('LoginSchema', () => {
  const valid = {
    email: 'user@example.com',
    password: 'anypassword',
  }

  it('accepts valid login', () => {
    const result = LoginSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults remember to false', () => {
    const result = LoginSchema.safeParse(valid)
    if (result.success) expect(result.data.remember).toBe(false)
  })

  it('normalizes email to lowercase', () => {
    const result = LoginSchema.safeParse({ ...valid, email: 'User@Example.COM' })
    if (result.success) expect(result.data.email).toBe('user@example.com')
  })

  it('rejects empty password', () => {
    const result = LoginSchema.safeParse({ ...valid, password: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = LoginSchema.safeParse({ ...valid, email: 'not-valid' })
    expect(result.success).toBe(false)
  })

  it('accepts remember: true', () => {
    const result = LoginSchema.safeParse({ ...valid, remember: true })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// ForgotPasswordSchema
// ============================================================================

describe('ForgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = ForgotPasswordSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = ForgotPasswordSchema.safeParse({ email: 'nope' })
    expect(result.success).toBe(false)
  })

  it('normalizes email to lowercase', () => {
    const result = ForgotPasswordSchema.safeParse({ email: 'USER@EXAMPLE.COM' })
    if (result.success) expect(result.data.email).toBe('user@example.com')
  })
})

// ============================================================================
// ResetPasswordSchema (cross-field refinement)
// ============================================================================

describe('ResetPasswordSchema', () => {
  const valid = {
    token: 'abc123token',
    password: 'newpassword1',
    confirmPassword: 'newpassword1',
  }

  it('accepts matching passwords', () => {
    const result = ResetPasswordSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = ResetPasswordSchema.safeParse({
      ...valid,
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty token', () => {
    const result = ResetPasswordSchema.safeParse({ ...valid, token: '' })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = ResetPasswordSchema.safeParse({
      ...valid,
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// ChangePasswordSchema (cross-field refinement)
// ============================================================================

describe('ChangePasswordSchema', () => {
  const valid = {
    currentPassword: 'oldpassword123',
    newPassword: 'newpassword456',
    confirmPassword: 'newpassword456',
  }

  it('accepts valid password change', () => {
    const result = ChangePasswordSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects mismatched new passwords', () => {
    const result = ChangePasswordSchema.safeParse({
      ...valid,
      confirmPassword: 'doesnotmatch',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty currentPassword', () => {
    const result = ChangePasswordSchema.safeParse({ ...valid, currentPassword: '' })
    expect(result.success).toBe(false)
  })

  it('rejects newPassword shorter than 8 characters', () => {
    const result = ChangePasswordSchema.safeParse({
      ...valid,
      newPassword: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// VerifyCodeSchema
// ============================================================================

describe('VerifyCodeSchema', () => {
  const valid = {
    email: 'user@example.com',
    code: '123456',
  }

  it('accepts valid 6-digit code', () => {
    const result = VerifyCodeSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects code shorter than 6 digits', () => {
    const result = VerifyCodeSchema.safeParse({ ...valid, code: '12345' })
    expect(result.success).toBe(false)
  })

  it('rejects code longer than 6 digits', () => {
    const result = VerifyCodeSchema.safeParse({ ...valid, code: '1234567' })
    expect(result.success).toBe(false)
  })

  it('rejects non-numeric code', () => {
    const result = VerifyCodeSchema.safeParse({ ...valid, code: 'abc123' })
    expect(result.success).toBe(false)
  })

  it('rejects code with letters', () => {
    const result = VerifyCodeSchema.safeParse({ ...valid, code: 'ABCDEF' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = VerifyCodeSchema.safeParse({ ...valid, email: 'invalid' })
    expect(result.success).toBe(false)
  })
})

// VerifyEmailTokenSchema + RegistrationRoleSchema tests removed (VV.2)
// — both schemas deleted as dead code. Token-based verify-email page
// was unused (wizard uses the 6-digit code flow). Role was always
// derived server-side from email domain; carrying it in the request
// was YAGNI.

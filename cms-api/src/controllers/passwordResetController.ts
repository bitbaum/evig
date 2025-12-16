import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { executeQuerySingle, executeTransaction } from '../utils/database';
import { hashPassword } from '../utils/auth';
import { sendEmail } from '../utils/email';
import { User } from '../models/User';
import crypto from 'crypto';

/**
 * Request password reset
 */
export const requestPasswordReset = [
  // Validation rules
  body('email').isEmail().normalizeEmail(),

  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { email } = req.body;

      // Find user
      const user = await executeQuerySingle<User>(
        'SELECT id, email, name FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (!user) {
        // Don't reveal if email exists for security
        res.json({
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent.',
        });
        return;
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token
      await executeTransaction(async (client) => {
        // Delete any existing tokens for this user
        await client.query(
          'DELETE FROM password_reset_tokens WHERE user_id = $1',
          [user.id]
        );

        // Insert new token
        await client.query(
          'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
          [user.id, token, expiresAt]
        );
      });

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

      try {
        await sendEmail({
          to: user.email,
          subject: 'Reset your RevampIT password',
          html: `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your RevampIT account.</p>
            <p><a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request, just log the error
      }

      res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
    } catch (error) {
      console.error('Request password reset error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Reset password with token
 */
export const resetPassword = [
  // Validation rules
  body('token').isLength({ min: 1 }),
  body('new_password').isLength({ min: 8 }),

  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { token, new_password } = req.body;

      // Find and verify token
      const tokenData = await executeQuerySingle<{ user_id: string; expires_at: Date }>(
        'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND used_at IS NULL',
        [token]
      );

      if (!tokenData) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token',
        });
        return;
      }

      // Hash new password
      const hashedPassword = await hashPassword(new_password);

      // Update password and mark token as used
      await executeTransaction(async (client) => {
        // Update password
        await client.query(
          'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [hashedPassword, tokenData.user_id]
        );

        // Mark token as used
        await client.query(
          'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = $1',
          [token]
        );
      });

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Validate reset token (for frontend)
 */
export const validateResetToken = [
  // Validation rules
  param('token').isLength({ min: 1 }),

  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { token } = req.params;

      // Check if token is valid and not used
      const tokenData = await executeQuerySingle(
        'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND used_at IS NULL',
        [token]
      );

      if (!tokenData) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired token',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Token is valid',
      });
    } catch (error) {
      console.error('Validate reset token error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];




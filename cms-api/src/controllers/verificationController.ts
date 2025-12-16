import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { executeQuerySingle, executeTransaction } from '../utils/database';
import { generateToken, verifyToken } from '../utils/auth';
import { sendEmail } from '../utils/email';
import { User } from '../models/User';
import crypto from 'crypto';

/**
 * Send email verification token
 */
export const sendVerificationEmail = [
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
        'SELECT id, email, email_verified, name FROM users WHERE email = $1',
        [email]
      );

      if (!user) {
        // Don't reveal if email exists for security
        res.json({
          success: true,
          message: 'If an account with this email exists, a verification link has been sent.',
        });
        return;
      }

      if (user.email_verified) {
        res.status(400).json({
          success: false,
          error: 'Email is already verified',
        });
        return;
      }

      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save verification token
      await executeTransaction(async (client) => {
        // Delete any existing tokens for this user
        await client.query(
          'DELETE FROM email_verification_tokens WHERE user_id = $1',
          [user.id]
        );

        // Insert new token
        await client.query(
          'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
          [user.id, token, expiresAt]
        );
      });

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

      try {
        await sendEmail({
          to: user.email,
          subject: 'Verify your RevampIT account',
          html: `
            <h2>Welcome to RevampIT!</h2>
            <p>Please verify your email address to complete your registration.</p>
            <p><a href="${verificationUrl}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the request, just log the error
      }

      res.json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error) {
      console.error('Send verification email error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Verify email with token
 */
export const verifyEmail = [
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

      // Find and verify token
      const tokenData = await executeQuerySingle<{ user_id: string; expires_at: Date }>(
        'SELECT user_id, expires_at FROM email_verification_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
        [token]
      );

      if (!tokenData) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired verification token',
        });
        return;
      }

      // Update user email verification
      await executeTransaction(async (client) => {
        // Update user
        await client.query(
          'UPDATE users SET email_verified = CURRENT_TIMESTAMP WHERE id = $1',
          [tokenData.user_id]
        );

        // Delete used token
        await client.query(
          'DELETE FROM email_verification_tokens WHERE token = $1',
          [token]
        );
      });

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];




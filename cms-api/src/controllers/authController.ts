import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { executeQuerySingle, executeQuery } from '../utils/database';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { User, LoginData, CreateUserData, AuthToken } from '../models/User';

/**
 * Register a new user (Admin only)
 */
export const register = [
  // Validation rules
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('first_name').trim().isLength({ min: 1, max: 100 }),
  body('last_name').trim().isLength({ min: 1, max: 100 }),
  body('role').optional().isIn(['admin', 'editor', 'viewer']),

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

      const { email, password, first_name, last_name, role = 'viewer' }: CreateUserData = req.body;

      // Check if user already exists
      const existingUser = await executeQuerySingle<User>(
        'SELECT id, email FROM users WHERE email = $1',
        [email]
      );

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'User with this email already exists',
        });
        return;
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Create user
      const newUser = await executeQuerySingle<User>(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, first_name, last_name, role, is_active, created_at`,
        [email, password_hash, first_name, last_name, role]
      );

      if (!newUser) {
        throw new Error('Failed to create user');
      }

      // Generate token
      const token = generateToken({
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: newUser,
          token,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Login user
 */
export const login = [
  // Validation rules
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),

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

      const { email, password }: LoginData = req.body;

      // Find user
      const user = await executeQuerySingle<User>(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
        return;
      }

      // Check password
      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
        return;
      }

      // Update last login
      await executeQuery(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      });

      // Set JWT as httpOnly cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : false,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            last_login_at: user.last_login_at,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await executeQuerySingle<User>(
      'SELECT id, email, first_name, last_name, role, is_active, last_login_at, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = [
  // Validation rules
  body('email').optional().isEmail().normalizeEmail(),
  body('first_name').optional().trim().isLength({ min: 1, max: 100 }),
  body('last_name').optional().trim().isLength({ min: 1, max: 100 }),

  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

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

      const { email, first_name, last_name } = req.body;
      const userId = req.user.id;

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await executeQuerySingle<User>(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, userId]
        );

        if (existingUser) {
          res.status(409).json({
            success: false,
            error: 'Email is already taken',
          });
          return;
        }
      }

      // Update user
      const updatedUser = await executeQuerySingle<User>(
        `UPDATE users
         SET email = COALESCE($1, email),
             first_name = COALESCE($2, first_name),
             last_name = COALESCE($3, last_name),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, email, first_name, last_name, role, is_active, updated_at`,
        [email, first_name, last_name, userId]
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Change password
 */
export const changePassword = [
  // Validation rules
  body('current_password').exists(),
  body('new_password').isLength({ min: 8 }),

  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

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

      const { current_password, new_password } = req.body;
      const userId = req.user.id;

      // Get current user
      const user = await executeQuerySingle<User>(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Verify current password
      const isValidPassword = await comparePassword(current_password, user.password_hash);
      if (!isValidPassword) {
        res.status(400).json({
          success: false,
          error: 'Current password is incorrect',
        });
        return;
      }

      // Hash new password
      const newPasswordHash = await hashPassword(new_password);

      // Update password
      await executeQuery(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, userId]
      );

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

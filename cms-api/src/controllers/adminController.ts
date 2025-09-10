import { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { executeQuery, executeQuerySingle } from '../utils/database';
import { hashPassword } from '../utils/auth';
import { User, CreateUserData, UpdateUserData } from '../models/User';
import { PaginatedResponse } from '../models/Content';

/**
 * Get all users with pagination and filtering
 */
export const getUsers = [
  // Validation rules
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('role').optional().isIn(['admin', 'editor', 'viewer']),
  query('is_active').optional().isBoolean(),

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

      const {
        page = 1,
        limit = 10,
        search = '',
        role,
        is_active
      } = req.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      // Build query
      let whereClause = '1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        whereClause += ` AND (email ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex + 1} OR last_name ILIKE $${paramIndex + 2})`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        paramIndex += 3;
      }

      if (role) {
        whereClause += ` AND role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }

      if (is_active !== undefined) {
        whereClause += ` AND is_active = $${paramIndex}`;
        params.push(is_active);
        paramIndex++;
      }

      // Get total count
      const countResult = await executeQuerySingle<{ count: number }>(
        `SELECT COUNT(*) as count FROM users WHERE ${whereClause}`,
        params
      );

      if (!countResult) {
        throw new Error('Failed to get user count');
      }

      // Get users (exclude password hash)
      const users = await executeQuery<User>(
        `SELECT id, email, first_name, last_name, role, is_active, last_login_at, created_at, updated_at
         FROM users
         WHERE ${whereClause}
         ORDER BY updated_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limitNum, offset]
      );

      const response: PaginatedResponse<User> = {
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countResult.count,
          total_pages: Math.ceil(countResult.count / limitNum),
          has_next: pageNum * limitNum < countResult.count,
          has_prev: pageNum > 1,
        },
      };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Get a single user by ID
 */
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await executeQuerySingle<User>(
      'SELECT id, email, first_name, last_name, role, is_active, last_login_at, created_at, updated_at FROM users WHERE id = $1',
      [id]
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
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create a new user
 */
export const createUser = [
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
        'SELECT id FROM users WHERE email = $1',
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

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser,
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Update a user
 */
export const updateUser = [
  // Validation rules
  body('email').optional().isEmail().normalizeEmail(),
  body('first_name').optional().trim().isLength({ min: 1, max: 100 }),
  body('last_name').optional().trim().isLength({ min: 1, max: 100 }),
  body('role').optional().isIn(['admin', 'editor', 'viewer']),
  body('is_active').optional().isBoolean(),

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

      const { id } = req.params;
      const { email, first_name, last_name, role, is_active } = req.body;

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await executeQuerySingle<User>(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, id]
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
             role = COALESCE($4, role),
             is_active = COALESCE($5, is_active),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING id, email, first_name, last_name, role, is_active, updated_at`,
        [email, first_name, last_name, role, is_active, id]
      );

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
];

/**
 * Delete a user
 */
export const deleteUser = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
      return;
    }

    // Check if user exists and get their details
    const user = await executeQuerySingle<User>(
      'SELECT role FROM users WHERE id = $1',
      [id]
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await executeQuerySingle<{ count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND id != $1",
        [id]
      );

      if (!adminCount || adminCount.count === 0) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete the last admin user',
        });
        return;
      }
    }

    // Delete user
    await executeQuery('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get system statistics
 */
export const getSystemStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user statistics
    const userStats = await executeQuerySingle<{
      total_users: number;
      active_users: number;
      admin_users: number;
      editor_users: number;
    }>(
      `SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'editor' THEN 1 END) as editor_users
       FROM users`
    );

    // Get content statistics
    const contentStats = await executeQuerySingle<{
      total_static_pages: number;
      published_static_pages: number;
      total_blog_posts: number;
      published_blog_posts: number;
      total_categories: number;
      active_categories: number;
    }>(
      `SELECT
        (SELECT COUNT(*) FROM static_pages) as total_static_pages,
        (SELECT COUNT(*) FROM static_pages WHERE is_published = true) as published_static_pages,
        (SELECT COUNT(*) FROM blog_posts) as total_blog_posts,
        (SELECT COUNT(*) FROM blog_posts WHERE is_published = true) as published_blog_posts,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM categories WHERE is_active = true) as active_categories`
    );

    res.json({
      success: true,
      data: {
        users: userStats,
        content: contentStats,
        system: {
          version: process.env.npm_package_version || '1.0.0',
          node_version: process.version,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

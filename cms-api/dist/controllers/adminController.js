"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemStats = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUser = exports.getUsers = void 0;
const express_validator_1 = require("express-validator");
const database_1 = require("../utils/database");
const auth_1 = require("../utils/auth");
exports.getUsers = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('search').optional().trim(),
    (0, express_validator_1.query)('role').optional().isIn(['admin', 'editor', 'user']),
    (0, express_validator_1.query)('is_active').optional().isBoolean(),
    async (req, res) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
                return;
            }
            const { page = 1, limit = 10, search = '', role, is_active } = req.query;
            const pageNum = Number(page);
            const limitNum = Number(limit);
            const offset = (pageNum - 1) * limitNum;
            let whereClause = '1=1';
            const params = [];
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
            const countResult = await (0, database_1.executeQuerySingle)(`SELECT COUNT(*) as count FROM users WHERE ${whereClause}`, params);
            if (!countResult) {
                throw new Error('Failed to get user count');
            }
            const users = await (0, database_1.executeQuery)(`SELECT id, email, first_name, last_name, role, is_active, last_login_at, created_at, updated_at
         FROM users
         WHERE ${whereClause}
         ORDER BY updated_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limitNum, offset]);
            const response = {
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
        }
        catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    },
];
const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await (0, database_1.executeQuerySingle)('SELECT id, email, first_name, last_name, role, is_active, last_login_at, created_at, updated_at FROM users WHERE id = $1', [id]);
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
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
};
exports.getUser = getUser;
exports.createUser = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }),
    (0, express_validator_1.body)('first_name').trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('last_name').trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('role').optional().isIn(['admin', 'editor', 'user']),
    async (req, res) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
                return;
            }
            const { email, password, first_name, last_name, role = 'user' } = req.body;
            const existingUser = await (0, database_1.executeQuerySingle)('SELECT id FROM users WHERE email = $1', [email]);
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    error: 'User with this email already exists',
                });
                return;
            }
            const password_hash = await (0, auth_1.hashPassword)(password);
            const newUser = await (0, database_1.executeQuerySingle)(`INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, first_name, last_name, role, is_active, created_at`, [email, password_hash, first_name, last_name, role]);
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: newUser,
            });
        }
        catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    },
];
exports.updateUser = [
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail(),
    (0, express_validator_1.body)('first_name').optional().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('last_name').optional().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('role').optional().isIn(['admin', 'editor', 'user']),
    (0, express_validator_1.body)('is_active').optional().isBoolean(),
    async (req, res) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
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
            if (email) {
                const existingUser = await (0, database_1.executeQuerySingle)('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
                if (existingUser) {
                    res.status(409).json({
                        success: false,
                        error: 'Email is already taken',
                    });
                    return;
                }
            }
            const updatedUser = await (0, database_1.executeQuerySingle)(`UPDATE users
         SET email = COALESCE($1, email),
             first_name = COALESCE($2, first_name),
             last_name = COALESCE($3, last_name),
             role = COALESCE($4, role),
             is_active = COALESCE($5, is_active),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING id, email, first_name, last_name, role, is_active, updated_at`, [email, first_name, last_name, role, is_active, id]);
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
        }
        catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    },
];
const deleteUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const { id } = req.params;
        if (id === req.user.id) {
            res.status(400).json({
                success: false,
                error: 'Cannot delete your own account',
            });
            return;
        }
        const user = await (0, database_1.executeQuerySingle)('SELECT role FROM users WHERE id = $1', [id]);
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }
        if (user.role === 'admin') {
            const adminCount = await (0, database_1.executeQuerySingle)("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND id != $1", [id]);
            if (!adminCount || adminCount.count === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Cannot delete the last admin user',
                });
                return;
            }
        }
        await (0, database_1.executeQuery)('DELETE FROM users WHERE id = $1', [id]);
        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
};
exports.deleteUser = deleteUser;
const getSystemStats = async (req, res) => {
    try {
        const userStats = await (0, database_1.executeQuerySingle)(`SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'editor' THEN 1 END) as editor_users
       FROM users`);
        const contentStats = await (0, database_1.executeQuerySingle)(`SELECT
        (SELECT COUNT(*) FROM static_pages) as total_static_pages,
        (SELECT COUNT(*) FROM static_pages WHERE is_published = true) as published_static_pages,
        (SELECT COUNT(*) FROM blog_posts) as total_blog_posts,
        (SELECT COUNT(*) FROM blog_posts WHERE is_published = true) as published_blog_posts,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM categories WHERE is_active = true) as active_categories`);
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
    }
    catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
};
exports.getSystemStats = getSystemStats;
//# sourceMappingURL=adminController.js.map
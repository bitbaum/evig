"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const express_validator_1 = require("express-validator");
const database_1 = require("../utils/database");
const auth_1 = require("../utils/auth");
exports.register = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }),
    (0, express_validator_1.body)('first_name').trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('last_name').trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('role').optional().isIn(['admin', 'editor', 'viewer']),
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
            const { email, password, first_name, last_name, role = 'viewer' } = req.body;
            const existingUser = await (0, database_1.executeQuerySingle)('SELECT id, email FROM users WHERE email = $1', [email]);
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
            if (!newUser) {
                throw new Error('Failed to create user');
            }
            const token = (0, auth_1.generateToken)({
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
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    },
];
exports.login = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').exists(),
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
            const { email, password } = req.body;
            const user = await (0, database_1.executeQuerySingle)('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                });
                return;
            }
            const isValidPassword = await (0, auth_1.comparePassword)(password, user.password_hash);
            if (!isValidPassword) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                });
                return;
            }
            await (0, database_1.executeQuery)('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
            const token = (0, auth_1.generateToken)({
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
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
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    },
];
const getProfile = async (req, res) => {
    try {
        const user = await (0, database_1.executeQuerySingle)('SELECT id, email, first_name, last_name, role, is_active, last_login_at, created_at FROM users WHERE id = $1', [req.user.id]);
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
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
};
exports.getProfile = getProfile;
exports.updateProfile = [
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail(),
    (0, express_validator_1.body)('first_name').optional().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('last_name').optional().trim().isLength({ min: 1, max: 100 }),
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
            const { email, first_name, last_name } = req.body;
            const userId = req.user.id;
            if (email) {
                const existingUser = await (0, database_1.executeQuerySingle)('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
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
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, email, first_name, last_name, role, is_active, updated_at`, [email, first_name, last_name, userId]);
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedUser,
            });
        }
        catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    },
];
exports.changePassword = [
    (0, express_validator_1.body)('current_password').exists(),
    (0, express_validator_1.body)('new_password').isLength({ min: 8 }),
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
            const { current_password, new_password } = req.body;
            const userId = req.user.id;
            const user = await (0, database_1.executeQuerySingle)('SELECT password_hash FROM users WHERE id = $1', [userId]);
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
                return;
            }
            const isValidPassword = await (0, auth_1.comparePassword)(current_password, user.password_hash);
            if (!isValidPassword) {
                res.status(400).json({
                    success: false,
                    error: 'Current password is incorrect',
                });
                return;
            }
            const newPasswordHash = await (0, auth_1.hashPassword)(new_password);
            await (0, database_1.executeQuery)('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newPasswordHash, userId]);
            res.json({
                success: true,
                message: 'Password changed successfully',
            });
        }
        catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    },
];
//# sourceMappingURL=authController.js.map
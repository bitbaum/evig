"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.extractTokenFromHeader = extractTokenFromHeader;
exports.hasRole = hasRole;
exports.authenticateToken = authenticateToken;
exports.authorizeRole = authorizeRole;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./env");
async function hashPassword(password) {
    const saltRounds = 12;
    return bcrypt_1.default.hash(password, saltRounds);
}
async function comparePassword(password, hashedPassword) {
    return bcrypt_1.default.compare(password, hashedPassword);
}
function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
    };
    const expiresIn = 24 * 60 * 60;
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn,
        algorithm: 'HS256',
    });
}
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        return decoded;
    }
    catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}
function extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
function hasRole(userRole, requiredRole) {
    const roleHierarchy = {
        user: 1,
        editor: 2,
        admin: 3,
    };
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    return userLevel >= requiredLevel;
}
function authenticateToken(req, res, next) {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
        res.status(401).json({
            success: false,
            error: 'Access token required',
        });
        return;
    }
    const user = verifyToken(token);
    if (!user) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
        });
        return;
    }
    req.user = user;
    next();
}
function authorizeRole(requiredRole) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }
        if (!hasRole(req.user.role, requiredRole)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map
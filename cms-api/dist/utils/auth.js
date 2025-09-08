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
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
async function hashPassword(password) {
    const saltRounds = 12;
    return bcrypt_1.default.hash(password, saltRounds);
}
async function comparePassword(password, hashedPassword) {
    return bcrypt_1.default.compare(password, hashedPassword);
}
function generateToken(user) {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
    }, JWT_SECRET || 'fallback-secret-change-in-production', { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
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
        viewer: 1,
        editor: 2,
        admin: 3,
    };
    return roleHierarchy[userRole] >=
        roleHierarchy[requiredRole];
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
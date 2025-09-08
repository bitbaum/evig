import { AuthToken } from '../models/User';
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hashedPassword: string): Promise<boolean>;
export declare function generateToken(user: AuthToken): string;
export declare function verifyToken(token: string): AuthToken | null;
export declare function extractTokenFromHeader(authHeader: string | undefined): string | null;
export declare function hasRole(userRole: string, requiredRole: string): boolean;
export declare function authenticateToken(req: any, res: any, next: any): void;
export declare function authorizeRole(requiredRole: string): (req: any, res: any, next: any) => void;
//# sourceMappingURL=auth.d.ts.map
export interface User {
    id: string;
    email: string;
    password_hash?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email_verified?: Date;
    image?: string;
    role: 'admin' | 'editor' | 'user';
    is_active: boolean;
    last_login_at?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface CreateUserData {
    email: string;
    password?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    role?: 'admin' | 'editor' | 'user';
}
export interface UpdateUserData {
    email?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    role?: 'admin' | 'editor' | 'user';
    is_active?: boolean;
    email_verified?: Date;
    image?: string;
}
export interface LoginData {
    email: string;
    password: string;
}
export interface AuthToken {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
}
//# sourceMappingURL=User.d.ts.map
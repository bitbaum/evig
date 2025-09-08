import { Pool } from 'pg';
export declare const pool: Pool;
export declare function initializeDatabase(): Promise<void>;
export declare function executeQuery<T = any>(text: string, params?: any[]): Promise<T[]>;
export declare function executeQuerySingle<T = any>(text: string, params?: any[]): Promise<T | null>;
export declare function executeTransaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
export declare function closeDatabase(): Promise<void>;
//# sourceMappingURL=database.d.ts.map
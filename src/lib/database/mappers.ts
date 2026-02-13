/**
 * Database mapping utilities
 *
 * Converts between snake_case (database) and camelCase (TypeScript)
 */

/**
 * Convert snake_case to camelCase
 *
 * @param str - String in snake_case
 * @returns String in camelCase
 *
 * @example
 * snakeToCamel('user_id') // 'userId'
 * snakeToCamel('created_at') // 'createdAt'
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase to snake_case
 *
 * @param str - String in camelCase
 * @returns String in snake_case
 *
 * @example
 * camelToSnake('userId') // 'user_id'
 * camelToSnake('createdAt') // 'created_at'
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Map database row (snake_case) to TypeScript object (camelCase)
 *
 * @param row - Database row with snake_case keys
 * @returns Object with camelCase keys
 *
 * @example
 * const dbRow = { user_id: '123', created_at: '2024-01-01' }
 * mapDbRowToCamel(dbRow) // { userId: '123', createdAt: '2024-01-01' }
 */
export function mapDbRowToCamel<T extends Record<string, any>>(row: T): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = value;
  }

  return result;
}

/**
 * Map array of database rows to TypeScript objects
 *
 * @param rows - Array of database rows
 * @returns Array of objects with camelCase keys
 */
export function mapDbRowsToCamel<T extends Record<string, any>>(
  rows: T[]
): Record<string, any>[] {
  return rows.map(mapDbRowToCamel);
}

/**
 * Map TypeScript object (camelCase) to database row (snake_case)
 *
 * @param obj - Object with camelCase keys
 * @returns Object with snake_case keys
 *
 * @example
 * const obj = { userId: '123', createdAt: '2024-01-01' }
 * mapObjToSnake(obj) // { user_id: '123', created_at: '2024-01-01' }
 */
export function mapObjToSnake<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    result[snakeKey] = value;
  }

  return result;
}

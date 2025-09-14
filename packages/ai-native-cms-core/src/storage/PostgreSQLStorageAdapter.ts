import { 
  StorageAdapter, 
  Suggestion, 
  SuggestionInput, 
  SuggestionFilters, 
  SuggestionStatus,
  SuggestionStats 
} from '../types'

interface PostgreSQLConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  schema?: string
  ssl?: boolean | object
  pool?: {
    min?: number
    max?: number
    idleTimeoutMillis?: number
  }
}

export class PostgreSQLStorageAdapter implements StorageAdapter {
  private db: any = null
  private tableName: string
  
  constructor(private config: PostgreSQLConfig) {
    this.tableName = `${config.schema || 'public'}.ai_native_cms_suggestions`
  }

  async init(): Promise<void> {
    // Dynamic import to avoid requiring pg as a peer dependency
    let pg: any
    try {
      pg = await import('pg')
    } catch (error) {
      throw new Error('pg package is required for PostgreSQL adapter. Install it with: npm install pg @types/pg')
    }

    const { Pool } = pg.default || pg

    this.db = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl,
      ...this.config.pool
    })

    // Test connection
    try {
      await this.db.query('SELECT NOW()')
    } catch (error) {
      throw new Error(`Failed to connect to PostgreSQL: ${error.message}`)
    }

    // Create table if it doesn't exist
    await this.createTableIfNotExists()
  }

  private async createTableIfNotExists(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        contact VARCHAR(255),
        page VARCHAR(500) NOT NULL,
        url TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        ip INET NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        ai_instructions TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indices for better query performance
      CREATE INDEX IF NOT EXISTS idx_ai_cms_suggestions_status ON ${this.tableName}(status);
      CREATE INDEX IF NOT EXISTS idx_ai_cms_suggestions_page ON ${this.tableName}(page);
      CREATE INDEX IF NOT EXISTS idx_ai_cms_suggestions_created_at ON ${this.tableName}(created_at);
      CREATE INDEX IF NOT EXISTS idx_ai_cms_suggestions_ip ON ${this.tableName}(ip);

      -- Create updated_at trigger
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_ai_cms_suggestions_updated_at ON ${this.tableName};
      
      CREATE TRIGGER update_ai_cms_suggestions_updated_at
        BEFORE UPDATE ON ${this.tableName}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `

    await this.db.query(createTableSQL)
  }

  async create(input: SuggestionInput, ip: string): Promise<Suggestion> {
    const query = `
      INSERT INTO ${this.tableName} (content, contact, page, url, timestamp, ip, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `
    
    const values = [
      input.content,
      input.contact || null,
      input.page,
      input.url,
      new Date().toISOString(),
      ip,
      JSON.stringify(input.metadata || {})
    ]

    const result = await this.db.query(query, values)
    return this.mapRowToSuggestion(result.rows[0])
  }

  async findById(id: string): Promise<Suggestion | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`
    const result = await this.db.query(query, [id])
    
    return result.rows.length > 0 ? this.mapRowToSuggestion(result.rows[0]) : null
  }

  async findAll(filters?: SuggestionFilters): Promise<Suggestion[]> {
    let query = `SELECT * FROM ${this.tableName}`
    const conditions: string[] = []
    const values: any[] = []
    let paramCount = 0

    if (filters?.status) {
      conditions.push(`status = $${++paramCount}`)
      values.push(filters.status)
    }

    if (filters?.page) {
      conditions.push(`page = $${++paramCount}`)
      values.push(filters.page)
    }

    if (filters?.dateFrom) {
      conditions.push(`created_at >= $${++paramCount}`)
      values.push(filters.dateFrom)
    }

    if (filters?.dateTo) {
      conditions.push(`created_at <= $${++paramCount}`)
      values.push(filters.dateTo)
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` ORDER BY created_at DESC`

    if (filters?.limit) {
      query += ` LIMIT $${++paramCount}`
      values.push(filters.limit)
    }

    if (filters?.offset) {
      query += ` OFFSET $${++paramCount}`
      values.push(filters.offset)
    }

    const result = await this.db.query(query, values)
    return result.rows.map(row => this.mapRowToSuggestion(row))
  }

  async update(id: string, updates: Partial<Suggestion>): Promise<Suggestion> {
    const setClause: string[] = []
    const values: any[] = []
    let paramCount = 0

    // Build dynamic SET clause
    if (updates.content !== undefined) {
      setClause.push(`content = $${++paramCount}`)
      values.push(updates.content)
    }

    if (updates.contact !== undefined) {
      setClause.push(`contact = $${++paramCount}`)
      values.push(updates.contact)
    }

    if (updates.status !== undefined) {
      setClause.push(`status = $${++paramCount}`)
      values.push(updates.status)
    }

    if (updates.aiInstructions !== undefined) {
      setClause.push(`ai_instructions = $${++paramCount}`)
      values.push(updates.aiInstructions)
    }

    if (updates.metadata !== undefined) {
      setClause.push(`metadata = $${++paramCount}`)
      values.push(JSON.stringify(updates.metadata))
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update')
    }

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING *
    `
    values.push(id)

    const result = await this.db.query(query, values)
    
    if (result.rows.length === 0) {
      throw new Error(`Suggestion with id ${id} not found`)
    }

    return this.mapRowToSuggestion(result.rows[0])
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`
    const result = await this.db.query(query, [id])
    return result.rowCount > 0
  }

  async getStats(): Promise<SuggestionStats> {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
        COUNT(*) FILTER (WHERE status = 'ai_generated') as ai_generated_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count
      FROM ${this.tableName}
    `

    const pageStatsQuery = `
      SELECT page, COUNT(*) as count
      FROM ${this.tableName}
      GROUP BY page
      ORDER BY count DESC
    `

    const recentActivityQuery = `
      SELECT * FROM ${this.tableName}
      ORDER BY created_at DESC
      LIMIT 10
    `

    const [statsResult, pageStatsResult, recentActivityResult] = await Promise.all([
      this.db.query(statsQuery),
      this.db.query(pageStatsQuery),
      this.db.query(recentActivityQuery)
    ])

    const stats = statsResult.rows[0]
    
    const byStatus = {
      [SuggestionStatus.PENDING]: parseInt(stats.pending_count) || 0,
      [SuggestionStatus.PROCESSING]: parseInt(stats.processing_count) || 0,
      [SuggestionStatus.AI_GENERATED]: parseInt(stats.ai_generated_count) || 0,
      [SuggestionStatus.IN_PROGRESS]: parseInt(stats.in_progress_count) || 0,
      [SuggestionStatus.COMPLETED]: parseInt(stats.completed_count) || 0,
      [SuggestionStatus.REJECTED]: parseInt(stats.rejected_count) || 0
    }

    const byPage: Record<string, number> = {}
    for (const row of pageStatsResult.rows) {
      byPage[row.page] = parseInt(row.count)
    }

    const recentActivity = recentActivityResult.rows.map(row => 
      this.mapRowToSuggestion(row)
    )

    return {
      total: parseInt(stats.total) || 0,
      byStatus,
      byPage,
      recentActivity
    }
  }

  private mapRowToSuggestion(row: any): Suggestion {
    return {
      id: row.id,
      content: row.content,
      contact: row.contact || undefined,
      page: row.page,
      url: row.url,
      timestamp: row.timestamp,
      ip: row.ip,
      status: row.status as SuggestionStatus,
      aiInstructions: row.ai_instructions || undefined,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  async destroy(): Promise<void> {
    if (this.db) {
      await this.db.end()
      this.db = null
    }
  }

  // PostgreSQL specific utility methods
  async getConnectionStats() {
    if (!this.db) {
      return null
    }

    return {
      totalCount: this.db.totalCount,
      idleCount: this.db.idleCount,
      waitingCount: this.db.waitingCount
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1')
      return true
    } catch (error) {
      return false
    }
  }
}
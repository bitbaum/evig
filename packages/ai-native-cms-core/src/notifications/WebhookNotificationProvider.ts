import { NotificationProvider, NotificationPayload } from '../types'

interface WebhookConfig {
  url: string
  method?: 'POST' | 'PUT' | 'PATCH'
  headers?: Record<string, string>
  auth?: {
    type: 'bearer' | 'basic' | 'api-key'
    token?: string
    username?: string
    password?: string
    apiKey?: string
    apiKeyHeader?: string
  }
  timeout?: number
  retries?: number
  transformPayload?: (payload: NotificationPayload) => any
}

export class WebhookNotificationProvider implements NotificationProvider {
  public readonly name = 'webhook'
  private config: WebhookConfig

  constructor(config: WebhookConfig) {
    this.config = {
      method: 'POST',
      timeout: 10000,
      retries: 3,
      ...config
    }
  }

  configure(config: Record<string, any>): void {
    this.config = { ...this.config, ...config }
  }

  async send(notification: NotificationPayload): Promise<boolean> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= (this.config.retries || 3); attempt++) {
      try {
        const success = await this.sendWebhook(notification)
        if (success) {
          return true
        }
      } catch (error) {
        lastError = error as Error
        
        if (attempt < (this.config.retries || 3)) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    console.error(`Webhook notification failed after ${this.config.retries} attempts:`, lastError)
    return false
  }

  private async sendWebhook(notification: NotificationPayload): Promise<boolean> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Native-CMS/1.0',
      ...this.config.headers
    }

    // Add authentication headers
    if (this.config.auth) {
      switch (this.config.auth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${this.config.auth.token}`
          break
        
        case 'basic':
          const credentials = Buffer.from(`${this.config.auth.username}:${this.config.auth.password}`).toString('base64')
          headers['Authorization'] = `Basic ${credentials}`
          break
        
        case 'api-key':
          const apiKeyHeader = this.config.auth.apiKeyHeader || 'X-API-Key'
          headers[apiKeyHeader] = this.config.auth.apiKey!
          break
      }
    }

    // Transform payload if transformer provided
    let payload: any = notification
    if (this.config.transformPayload) {
      payload = this.config.transformPayload(notification)
    } else {
      payload = this.buildDefaultPayload(notification)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(this.config.url, {
        method: this.config.method,
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
      }

      return true
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error(`Webhook timeout after ${this.config.timeout}ms`)
      }
      
      throw error
    }
  }

  private buildDefaultPayload(notification: NotificationPayload): any {
    return {
      event: 'ai_native_cms_notification',
      type: notification.type,
      timestamp: new Date().toISOString(),
      subject: notification.subject,
      message: notification.message,
      recipients: notification.recipients,
      suggestion: {
        id: notification.suggestion.id,
        content: notification.suggestion.content,
        contact: notification.suggestion.contact,
        page: notification.suggestion.page,
        url: notification.suggestion.url,
        status: notification.suggestion.status,
        timestamp: notification.suggestion.timestamp,
        aiInstructions: notification.suggestion.aiInstructions,
        metadata: notification.suggestion.metadata
      },
      metadata: notification.metadata
    }
  }

  // Webhook-specific utility methods
  async testConnection(): Promise<boolean> {
    try {
      const testPayload = {
        event: 'ai_native_cms_test',
        message: 'Connection test from AI-Native CMS',
        timestamp: new Date().toISOString()
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Native-CMS/1.0',
        ...this.config.headers
      }

      // Add auth headers for test
      if (this.config.auth) {
        switch (this.config.auth.type) {
          case 'bearer':
            headers['Authorization'] = `Bearer ${this.config.auth.token}`
            break
          case 'basic':
            const credentials = Buffer.from(`${this.config.auth.username}:${this.config.auth.password}`).toString('base64')
            headers['Authorization'] = `Basic ${credentials}`
            break
          case 'api-key':
            const apiKeyHeader = this.config.auth.apiKeyHeader || 'X-API-Key'
            headers[apiKeyHeader] = this.config.auth.apiKey!
            break
        }
      }

      const response = await fetch(this.config.url, {
        method: this.config.method,
        headers,
        body: JSON.stringify(testPayload)
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  getConfig(): WebhookConfig {
    // Return config without sensitive data
    const { auth, ...safeConfig } = this.config
    return {
      ...safeConfig,
      auth: auth ? { type: auth.type } : undefined
    } as WebhookConfig
  }
}
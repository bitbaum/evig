// Main entry point for AI-Native CMS Core
export { AINativeCMS } from './core/AINativeCMS'

// Core types
export * from './types'

// Storage adapters
export * from './storage'

// AI instruction generators
export * from './ai'

// Notification providers
export * from './notifications'

// Utilities
export { RateLimiter } from './utils/RateLimiter'

// Default configuration helper
import { AINativeCMSConfig, SiteConfig } from './types'

export function createDefaultConfig(siteConfig: SiteConfig): AINativeCMSConfig {
  return {
    storage: {
      adapter: 'memory',
      config: {}
    },
    notifications: {
      providers: [
        {
          name: 'console',
          config: { verbose: true },
          enabled: true
        }
      ]
    },
    aiInstructions: {
      provider: 'template',
      config: {}
    },
    rateLimit: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 3 // 3 requests per window
    },
    site: siteConfig,
    ui: {
      theme: 'auto',
      position: 'bottom-right'
    }
  }
}

// Factory function for quick setup
export async function createAINativeCMS(config: AINativeCMSConfig) {
  const cms = new AINativeCMS(config)
  await cms.init()
  return cms
}
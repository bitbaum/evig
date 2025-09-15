import { NotificationProvider, AINativeCMSConfig } from '../types'
import { ConsoleNotificationProvider } from './ConsoleNotificationProvider'
import { EmailNotificationProvider, EmailConfig } from './EmailNotificationProvider'
import { SlackNotificationProvider, SlackConfig } from './SlackNotificationProvider'
import { DiscordNotificationProvider, DiscordConfig } from './DiscordNotificationProvider'
import { WebhookNotificationProvider, WebhookConfig } from './WebhookNotificationProvider'

export function createNotificationProviders(config: AINativeCMSConfig['notifications']): NotificationProvider[] {
  const providers: NotificationProvider[] = []

  for (const providerConfig of config.providers) {
    if (!providerConfig.enabled) {
      continue
    }

    let provider: NotificationProvider

    switch (providerConfig.name) {
      case 'console':
        provider = new ConsoleNotificationProvider()
        break
      
      case 'email':
        provider = new EmailNotificationProvider(providerConfig.config as EmailConfig)
        break
      
      case 'slack':
        provider = new SlackNotificationProvider(providerConfig.config as SlackConfig)
        break
      
      case 'discord':
        provider = new DiscordNotificationProvider(providerConfig.config as DiscordConfig)
        break
      
      case 'webhook':
        provider = new WebhookNotificationProvider(providerConfig.config as WebhookConfig)
        break
      
      case 'custom':
        if (!providerConfig.config.customProvider) {
          throw new Error(`Custom notification provider not provided for ${providerConfig.name}`)
        }
        provider = providerConfig.config.customProvider
        break
      
      default:
        console.warn(`Unknown notification provider: ${providerConfig.name}`)
        continue
    }

    provider.configure(providerConfig.config)
    providers.push(provider)
  }

  // Always include console provider as fallback if no providers configured
  if (providers.length === 0) {
    const consoleProvider = new ConsoleNotificationProvider()
    consoleProvider.configure({})
    providers.push(consoleProvider)
  }

  return providers
}

export * from './ConsoleNotificationProvider'
export * from './EmailNotificationProvider'
export * from './SlackNotificationProvider'
export * from './DiscordNotificationProvider'
export * from './WebhookNotificationProvider'
import { NotificationProvider, AINativeCMSConfig } from '../types'
import { ConsoleNotificationProvider } from './ConsoleNotificationProvider'
import { EmailNotificationProvider } from './EmailNotificationProvider'
import { SlackNotificationProvider } from './SlackNotificationProvider'
import { DiscordNotificationProvider } from './DiscordNotificationProvider'
import { WebhookNotificationProvider } from './WebhookNotificationProvider'

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
        provider = new EmailNotificationProvider(providerConfig.config)
        break
      
      case 'slack':
        provider = new SlackNotificationProvider(providerConfig.config)
        break
      
      case 'discord':
        provider = new DiscordNotificationProvider(providerConfig.config)
        break
      
      case 'webhook':
        provider = new WebhookNotificationProvider(providerConfig.config)
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
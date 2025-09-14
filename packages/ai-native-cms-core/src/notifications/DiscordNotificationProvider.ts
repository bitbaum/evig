import { NotificationProvider, NotificationPayload } from '../types'

interface DiscordConfig {
  webhookUrl: string
  username?: string
  avatarUrl?: string
  color?: number
}

export class DiscordNotificationProvider implements NotificationProvider {
  public readonly name = 'discord'
  private config: DiscordConfig

  constructor(config: DiscordConfig) {
    this.config = config
  }

  configure(config: Record<string, any>): void {
    this.config = { ...this.config, ...config }
  }

  async send(notification: NotificationPayload): Promise<boolean> {
    try {
      const discordMessage = this.buildDiscordMessage(notification)
      
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordMessage)
      })

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status} ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('Discord notification failed:', error)
      return false
    }
  }

  private buildDiscordMessage(notification: NotificationPayload): any {
    const { suggestion, type } = notification
    
    const message: any = {
      username: this.config.username || 'AI-Native CMS',
      avatar_url: this.config.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png',
      embeds: [
        {
          title: notification.subject,
          description: `User suggestion: "${suggestion.content}"`,
          color: this.config.color || this.getStatusColor(suggestion.status),
          url: suggestion.url,
          fields: [
            {
              name: 'Page',
              value: suggestion.page,
              inline: true
            },
            {
              name: 'Status',
              value: suggestion.status.replace('_', ' ').toUpperCase(),
              inline: true
            },
            {
              name: 'Contact',
              value: suggestion.contact || 'Anonymous',
              inline: true
            },
            {
              name: 'Time',
              value: new Date(suggestion.timestamp).toLocaleString(),
              inline: false
            }
          ],
          footer: {
            text: `AI-Native CMS | ID: ${suggestion.id}`,
            icon_url: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'
          },
          timestamp: new Date().toISOString()
        }
      ]
    }

    // Add AI instructions as a separate embed if available
    if (suggestion.aiInstructions) {
      message.embeds.push({
        title: '🤖 AI-Generated Instructions',
        description: '```\n' + this.truncateText(suggestion.aiInstructions, 2000) + '\n```',
        color: 0x36a64f
      })
    }

    // Add type-specific emoji to title
    const typeEmoji = this.getTypeEmoji(type)
    if (typeEmoji) {
      message.embeds[0].title = `${typeEmoji} ${message.embeds[0].title}`
    }

    return message
  }

  private getStatusColor(status: string): number {
    const colors: Record<string, number> = {
      pending: 0xffa500,      // Orange
      processing: 0x007bff,   // Blue
      ai_generated: 0x36a64f, // Green
      in_progress: 0x17a2b8,  // Cyan
      completed: 0x28a745,    // Green
      rejected: 0xdc3545      // Red
    }
    return colors[status] || 0x6c757d // Gray
  }

  private getTypeEmoji(type: string): string {
    const emojis: Record<string, string> = {
      new_suggestion: '💡',
      status_update: '🔄',
      ai_generated: '🤖'
    }
    return emojis[type] || '📝'
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength - 3) + '...'
  }

  // Discord-specific utility methods
  async testConnection(): Promise<boolean> {
    try {
      const testMessage = {
        username: this.config.username || 'AI-Native CMS',
        content: 'AI-Native CMS connection test',
        embeds: [
          {
            title: 'Connection Test',
            description: 'This is a test message from AI-Native CMS',
            color: 0x36a64f,
            timestamp: new Date().toISOString()
          }
        ]
      }

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage)
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  // Send simple text message to Discord
  async sendSimpleMessage(content: string): Promise<boolean> {
    try {
      const message = {
        username: this.config.username || 'AI-Native CMS',
        avatar_url: this.config.avatarUrl,
        content: content
      }

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      })

      return response.ok
    } catch (error) {
      console.error('Discord simple message failed:', error)
      return false
    }
  }

  // Send rich embed message
  async sendEmbedMessage(title: string, description: string, color?: number): Promise<boolean> {
    try {
      const message = {
        username: this.config.username || 'AI-Native CMS',
        avatar_url: this.config.avatarUrl,
        embeds: [
          {
            title,
            description,
            color: color || this.config.color || 0x36a64f,
            timestamp: new Date().toISOString()
          }
        ]
      }

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      })

      return response.ok
    } catch (error) {
      console.error('Discord embed message failed:', error)
      return false
    }
  }
}
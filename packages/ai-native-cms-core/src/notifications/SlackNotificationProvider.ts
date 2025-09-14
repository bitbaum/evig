import { NotificationProvider, NotificationPayload } from '../types'

interface SlackConfig {
  webhookUrl: string
  channel?: string
  username?: string
  iconEmoji?: string
  iconUrl?: string
}

export class SlackNotificationProvider implements NotificationProvider {
  public readonly name = 'slack'
  private config: SlackConfig

  constructor(config: SlackConfig) {
    this.config = config
  }

  configure(config: Record<string, any>): void {
    this.config = { ...this.config, ...config }
  }

  async send(notification: NotificationPayload): Promise<boolean> {
    try {
      const slackMessage = this.buildSlackMessage(notification)
      
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackMessage)
      })

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status} ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('Slack notification failed:', error)
      return false
    }
  }

  private buildSlackMessage(notification: NotificationPayload): any {
    const { suggestion, type } = notification
    
    const message: any = {
      channel: this.config.channel,
      username: this.config.username || 'AI-Native CMS',
      icon_emoji: this.config.iconEmoji || ':robot_face:',
    }

    if (this.config.iconUrl) {
      message.icon_url = this.config.iconUrl
      delete message.icon_emoji
    }

    // Create rich message with attachments
    message.attachments = [
      {
        color: this.getStatusColor(suggestion.status),
        title: notification.subject,
        title_link: suggestion.url,
        text: `User suggestion: "${suggestion.content}"`,
        fields: [
          {
            title: 'Page',
            value: suggestion.page,
            short: true
          },
          {
            title: 'Status', 
            value: suggestion.status.replace('_', ' ').toUpperCase(),
            short: true
          },
          {
            title: 'Contact',
            value: suggestion.contact || 'Anonymous',
            short: true
          },
          {
            title: 'Time',
            value: new Date(suggestion.timestamp).toLocaleString(),
            short: true
          }
        ],
        footer: 'AI-Native CMS',
        footer_icon: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png',
        ts: Math.floor(Date.now() / 1000)
      }
    ]

    // Add AI instructions as a separate attachment if available
    if (suggestion.aiInstructions) {
      message.attachments.push({
        color: '#36a64f',
        title: '🤖 AI-Generated Instructions',
        text: '```' + suggestion.aiInstructions + '```',
        mrkdwn_in: ['text']
      })
    }

    // Add action buttons
    message.attachments[0].actions = [
      {
        type: 'button',
        text: 'View Page',
        url: suggestion.url,
        style: 'primary'
      }
    ]

    if (suggestion.aiInstructions) {
      message.attachments[0].actions.push({
        type: 'button',
        text: 'Copy Instructions',
        style: 'default',
        value: 'copy_instructions'
      })
    }

    return message
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: '#ffa500',
      processing: '#007bff', 
      ai_generated: '#36a64f',
      in_progress: '#17a2b8',
      completed: '#28a745',
      rejected: '#danger'
    }
    return colors[status] || 'good'
  }

  // Slack-specific utility methods
  async testConnection(): Promise<boolean> {
    try {
      const testMessage = {
        text: 'AI-Native CMS connection test',
        channel: this.config.channel,
        username: this.config.username || 'AI-Native CMS'
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

  // Send simple text message to Slack
  async sendSimpleMessage(text: string, channel?: string): Promise<boolean> {
    try {
      const message = {
        text,
        channel: channel || this.config.channel,
        username: this.config.username || 'AI-Native CMS',
        icon_emoji: this.config.iconEmoji || ':robot_face:'
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
      console.error('Slack simple message failed:', error)
      return false
    }
  }
}
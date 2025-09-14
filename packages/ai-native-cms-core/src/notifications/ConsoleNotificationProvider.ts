import { NotificationProvider, NotificationPayload } from '../types'

export class ConsoleNotificationProvider implements NotificationProvider {
  public readonly name = 'console'
  private config: Record<string, any> = {}

  configure(config: Record<string, any>): void {
    this.config = config
  }

  async send(notification: NotificationPayload): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString()
      
      console.log('\n' + '='.repeat(60))
      console.log(`🔔 AI-NATIVE CMS NOTIFICATION - ${notification.type.toUpperCase()}`)
      console.log('='.repeat(60))
      console.log(`📅 Time: ${timestamp}`)
      console.log(`📧 Subject: ${notification.subject}`)
      
      if (notification.recipients && notification.recipients.length > 0) {
        console.log(`👥 Recipients: ${notification.recipients.join(', ')}`)
      }
      
      console.log('\n📝 Message:')
      console.log('-'.repeat(40))
      console.log(notification.message)
      console.log('-'.repeat(40))
      
      console.log('\n📊 Suggestion Details:')
      console.log(`   ID: ${notification.suggestion.id}`)
      console.log(`   Status: ${notification.suggestion.status}`)
      console.log(`   Page: ${notification.suggestion.page}`)
      console.log(`   URL: ${notification.suggestion.url}`)
      console.log(`   Contact: ${notification.suggestion.contact || 'Anonymous'}`)
      console.log(`   IP: ${notification.suggestion.ip}`)
      
      if (notification.suggestion.aiInstructions) {
        console.log('\n🤖 AI Instructions:')
        console.log('-'.repeat(40))
        console.log(notification.suggestion.aiInstructions)
        console.log('-'.repeat(40))
      }
      
      if (notification.metadata) {
        console.log('\n📋 Metadata:')
        console.log(JSON.stringify(notification.metadata, null, 2))
      }
      
      console.log('='.repeat(60) + '\n')
      
      return true
    } catch (error) {
      console.error('Console notification failed:', error)
      return false
    }
  }

  // Optional lifecycle methods
  async init?(): Promise<void> {
    if (this.config.verbose) {
      console.log('✅ Console notification provider initialized')
    }
  }

  async destroy?(): Promise<void> {
    if (this.config.verbose) {
      console.log('🔄 Console notification provider destroyed')
    }
  }
}
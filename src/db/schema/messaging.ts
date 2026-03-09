import { pgTable, uuid, text, boolean, timestamp, integer, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './auth'

// =============================================================================
// CONVERSATIONS
// =============================================================================
// Direct, appointment, marketplace, service, and IT-Hilfe conversation threads.
// Participants are ordered (participant_1 < participant_2) to enforce uniqueness.
// CHECK (type IN ('direct','appointment','marketplace','service','it_hilfe')) — validated at app layer
// CHECK (participant_1 != participant_2) — validated at app layer
// CHECK (participant_1 < participant_2) — validated at app layer

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title'),
  // Final CHECK from 014: 'direct','appointment','marketplace','service','it_hilfe'
  type: text('type').notNull(),
  contextId: text('context_id'),

  // Participants
  participant1: uuid('participant_1').notNull().references(() => users.id, { onDelete: 'cascade' }),
  participant2: uuid('participant_2').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Metadata
  lastMessageAt: timestamp('last_message_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  lastMessagePreview: text('last_message_preview'),
  unreadCount1: integer('unread_count_1').default(0),
  unreadCount2: integer('unread_count_2').default(0),

  // Status
  isActive: boolean('is_active').default(true),
  archivedBy1: boolean('archived_by_1').default(false),
  archivedBy2: boolean('archived_by_2').default(false),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_conversations_participants').on(table.participant1, table.participant2),
  index('idx_conversations_type_context').on(table.type, table.contextId),
  index('idx_conversations_last_message').on(table.lastMessageAt),
  index('idx_conversations_active').on(table.isActive),
  uniqueIndex('conversations_participant_1_participant_2_type_context_id_key')
    .on(table.participant1, table.participant2, table.type, table.contextId),
])

export type Conversation = typeof conversations.$inferSelect
export type NewConversation = typeof conversations.$inferInsert

// =============================================================================
// MESSAGES
// =============================================================================
// Individual messages within conversations.
// CHECK (message_type IN ('text','image','file','system')) — validated at app layer
// CHECK (delivery_status IN ('sent','delivered','read','failed')) — validated at app layer

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),

  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientId: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  content: text('content').notNull(),
  messageType: text('message_type').default('text'),

  // Attachments
  attachmentUrl: text('attachment_url'),
  attachmentName: text('attachment_name'),
  attachmentSize: integer('attachment_size'),

  // Status
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at', { withTimezone: true, mode: 'string' }),

  // Delivery
  deliveryStatus: text('delivery_status').default('sent'),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_messages_conversation').on(table.conversationId),
  index('idx_messages_sender').on(table.senderId),
  index('idx_messages_recipient').on(table.recipientId),
  index('idx_messages_created').on(table.createdAt),
  index('idx_messages_unread').on(table.recipientId, table.isRead),
])

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

// =============================================================================
// MESSAGE REACTIONS
// =============================================================================

export const messageReactions = pgTable('message_reactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reaction: text('reaction').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  uniqueIndex('message_reactions_message_id_user_id_reaction_key')
    .on(table.messageId, table.userId, table.reaction),
])

export type MessageReaction = typeof messageReactions.$inferSelect
export type NewMessageReaction = typeof messageReactions.$inferInsert

// =============================================================================
// NOTIFICATIONS
// =============================================================================
// Final CHECK from migration 040:
// type IN ('message','appointment','marketplace','system','marketing',
//          'task_attention','task_request','task_request_response','task_completed','task_broadcast',
//          'decision_voting','decision_closed','protocol_finalized')
// — validated at app layer

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),

  // Related entity
  relatedType: text('related_type'),
  relatedId: text('related_id'),

  // Delivery methods
  sentEmail: boolean('sent_email').default(false),
  sentSms: boolean('sent_sms').default(false),
  sentInApp: boolean('sent_in_app').default(false),

  // Status
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at', { withTimezone: true, mode: 'string' }),

  // Scheduling
  scheduledFor: timestamp('scheduled_for', { withTimezone: true, mode: 'string' }),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index('idx_notifications_user').on(table.userId),
  index('idx_notifications_type').on(table.type),
  index('idx_notifications_read').on(table.isRead),
  index('idx_notifications_scheduled').on(table.scheduledFor),
])

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert

// =============================================================================
// USER NOTIFICATION PREFERENCES
// =============================================================================

export const userNotificationPreferences = pgTable('user_notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),

  // Email notifications
  emailNewMessages: boolean('email_new_messages').default(true),
  emailAppointmentUpdates: boolean('email_appointment_updates').default(true),
  emailMarketplaceUpdates: boolean('email_marketplace_updates').default(true),

  // In-app notifications
  inAppMessages: boolean('in_app_messages').default(true),
  inAppAppointments: boolean('in_app_appointments').default(true),
  inAppMarketplace: boolean('in_app_marketplace').default(true),

  // SMS notifications
  smsUrgentMessages: boolean('sms_urgent_messages').default(false),
  smsAppointmentReminders: boolean('sms_appointment_reminders').default(false),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export type UserNotificationPreference = typeof userNotificationPreferences.$inferSelect
export type NewUserNotificationPreference = typeof userNotificationPreferences.$inferInsert

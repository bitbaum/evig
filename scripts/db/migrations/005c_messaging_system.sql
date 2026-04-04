-- Migration: 005_messaging_system
-- Description: Real-time messaging system for buyer-seller and customer-repairer communication

-- ============================================================================
-- MESSAGING SYSTEM
-- ============================================================================

-- Conversations table - represents a conversation thread
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT, -- Optional title for the conversation
    type TEXT NOT NULL CHECK (type IN ('direct', 'appointment', 'marketplace', 'service')),
    context_id TEXT, -- ID of related entity (appointment_id, marketplace_listing_id, etc.)

    -- Participants
    participant_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Metadata
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_message_preview TEXT,
    unread_count_1 INTEGER DEFAULT 0, -- Unread messages for participant_1
    unread_count_2 INTEGER DEFAULT 0, -- Unread messages for participant_2

    -- Status
    is_active BOOLEAN DEFAULT true,
    archived_by_1 BOOLEAN DEFAULT false,
    archived_by_2 BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure participants are different and ordered consistently
    CONSTRAINT different_participants CHECK (participant_1 != participant_2),
    CONSTRAINT ordered_participants CHECK (participant_1 < participant_2),

    UNIQUE(participant_1, participant_2, type, context_id)
);

-- Messages table - individual messages within conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),

    -- Attachments (optional)
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_size INTEGER,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Delivery status
    delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message reactions (optional feature)
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL, -- emoji or reaction type

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(message_id, user_id, reaction)
);

-- ============================================================================
-- NOTIFICATION SYSTEM INTEGRATION
-- ============================================================================

-- Notification preferences for users
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Email notifications
    email_new_messages BOOLEAN DEFAULT true,
    email_appointment_updates BOOLEAN DEFAULT true,
    email_marketplace_updates BOOLEAN DEFAULT true,

    -- In-app notifications
    in_app_messages BOOLEAN DEFAULT true,
    in_app_appointments BOOLEAN DEFAULT true,
    in_app_marketplace BOOLEAN DEFAULT true,

    -- SMS notifications (for urgent matters)
    sms_urgent_messages BOOLEAN DEFAULT false,
    sms_appointment_reminders BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

-- Notification history
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type TEXT NOT NULL CHECK (type IN ('message', 'appointment', 'marketplace', 'system', 'marketing')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,

    -- Related entity
    related_type TEXT, -- 'conversation', 'appointment', 'marketplace_listing', etc.
    related_id TEXT,

    -- Delivery methods
    sent_email BOOLEAN DEFAULT false,
    sent_sms BOOLEAN DEFAULT false,
    sent_in_app BOOLEAN DEFAULT false,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Scheduling (for delayed notifications)
    scheduled_for TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_type_context ON conversations(type, context_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_active ON conversations(is_active);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = false;

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- ============================================================================
-- UPDATED AT TRIGGERS
-- ============================================================================

-- Add updated_at triggers for new tables
DO $$
DECLARE
    tbl_name text;
    trigger_name text;
BEGIN
    -- List of tables that need updated_at triggers
    FOR tbl_name IN
        SELECT unnest(ARRAY[
            'conversations', 'messages', 'message_reactions',
            'user_notification_preferences', 'notifications'
        ])
    LOOP
        trigger_name := 'update_' || tbl_name || '_updated_at';

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name) AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl_name AND column_name = 'updated_at') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = trigger_name) THEN
                EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', trigger_name, tbl_name);
            END IF;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- DEFAULT NOTIFICATION PREFERENCES
-- ============================================================================

-- Insert default notification preferences for existing users
INSERT INTO user_notification_preferences (
    user_id, email_new_messages, email_appointment_updates, email_marketplace_updates,
    in_app_messages, in_app_appointments, in_app_marketplace
)
SELECT
    id,
    true, true, true,  -- email preferences
    true, true, true   -- in-app preferences
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- SYSTEM CONVERSATIONS FOR EXISTING APPOINTMENTS
-- ============================================================================

-- Create conversations for existing service appointments
INSERT INTO conversations (
    title,
    type,
    context_id,
    participant_1,
    participant_2,
    last_message_at,
    last_message_preview
)
SELECT
    CONCAT('Service: ', st.name),
    'appointment',
    sa.id::text,
    -- Ensure consistent ordering of participants
    CASE WHEN sa.user_id < '00000000-0000-0000-0000-000000000000'::uuid THEN sa.user_id ELSE '00000000-0000-0000-0000-000000000000'::uuid END,
    CASE WHEN sa.user_id < '00000000-0000-0000-0000-000000000000'::uuid THEN '00000000-0000-0000-0000-000000000000'::uuid ELSE sa.user_id END,
    sa.created_at,
    COALESCE(sa.description, 'Neue Service-Anfrage')
FROM service_appointments sa
JOIN service_types st ON sa.service_type_id = st.id
-- Only create if participants are different (avoid self-conversations)
WHERE sa.user_id != '00000000-0000-0000-0000-000000000000'::uuid
ON CONFLICT (participant_1, participant_2, type, context_id) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update conversation metadata when a new message is added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update conversation's last message info
    UPDATE conversations
    SET
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        -- Update unread counts
        unread_count_1 = CASE
            WHEN participant_1 = NEW.recipient_id THEN unread_count_1 + 1
            ELSE unread_count_1
        END,
        unread_count_2 = CASE
            WHEN participant_2 = NEW.recipient_id THEN unread_count_2 + 1
            ELSE unread_count_2
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation when messages are added
CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Function to reset unread count when messages are marked as read
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        UPDATE conversations
        SET
            unread_count_1 = CASE
                WHEN participant_1 = NEW.recipient_id THEN GREATEST(unread_count_1 - 1, 0)
                ELSE unread_count_1
            END,
            unread_count_2 = CASE
                WHEN participant_2 = NEW.recipient_id THEN GREATEST(unread_count_2 - 1, 0)
                ELSE unread_count_2
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conversation_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reset unread count when messages are read
CREATE TRIGGER trigger_reset_unread_count
    AFTER UPDATE OF is_read ON messages
    FOR EACH ROW
    EXECUTE FUNCTION reset_unread_count();




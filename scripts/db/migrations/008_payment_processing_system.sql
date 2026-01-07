-- Migration: 008_payment_processing_system
-- Description: Comprehensive payment processing system for RevampIT with escrow, invoices, refunds, and multi-currency support

-- ============================================================================
-- PAYMENT PROCESSING SYSTEM
-- ============================================================================

-- Payment providers table
CREATE TABLE IF NOT EXISTS payment_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('stripe', 'paypal', 'bank_transfer', 'crypto')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    config JSONB DEFAULT '{}', -- Provider-specific configuration (API keys, etc.)
    supported_currencies TEXT[] DEFAULT ARRAY['CHF', 'EUR'],
    test_mode BOOLEAN NOT NULL DEFAULT true,
    fee_percentage DECIMAL(5,4) DEFAULT 0.0000, -- e.g., 0.029 for 2.9%
    fee_fixed_cents INTEGER DEFAULT 0, -- Fixed fee in cents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods table (stored customer payment methods)
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES payment_providers(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'sepa', 'paypal', 'bank_account')),
    provider_payment_method_id VARCHAR(255) NOT NULL, -- Stripe payment method ID, etc.
    last_four VARCHAR(4), -- Last 4 digits of card
    expiry_month INTEGER,
    expiry_year INTEGER,
    card_brand VARCHAR(20), -- visa, mastercard, etc.
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}', -- Additional provider-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider_payment_method_id)
);

-- Payment transactions table (detailed transaction records)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES payment_providers(id),

    -- Transaction details
    provider_transaction_id VARCHAR(255) UNIQUE, -- Stripe payment intent ID, etc.
    type VARCHAR(30) NOT NULL CHECK (type IN ('payment', 'refund', 'chargeback', 'payout', 'fee', 'transfer')),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'disputed')),

    -- Financial details
    amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'CHF',
    fee_cents BIGINT DEFAULT 0,
    net_amount_cents BIGINT DEFAULT 0, -- Amount after fees

    -- Related entities
    order_id UUID REFERENCES orders(id),
    service_appointment_id UUID REFERENCES service_appointments(id),
    workshop_registration_id UUID REFERENCES workshop_registrations(id),

    -- Payment method used
    payment_method_id UUID REFERENCES payment_methods(id),

    -- Escrow information
    escrow_release_date TIMESTAMP WITH TIME ZONE,
    escrow_released BOOLEAN NOT NULL DEFAULT false,
    escrow_release_reason TEXT,

    -- Provider response data
    provider_response JSONB DEFAULT '{}',
    failure_reason TEXT,

    -- Metadata and notes
    description TEXT,
    internal_notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Escrow accounts table (funds held in trust)
CREATE TABLE IF NOT EXISTS escrow_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,

    -- Escrow details
    total_amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'CHF',
    held_amount_cents BIGINT NOT NULL DEFAULT 0,
    released_amount_cents BIGINT NOT NULL DEFAULT 0,

    -- Release conditions
    release_conditions JSONB DEFAULT '{}', -- e.g., {"service_completed": true, "customer_approved": true}
    auto_release_days INTEGER DEFAULT 7, -- Days after which funds auto-release
    release_deadline TIMESTAMP WITH TIME ZONE,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'disputed', 'cancelled')),

    -- Related parties
    buyer_id UUID NOT NULL REFERENCES users(id), -- Customer
    seller_id UUID REFERENCES users(id), -- Service provider/repairer

    -- Release tracking
    released_at TIMESTAMP WITH TIME ZONE,
    released_by UUID REFERENCES users(id),
    release_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Escrow releases table (track partial or full releases)
CREATE TABLE IF NOT EXISTS escrow_releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escrow_account_id UUID NOT NULL REFERENCES escrow_accounts(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES payment_transactions(id), -- The release transaction

    amount_cents BIGINT NOT NULL,
    release_type VARCHAR(20) NOT NULL CHECK (release_type IN ('full', 'partial', 'refund', 'dispute')),
    reason TEXT,

    released_by UUID NOT NULL REFERENCES users(id),
    released_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,

    -- Invoice details
    type VARCHAR(20) NOT NULL CHECK (type IN ('service', 'product', 'refund', 'credit_note')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),

    -- Related entities
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    service_appointment_id UUID REFERENCES service_appointments(id),
    workshop_registration_id UUID REFERENCES workshop_registrations(id),

    -- Financial details
    subtotal_cents BIGINT NOT NULL DEFAULT 0,
    tax_cents BIGINT NOT NULL DEFAULT 0,
    discount_cents BIGINT NOT NULL DEFAULT 0,
    total_cents BIGINT NOT NULL,

    currency VARCHAR(3) NOT NULL DEFAULT 'CHF',
    tax_rate DECIMAL(5,4) DEFAULT 0.0770, -- Swiss VAT rate (7.7%)

    -- Invoice data
    line_items JSONB DEFAULT '[]', -- Detailed line items
    billing_address JSONB,
    shipping_address JSONB,

    -- Dates
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- PDF and delivery
    pdf_url TEXT,
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    emailed_at TIMESTAMP WITH TIME ZONE,
    email_recipient VARCHAR(255),

    -- Notes
    notes TEXT,
    payment_terms TEXT DEFAULT 'Payment due within 30 days',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_number VARCHAR(50) NOT NULL UNIQUE,

    -- Original transaction
    original_transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
    refund_transaction_id UUID REFERENCES payment_transactions(id),

    -- Refund details
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'CHF',
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('customer_request', 'service_cancelled', 'service_not_completed', 'duplicate_charge', 'fraud', 'other')),
    reason_details TEXT,

    -- Status and processing
    status VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    processed_by UUID REFERENCES users(id),

    -- Invoice
    invoice_id UUID REFERENCES invoices(id),

    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Notes
    internal_notes TEXT,
    customer_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Disputes table (payment disputes and chargebacks)
CREATE TABLE IF NOT EXISTS payment_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_number VARCHAR(50) NOT NULL UNIQUE,

    -- Related transaction
    transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
    provider_dispute_id VARCHAR(255), -- Stripe dispute ID, etc.

    -- Dispute details
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'CHF',
    reason VARCHAR(50) NOT NULL, -- Provider-specific dispute reason
    status VARCHAR(20) NOT NULL DEFAULT 'opened' CHECK (status IN ('opened', 'under_review', 'won', 'lost', 'cancelled')),

    -- Evidence and response
    evidence JSONB DEFAULT '{}',
    response TEXT,
    response_deadline TIMESTAMP WITH TIME ZONE,

    -- Resolution
    resolution VARCHAR(20) CHECK (resolution IN ('won', 'lost', 'cancelled')),
    resolution_amount_cents BIGINT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),

    -- Related refund if applicable
    refund_id UUID REFERENCES refunds(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment analytics table (for reporting and dashboard)
CREATE TABLE IF NOT EXISTS payment_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    provider_id UUID REFERENCES payment_providers(id),

    -- Daily totals
    total_transactions INTEGER DEFAULT 0,
    total_volume_cents BIGINT DEFAULT 0,
    total_fees_cents BIGINT DEFAULT 0,
    total_refunds_cents BIGINT DEFAULT 0,

    -- Currency breakdown
    currency_totals JSONB DEFAULT '{}', -- e.g., {"CHF": 100000, "EUR": 50000}

    -- Status breakdown
    status_breakdown JSONB DEFAULT '{}', -- e.g., {"succeeded": 45, "failed": 2}

    -- Type breakdown
    type_breakdown JSONB DEFAULT '{}', -- e.g., {"payment": 40, "refund": 5}

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(date, provider_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Payment providers
CREATE INDEX IF NOT EXISTS idx_payment_providers_type ON payment_providers(type);
CREATE INDEX IF NOT EXISTS idx_payment_providers_active ON payment_providers(is_active);

-- Payment methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_provider ON payment_methods(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;

-- Payment transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_type ON payment_transactions(type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_tx_id ON payment_transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_service_apt ON payment_transactions(service_appointment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_workshop_reg ON payment_transactions(workshop_registration_id);

-- Escrow accounts
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_transaction_id ON escrow_accounts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_buyer_id ON escrow_accounts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_seller_id ON escrow_accounts(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_status ON escrow_accounts(status);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_release_deadline ON escrow_accounts(release_deadline);

-- Escrow releases
CREATE INDEX IF NOT EXISTS idx_escrow_releases_escrow_account_id ON escrow_releases(escrow_account_id);
CREATE INDEX IF NOT EXISTS idx_escrow_releases_transaction_id ON escrow_releases(transaction_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_service_apt ON invoices(service_appointment_id);

-- Refunds
CREATE INDEX IF NOT EXISTS idx_refunds_original_transaction ON refunds(original_transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_refund_transaction ON refunds(refund_transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requested_by ON refunds(requested_by);

-- Payment disputes
CREATE INDEX IF NOT EXISTS idx_payment_disputes_transaction_id ON payment_disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_provider_dispute_id ON payment_disputes(provider_dispute_id);

-- Payment analytics
CREATE INDEX IF NOT EXISTS idx_payment_analytics_date ON payment_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_analytics_provider ON payment_analytics(provider_id);

-- ============================================================================
-- UPDATED AT TRIGGERS
-- ============================================================================

DO $$
DECLARE
    tbl_name text;
    trigger_name text;
BEGIN
    -- List of tables that need updated_at triggers
    FOR tbl_name IN
        SELECT unnest(ARRAY[
            'payment_providers', 'payment_methods', 'payment_transactions',
            'escrow_accounts', 'escrow_releases', 'invoices', 'refunds',
            'payment_disputes', 'payment_analytics'
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
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate escrow release deadline
CREATE OR REPLACE FUNCTION calculate_escrow_release_deadline(
    transaction_date TIMESTAMP WITH TIME ZONE,
    auto_release_days INTEGER DEFAULT 7
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN transaction_date + INTERVAL '1 day' * auto_release_days;
END;
$$ LANGUAGE plpgsql;

-- Function to update payment analytics
CREATE OR REPLACE FUNCTION update_payment_analytics(
    transaction_date DATE,
    provider_id UUID,
    transaction_type VARCHAR(30),
    amount_cents BIGINT,
    fee_cents BIGINT DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'CHF'
) RETURNS VOID AS $$
DECLARE
    analytics_record RECORD;
BEGIN
    -- Get or create analytics record for the date
    SELECT * INTO analytics_record
    FROM payment_analytics
    WHERE date = transaction_date AND (provider_id IS NULL OR payment_analytics.provider_id = update_payment_analytics.provider_id)
    LIMIT 1;

    IF analytics_record IS NULL THEN
        INSERT INTO payment_analytics (date, provider_id, total_transactions, total_volume_cents, total_fees_cents, currency_totals, type_breakdown)
        VALUES (
            transaction_date,
            provider_id,
            1,
            amount_cents,
            fee_cents,
            jsonb_build_object(currency, amount_cents),
            jsonb_build_object(transaction_type, 1)
        );
    ELSE
        UPDATE payment_analytics
        SET
            total_transactions = total_transactions + 1,
            total_volume_cents = total_volume_cents + amount_cents,
            total_fees_cents = total_fees_cents + fee_cents,
            currency_totals = jsonb_set(
                COALESCE(currency_totals, '{}'),
                ARRAY[currency],
                (COALESCE(currency_totals->>currency, '0')::bigint + amount_cents)::text::jsonb
            ),
            type_breakdown = jsonb_set(
                COALESCE(type_breakdown, '{}'),
                ARRAY[transaction_type],
                (COALESCE(type_breakdown->>transaction_type, '0')::integer + 1)::text::jsonb
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = analytics_record.id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS TEXT AS $$
DECLARE
    invoice_num TEXT;
    current_year TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    invoice_num := 'INV-' || current_year || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 6, '0');
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Create sequence for refund numbers
CREATE SEQUENCE IF NOT EXISTS refund_number_seq START 1;

-- Function to create refund number
CREATE OR REPLACE FUNCTION generate_refund_number() RETURNS TEXT AS $$
DECLARE
    refund_num TEXT;
    current_year TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    refund_num := 'REF-' || current_year || '-' || LPAD(NEXTVAL('refund_number_seq')::TEXT, 6, '0');
    RETURN refund_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert default payment providers
INSERT INTO payment_providers (slug, name, type, supported_currencies, test_mode, fee_percentage, fee_fixed_cents, config)
VALUES
    ('stripe', 'Stripe', 'stripe', ARRAY['CHF', 'EUR', 'USD'], true, 0.029, 30, '{"default_currency": "CHF", "eur_conversion_rate": 0.95}'),
    ('paypal', 'PayPal', 'paypal', ARRAY['CHF', 'EUR', 'USD'], true, 0.034, 49, '{"default_currency": "CHF", "eur_conversion_rate": 0.94}')
ON CONFLICT (slug) DO NOTHING;

-- Sample payment method for testing
-- This would normally be created through the payment flow
-- INSERT INTO payment_methods (user_id, provider_id, type, provider_payment_method_id, last_four, card_brand)
-- VALUES (
--     (SELECT id FROM users LIMIT 1),
--     (SELECT id FROM payment_providers WHERE slug = 'stripe'),
--     'card',
--     'pm_test_card',
--     '4242',
--     'visa'
-- );

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- View for payment transaction summary
CREATE OR REPLACE VIEW payment_transaction_summary AS
SELECT
    pt.id,
    pt.provider_transaction_id,
    pt.type,
    pt.status,
    pt.amount_cents / 100.0 as amount,
    pt.currency,
    pt.fee_cents / 100.0 as fee,
    pt.net_amount_cents / 100.0 as net_amount,
    pt.created_at,
    pt.processed_at,
    u.name as user_name,
    u.email as user_email,
    pp.name as provider_name,
    CASE
        WHEN pt.order_id IS NOT NULL THEN 'Order'
        WHEN pt.service_appointment_id IS NOT NULL THEN 'Service Appointment'
        WHEN pt.workshop_registration_id IS NOT NULL THEN 'Workshop Registration'
        ELSE 'Standalone'
    END as transaction_context
FROM payment_transactions pt
JOIN users u ON pt.user_id = u.id
JOIN payment_providers pp ON pt.provider_id = pp.id;

-- View for escrow account summary
CREATE OR REPLACE VIEW escrow_account_summary AS
SELECT
    ea.id,
    ea.total_amount_cents / 100.0 as total_amount,
    ea.currency,
    ea.held_amount_cents / 100.0 as held_amount,
    ea.released_amount_cents / 100.0 as released_amount,
    ea.status,
    ea.release_deadline,
    ea.created_at,
    b.name as buyer_name,
    b.email as buyer_email,
    s.name as seller_name,
    s.email as seller_email,
    pt.provider_transaction_id
FROM escrow_accounts ea
JOIN users b ON ea.buyer_id = b.id
LEFT JOIN users s ON ea.seller_id = s.id
JOIN payment_transactions pt ON ea.transaction_id = pt.id;

-- View for invoice summary
CREATE OR REPLACE VIEW invoice_summary AS
SELECT
    i.id,
    i.invoice_number,
    i.type,
    i.status,
    i.total_cents / 100.0 as total,
    i.currency,
    i.issue_date,
    i.due_date,
    i.paid_at,
    u.name as customer_name,
    u.email as customer_email,
    CASE
        WHEN i.order_id IS NOT NULL THEN 'Order'
        WHEN i.service_appointment_id IS NOT NULL THEN 'Service Appointment'
        WHEN i.workshop_registration_id IS NOT NULL THEN 'Workshop Registration'
        ELSE 'Standalone'
    END as invoice_context
FROM invoices i
JOIN users u ON i.user_id = u.id;
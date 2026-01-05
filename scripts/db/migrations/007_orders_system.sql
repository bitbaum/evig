-- Migration: 007_orders_system
-- Description: Order management system for marketplace transactions

-- ============================================================================
-- ORDERS SYSTEM
-- ============================================================================

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Order status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    status_history JSONB DEFAULT '[]', -- Track status changes with timestamps

    -- Payment information
    payment_intent_id TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method TEXT, -- 'stripe', 'paypal', etc.

    -- Pricing
    subtotal_cents BIGINT NOT NULL DEFAULT 0,
    tax_cents BIGINT NOT NULL DEFAULT 0,
    shipping_cents BIGINT NOT NULL DEFAULT 0,
    discount_cents BIGINT NOT NULL DEFAULT 0,
    total_amount_cents BIGINT NOT NULL,

    currency TEXT NOT NULL DEFAULT 'CHF',

    -- Shipping
    shipping_address JSONB,
    shipping_method TEXT,
    tracking_number TEXT,
    estimated_delivery DATE,

    -- Seller information (for marketplace orders)
    seller_id UUID REFERENCES users(id),

    -- Medusa integration
    medusa_order_id TEXT,
    medusa_cart_id TEXT,

    -- Notes
    customer_notes TEXT,
    internal_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Product information
    product_title TEXT NOT NULL,
    product_sku TEXT,
    medusa_variant_id TEXT,
    inventory_item_id UUID REFERENCES inventory_items(id),

    -- Quantity and pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents BIGINT NOT NULL,
    total_price_cents BIGINT NOT NULL,

    -- Product metadata
    product_metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order status history table (optional, can be derived from status_history JSONB)
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_inventory_item ON order_items(inventory_item_id);

-- Order status history indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);

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
            'orders'
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
-- ORDER STATUS MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to update order status with history tracking
CREATE OR REPLACE FUNCTION update_order_status(
    order_id UUID,
    new_status TEXT,
    changed_by UUID DEFAULT NULL,
    notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    old_status TEXT;
BEGIN
    -- Get current status
    SELECT status INTO old_status FROM orders WHERE id = order_id;

    IF old_status IS NULL THEN
        RETURN FALSE;
    END IF;

    IF old_status = new_status THEN
        RETURN TRUE; -- No change needed
    END IF;

    -- Update order status
    UPDATE orders
    SET
        status = new_status,
        updated_at = CURRENT_TIMESTAMP,
        status_history = status_history || jsonb_build_object(
            'status', new_status,
            'timestamp', CURRENT_TIMESTAMP,
            'changed_by', changed_by,
            'notes', notes
        )
    WHERE id = order_id;

    -- Insert status history record
    INSERT INTO order_status_history (
        order_id, old_status, new_status, changed_by, notes
    ) VALUES (
        order_id, old_status, new_status, changed_by, notes
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (Optional)
-- ============================================================================

-- Sample order (uncomment to test)
-- INSERT INTO orders (
--     user_id, status, total_amount_cents, currency, payment_status
-- ) VALUES (
--     (SELECT id FROM users LIMIT 1),
--     'completed',
--     100000,
--     'CHF',
--     'paid'
-- );
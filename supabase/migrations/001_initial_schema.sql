-- ====================================================================
-- Parijat Society Management ERP - Comprehensive Database Migration
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SOCIETIES
CREATE TABLE IF NOT EXISTS societies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Pune',
    state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
    pincode VARCHAR(20) NOT NULL DEFAULT '411038',
    email VARCHAR(255) NOT NULL DEFAULT 'parijatsociety@gmail.com',
    contact_number VARCHAR(50),
    financial_year VARCHAR(50) NOT NULL DEFAULT '2026-2027',
    opening_balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    opening_balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. FLOORS
CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    floor_name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (society_id, floor_number)
);

-- 3. FLATS
CREATE TABLE IF NOT EXISTS flats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE RESTRICT,
    flat_number VARCHAR(50) NOT NULL,
    flat_type VARCHAR(50) DEFAULT '2BHK',
    area_sqft DECIMAL(10, 2) DEFAULT 850.00,
    maintenance_override DECIMAL(10, 2) DEFAULT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OCCUPIED' CHECK (status IN ('OCCUPIED', 'VACANT', 'INACTIVE')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (society_id, flat_number)
);

-- 4. RESIDENTS (Active primary occupant)
CREATE TABLE IF NOT EXISTS residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    resident_type VARCHAR(20) NOT NULL CHECK (resident_type IN ('OWNER', 'TENANT')),
    email VARCHAR(255),
    mobile VARCHAR(50) NOT NULL,
    alternate_mobile VARCHAR(50),
    move_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
    move_out_date DATE DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. FLAT_RESIDENT_HISTORY (Preserves historical occupants and ownership)
CREATE TABLE IF NOT EXISTS flat_resident_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
    resident_name VARCHAR(255) NOT NULL,
    resident_type VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    mobile VARCHAR(50),
    move_in_date DATE,
    move_out_date DATE,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- 6. MAINTENANCE SETTINGS
CREATE TABLE IF NOT EXISTS maintenance_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    monthly_amount DECIMAL(10, 2) NOT NULL DEFAULT 1100.00,
    due_day_of_month INT NOT NULL DEFAULT 10,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    late_fee_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    late_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    reminder_days INT[] NOT NULL DEFAULT '{5,10,15,20,25,30}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. MAINTENANCE RATE HISTORY
CREATE TABLE IF NOT EXISTS maintenance_rate_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE DEFAULT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. MAINTENANCE INVOICES (Month-wise bills)
CREATE TABLE IF NOT EXISTS maintenance_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    invoice_amount DECIMAL(10, 2) NOT NULL DEFAULT 1100.00,
    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    due_amount DECIMAL(10, 2) NOT NULL DEFAULT 1100.00,
    status VARCHAR(30) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('PAID', 'UNPAID', 'PARTIAL', 'ADVANCE_COVERED')),
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (flat_id, month, year)
);

-- 9. MAINTENANCE PAYMENTS (Receipts & Inflows)
CREATE TABLE IF NOT EXISTS maintenance_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    total_amount_received DECIMAL(10, 2) NOT NULL CHECK (total_amount_received > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('CASH', 'ONLINE_UPI', 'ONLINE_NEFT', 'ONLINE_BANK', 'CHEQUE')),
    transaction_ref VARCHAR(100),
    description TEXT,
    created_by VARCHAR(100) DEFAULT 'admin@gmail.com',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PAYMENT ALLOCATIONS (Links receipt to specific month invoices)
CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES maintenance_payments(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES maintenance_invoices(id) ON DELETE CASCADE,
    allocated_amount DECIMAL(10, 2) NOT NULL CHECK (allocated_amount > 0),
    allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ADVANCE BALANCES (Advance pool per flat)
CREATE TABLE IF NOT EXISTS advance_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE UNIQUE,
    total_advance_received DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    advance_utilized DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    current_advance_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ADVANCE ADJUSTMENTS (Logs each month-to-month exhaustion)
CREATE TABLE IF NOT EXISTS advance_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES maintenance_invoices(id) ON DELETE CASCADE,
    adjusted_amount DECIMAL(10, 2) NOT NULL,
    adjusted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. SOCIETY EXPENSES
CREATE TABLE IF NOT EXISTS society_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'ONLINE' CHECK (payment_method IN ('CASH', 'ONLINE', 'CHEQUE')),
    vendor_name VARCHAR(255),
    invoice_bill_no VARCHAR(100),
    attachment_url TEXT,
    description TEXT,
    created_by VARCHAR(100) DEFAULT 'admin@gmail.com',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. WALLET TRANSACTIONS (Central Immutable Financial Ledger)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('CREDIT', 'DEBIT')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('MAINTENANCE', 'EXPENSE', 'OPENING_BALANCE', 'OTHER_INCOME')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    source_ref_id UUID,
    running_balance DECIMAL(14, 2) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. EMAIL LOGS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'FAILED', 'PENDING')),
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_flats_floor_id ON flats(floor_id);
CREATE INDEX IF NOT EXISTS idx_residents_flat_id ON residents(flat_id);
CREATE INDEX IF NOT EXISTS idx_invoices_flat_year_month ON maintenance_invoices(flat_id, year, month);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON maintenance_invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_flat_id ON maintenance_payments(flat_id);
CREATE INDEX IF NOT EXISTS idx_wallet_society_date ON wallet_transactions(society_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_society_date ON society_expenses(society_id, expense_date DESC);

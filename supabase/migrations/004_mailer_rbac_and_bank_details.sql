-- ====================================================================
-- Migration 004: Mailer Enhancements, Bank Details & Role-Based Access Control (RBAC)
-- ====================================================================

-- 1. ADD BANK DETAILS TO SOCIETIES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'societies' AND column_name = 'bank_name') THEN
        ALTER TABLE societies ADD COLUMN bank_name VARCHAR(255) NOT NULL DEFAULT 'HDFC Bank';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'societies' AND column_name = 'account_holder_name') THEN
        ALTER TABLE societies ADD COLUMN account_holder_name VARCHAR(255) NOT NULL DEFAULT 'Parijat Cooperative Housing Society Ltd';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'societies' AND column_name = 'account_number') THEN
        ALTER TABLE societies ADD COLUMN account_number VARCHAR(100) NOT NULL DEFAULT '5020008910291';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'societies' AND column_name = 'ifsc_code') THEN
        ALTER TABLE societies ADD COLUMN ifsc_code VARCHAR(50) NOT NULL DEFAULT 'HDFC0001234';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'societies' AND column_name = 'branch_name') THEN
        ALTER TABLE societies ADD COLUMN branch_name VARCHAR(255) NOT NULL DEFAULT 'Kothrud Branch, Pune';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'societies' AND column_name = 'upi_id') THEN
        ALTER TABLE societies ADD COLUMN upi_id VARCHAR(255) NOT NULL DEFAULT 'parijatsociety@okhdfcbank';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'societies' AND column_name = 'qr_code_url') THEN
        ALTER TABLE societies ADD COLUMN qr_code_url TEXT DEFAULT NULL;
    END IF;
END $$;

-- 2. ENHANCE EMAIL LOGS TABLE FOR PROPER RECIPIENT TRACKING & SCHEDULING
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'recipient_id') THEN
        ALTER TABLE email_logs ADD COLUMN recipient_id UUID REFERENCES residents(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'flat_id') THEN
        ALTER TABLE email_logs ADD COLUMN flat_id UUID REFERENCES flats(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'flat_number') THEN
        ALTER TABLE email_logs ADD COLUMN flat_number VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'email_type') THEN
        ALTER TABLE email_logs ADD COLUMN email_type VARCHAR(50) NOT NULL DEFAULT 'DUE_REMINDER';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'related_maintenance_month') THEN
        ALTER TABLE email_logs ADD COLUMN related_maintenance_month INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'related_maintenance_year') THEN
        ALTER TABLE email_logs ADD COLUMN related_maintenance_year INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'amount_due') THEN
        ALTER TABLE email_logs ADD COLUMN amount_due DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'last_attempt') THEN
        ALTER TABLE email_logs ADD COLUMN last_attempt TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'next_scheduled_at') THEN
        ALTER TABLE email_logs ADD COLUMN next_scheduled_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'retry_count') THEN
        ALTER TABLE email_logs ADD COLUMN retry_count INT NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 3. RBAC TABLES: ROLES & ADMIN USERS
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    permissions JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_flat_id ON email_logs(flat_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);


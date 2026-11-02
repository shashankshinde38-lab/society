-- ====================================================================
-- Migration 003: Multi-Month Selection, Due Generation & Advance Pool
-- ====================================================================

-- 1. Allow 'NO_DUES' in maintenance_invoices.status
ALTER TABLE maintenance_invoices
    DROP CONSTRAINT IF EXISTS maintenance_invoices_status_check;

ALTER TABLE maintenance_invoices
    ADD CONSTRAINT maintenance_invoices_status_check
    CHECK (status IN ('PAID', 'UNPAID', 'PARTIAL', 'ADVANCE_COVERED', 'NO_DUES'));

-- 2. Add attachment_url to maintenance_payments if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'maintenance_payments' AND column_name = 'attachment_url'
    ) THEN
        ALTER TABLE maintenance_payments ADD COLUMN attachment_url TEXT;
    END IF;
END $$;

-- 3. Procedure: Atomically Generate Monthly Maintenance Dues for Flat(s)
CREATE OR REPLACE FUNCTION generate_monthly_maintenance_dues(
    p_flat_ids UUID[],
    p_year INT,
    p_months INT[],
    p_amount DECIMAL DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_flat_id UUID;
    v_month INT;
    v_amt DECIMAL;
    v_created_count INT := 0;
    v_updated_count INT := 0;
    v_flat_override DECIMAL;
    v_society_id UUID;
    v_resident_id UUID;
BEGIN
    FOREACH v_flat_id IN ARRAY p_flat_ids
    LOOP
        -- Look up flat override & active resident
        SELECT maintenance_override, society_id INTO v_flat_override, v_society_id
        FROM flats WHERE id = v_flat_id;

        SELECT id INTO v_resident_id
        FROM residents WHERE flat_id = v_flat_id AND is_active = TRUE
        LIMIT 1;

        FOREACH v_month IN ARRAY p_months
        LOOP
            v_amt := COALESCE(p_amount, v_flat_override, 1100.00);

            -- Check if record already exists
            IF EXISTS (
                SELECT 1 FROM maintenance_invoices
                WHERE flat_id = v_flat_id AND year = p_year AND month = v_month
            ) THEN
                UPDATE maintenance_invoices
                SET status = CASE WHEN status = 'NO_DUES' THEN 'UNPAID' ELSE status END,
                    invoice_amount = v_amt,
                    due_amount = CASE WHEN status = 'NO_DUES' THEN v_amt ELSE due_amount END,
                    updated_at = NOW()
                WHERE flat_id = v_flat_id AND year = p_year AND month = v_month;

                v_updated_count := v_updated_count + 1;
            ELSE
                INSERT INTO maintenance_invoices (
                    flat_id,
                    resident_id,
                    month,
                    year,
                    invoice_amount,
                    paid_amount,
                    due_amount,
                    status,
                    due_date,
                    created_at,
                    updated_at
                ) VALUES (
                    v_flat_id,
                    v_resident_id,
                    v_month,
                    p_year,
                    v_amt,
                    0.00,
                    v_amt,
                    'UNPAID',
                    TO_DATE(p_year || '-' || LPAD(v_month::TEXT, 2, '0') || '-10', 'YYYY-MM-DD'),
                    NOW(),
                    NOW()
                );

                v_created_count := v_created_count + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', TRUE,
        'created_count', v_created_count,
        'updated_count', v_updated_count
    );
END;
$$;

-- 4. Procedure: Atomically Record Maintenance Payment with Multi-Month Allocation Support
CREATE OR REPLACE FUNCTION record_maintenance_payment_atomic(
    p_society_id UUID,
    p_flat_id UUID,
    p_resident_id UUID,
    p_amount_received DECIMAL,
    p_payment_method VARCHAR,
    p_payment_date DATE,
    p_transaction_ref VARCHAR,
    p_description TEXT,
    p_created_by VARCHAR,
    p_attachment_url TEXT DEFAULT NULL,
    p_selected_invoice_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_payment_id UUID;
    v_receipt_no VARCHAR;
    v_remaining_amount DECIMAL := p_amount_received;
    v_invoice RECORD;
    v_allocate_amt DECIMAL;
    v_latest_wallet_balance DECIMAL := 0.00;
    v_new_wallet_balance DECIMAL := 0.00;
    v_allocated_months TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- 1. Validate payment amount
    IF p_amount_received <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero';
    END IF;

    -- 2. Generate unique receipt number
    v_receipt_no := 'REC-' || TO_CHAR(p_payment_date, 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

    -- 3. Insert Payment record
    INSERT INTO maintenance_payments (
        flat_id,
        resident_id,
        receipt_number,
        total_amount_received,
        payment_date,
        payment_method,
        transaction_ref,
        description,
        attachment_url,
        created_by
    ) VALUES (
        p_flat_id,
        p_resident_id,
        v_receipt_no,
        p_amount_received,
        p_payment_date,
        p_payment_method,
        p_transaction_ref,
        p_description,
        p_attachment_url,
        p_created_by
    ) RETURNING id INTO v_payment_id;

    -- 4. Allocate payment to selected invoices (or oldest unpaid if none specified)
    FOR v_invoice IN 
        SELECT id, month, year, due_amount, invoice_amount, paid_amount, status
        FROM maintenance_invoices
        WHERE flat_id = p_flat_id 
          AND (
            (p_selected_invoice_ids IS NOT NULL AND id = ANY(p_selected_invoice_ids))
            OR
            (p_selected_invoice_ids IS NULL AND status IN ('UNPAID', 'PARTIAL'))
          )
        ORDER BY year ASC, month ASC
    LOOP
        IF v_remaining_amount <= 0 THEN
            EXIT;
        END IF;

        -- If selected invoice was in NO_DUES status, activate it
        IF v_invoice.status = 'NO_DUES' OR v_invoice.due_amount = 0 THEN
            v_invoice.due_amount := v_invoice.invoice_amount;
        END IF;

        IF v_remaining_amount >= v_invoice.due_amount THEN
            v_allocate_amt := v_invoice.due_amount;
            v_remaining_amount := v_remaining_amount - v_allocate_amt;

            UPDATE maintenance_invoices
            SET paid_amount = invoice_amount,
                due_amount = 0.00,
                status = 'PAID',
                updated_at = NOW()
            WHERE id = v_invoice.id;

            v_allocated_months := array_append(v_allocated_months, v_invoice.month || '/' || v_invoice.year);
        ELSE
            v_allocate_amt := v_remaining_amount;
            v_remaining_amount := 0.00;

            UPDATE maintenance_invoices
            SET paid_amount = paid_amount + v_allocate_amt,
                due_amount = due_amount - v_allocate_amt,
                status = 'PARTIAL',
                updated_at = NOW()
            WHERE id = v_invoice.id;

            v_allocated_months := array_append(v_allocated_months, v_invoice.month || '/' || v_invoice.year || ' (Part)');
        END IF;

        -- Record allocation link
        INSERT INTO payment_allocations (
            payment_id,
            invoice_id,
            allocated_amount,
            allocation_date
        ) VALUES (
            v_payment_id,
            v_invoice.id,
            v_allocate_amt,
            p_payment_date
        );
    END LOOP;

    -- 5. If unallocated excess remains, credit flat's advance pool
    IF v_remaining_amount > 0 THEN
        INSERT INTO advance_balances (
            flat_id,
            total_advance_received,
            current_advance_balance,
            last_updated
        ) VALUES (
            p_flat_id,
            v_remaining_amount,
            v_remaining_amount,
            NOW()
        )
        ON CONFLICT (flat_id) DO UPDATE
        SET total_advance_received = advance_balances.total_advance_received + v_remaining_amount,
            current_advance_balance = advance_balances.current_advance_balance + v_remaining_amount,
            last_updated = NOW();
    END IF;

    -- 6. Credit Society Wallet Ledger
    SELECT COALESCE(running_balance, 0.00) INTO v_latest_wallet_balance
    FROM wallet_transactions
    WHERE society_id = p_society_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_latest_wallet_balance IS NULL THEN
        SELECT COALESCE(opening_balance, 0.00) INTO v_latest_wallet_balance
        FROM societies WHERE id = p_society_id;
    END IF;

    v_new_wallet_balance := COALESCE(v_latest_wallet_balance, 0.00) + p_amount_received;

    INSERT INTO wallet_transactions (
        society_id,
        transaction_date,
        transaction_type,
        category,
        amount,
        source_ref_id,
        running_balance,
        description
    ) VALUES (
        p_society_id,
        p_payment_date,
        'CREDIT',
        'MAINTENANCE',
        p_amount_received,
        v_payment_id,
        v_new_wallet_balance,
        'Maintenance payment receipt ' || v_receipt_no || 
        CASE WHEN array_length(v_allocated_months, 1) > 0 THEN ' (' || array_to_string(v_allocated_months, ', ') || ')' ELSE '' END ||
        CASE WHEN v_remaining_amount > 0 THEN ', incl. ₹' || v_remaining_amount || ' Advance' ELSE '' END
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'payment_id', v_payment_id,
        'receipt_number', v_receipt_no,
        'advance_allocated', v_remaining_amount,
        'allocated_months', v_allocated_months,
        'new_wallet_balance', v_new_wallet_balance
    );
END;
$$;

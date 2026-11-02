-- ====================================================================
-- Parijat Society ERP - Stored Procedures & Seed Data
-- ====================================================================

-- Procedure 1: Atomically Record Maintenance Payment
CREATE OR REPLACE FUNCTION record_maintenance_payment_atomic(
    p_society_id UUID,
    p_flat_id UUID,
    p_resident_id UUID,
    p_amount_received DECIMAL,
    p_payment_method VARCHAR,
    p_payment_date DATE,
    p_transaction_ref VARCHAR,
    p_description TEXT,
    p_created_by VARCHAR
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
BEGIN
    -- 1. Generate unique receipt number
    v_receipt_no := 'REC-' || TO_CHAR(p_payment_date, 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

    -- 2. Insert Payment record
    INSERT INTO maintenance_payments (
        flat_id,
        resident_id,
        receipt_number,
        total_amount_received,
        payment_date,
        payment_method,
        transaction_ref,
        description,
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
        p_created_by
    ) RETURNING id INTO v_payment_id;

    -- 3. Allocate payment to oldest unpaid or partial invoices of this flat
    FOR v_invoice IN 
        SELECT id, due_amount, invoice_amount, paid_amount
        FROM maintenance_invoices
        WHERE flat_id = p_flat_id AND status IN ('UNPAID', 'PARTIAL')
        ORDER BY year ASC, month ASC
    LOOP
        IF v_remaining_amount <= 0 THEN
            EXIT;
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
        ELSE
            v_allocate_amt := v_remaining_amount;
            v_remaining_amount := 0.00;

            UPDATE maintenance_invoices
            SET paid_amount = paid_amount + v_allocate_amt,
                due_amount = due_amount - v_allocate_amt,
                status = 'PARTIAL',
                updated_at = NOW()
            WHERE id = v_invoice.id;
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

    -- 4. If any excess amount remains, allocate to flat's advance pool
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

    -- 5. Record single CREDIT in Society Wallet
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
        'Maintenance payment receipt ' || v_receipt_no
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'payment_id', v_payment_id,
        'receipt_number', v_receipt_no,
        'advance_allocated', v_remaining_amount,
        'new_wallet_balance', v_new_wallet_balance
    );
END;
$$;

-- Procedure 2: Atomically Record Society Expense
CREATE OR REPLACE FUNCTION record_society_expense_atomic(
    p_society_id UUID,
    p_category_id UUID,
    p_title VARCHAR,
    p_amount DECIMAL,
    p_expense_date DATE,
    p_payment_method VARCHAR,
    p_vendor_name VARCHAR,
    p_invoice_bill_no VARCHAR,
    p_attachment_url TEXT,
    p_description TEXT,
    p_created_by VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_expense_id UUID;
    v_latest_wallet_balance DECIMAL := 0.00;
    v_new_wallet_balance DECIMAL := 0.00;
BEGIN
    INSERT INTO society_expenses (
        society_id,
        category_id,
        title,
        amount,
        expense_date,
        payment_method,
        vendor_name,
        invoice_bill_no,
        attachment_url,
        description,
        created_by
    ) VALUES (
        p_society_id,
        p_category_id,
        p_title,
        p_amount,
        p_expense_date,
        p_payment_method,
        p_vendor_name,
        p_invoice_bill_no,
        p_attachment_url,
        p_description,
        p_created_by
    ) RETURNING id INTO v_expense_id;

    -- Debit wallet
    SELECT COALESCE(running_balance, 0.00) INTO v_latest_wallet_balance
    FROM wallet_transactions
    WHERE society_id = p_society_id
    ORDER BY created_at DESC
    LIMIT 1;

    v_new_wallet_balance := COALESCE(v_latest_wallet_balance, 0.00) - p_amount;

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
        p_expense_date,
        'DEBIT',
        'EXPENSE',
        p_amount,
        v_expense_id,
        v_new_wallet_balance,
        'Expense: ' || p_title || COALESCE(' (' || p_vendor_name || ')', '')
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'expense_id', v_expense_id,
        'new_wallet_balance', v_new_wallet_balance
    );
END;
$$;

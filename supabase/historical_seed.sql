-- ====================================================================
-- Parijat Cooperative Housing Society - Full Historical Database Seed
-- Covers: 15 Months (September 2025 - November 2026)
-- STAGED: Run in Supabase SQL editor ONLY AFTER USER APPROVAL
-- ====================================================================

-- 1. SOCIETY
INSERT INTO societies (id, name, address, city, state, pincode, email, contact_number, financial_year, opening_balance, opening_balance_date, bank_name, account_holder_name, account_number, ifsc_code, branch_name, upi_id)
VALUES ('soc-parijat-a-wing', 'Parijat Cooperative Housing Society - A Wing', 'Survey No. 42/1, Parijat Enclave, Kothrud', 'Pune', 'Maharashtra', '411038', 'parijatsociety@gmail.com', '+91 98220 12345', '2025-2026', 0.00, '2025-09-01', 'HDFC Bank', 'Parijat Cooperative Housing Society Ltd', '5020008910291', 'HDFC0001234', 'Kothrud Branch, Pune', 'parijatsociety@okhdfcbank')
ON CONFLICT (id) DO NOTHING;

-- 2. FLOORS
INSERT INTO floors (id, society_id, floor_number, floor_name, description, status, is_archived, total_flats)
VALUES
  ('fl-1', 'soc-parijat-a-wing', 1, '1st Floor', 'Flats 1-4', 'ACTIVE', FALSE, 4),
  ('fl-2', 'soc-parijat-a-wing', 2, '2nd Floor', 'Flats 5-8', 'ACTIVE', FALSE, 4),
  ('fl-3', 'soc-parijat-a-wing', 3, '3rd Floor', 'Flats 9-12', 'ACTIVE', FALSE, 4),
  ('fl-4', 'soc-parijat-a-wing', 4, '4th Floor', 'Flats 13-16', 'ACTIVE', FALSE, 4),
  ('fl-5', 'soc-parijat-a-wing', 5, '5th Floor', 'Flats 17-20', 'ACTIVE', FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- 3. FLATS
INSERT INTO flats (id, society_id, floor_id, flat_number, flat_type, area_sqft, maintenance_override, status, description)
VALUES
  ('flat-1', 'soc-parijat-a-wing', 'fl-1', '1', '2BHK', 850, 1000, 'OCCUPIED', 'Flat 1 - Rohit Konde'),
  ('flat-2', 'soc-parijat-a-wing', 'fl-1', '2', '2BHK', 850, 1100, 'OCCUPIED', 'Flat 2 - S. Rane'),
  ('flat-3', 'soc-parijat-a-wing', 'fl-1', '3', '2BHK', 850, 1100, 'OCCUPIED', 'Flat 3 - R. Kanse'),
  ('flat-4', 'soc-parijat-a-wing', 'fl-1', '4', '2BHK', 850, 1100, 'OCCUPIED', 'Flat 4 - Pravin Zhunjar'),
  ('flat-5', 'soc-parijat-a-wing', 'fl-2', '5', '2BHK', 850, 1000, 'OCCUPIED', 'Flat 5 - Milind Rane'),
  ('flat-6', 'soc-parijat-a-wing', 'fl-2', '6', '2BHK', 850, 1100, 'OCCUPIED', 'Flat 6 - Wanjale'),
  ('flat-7', 'soc-parijat-a-wing', 'fl-2', '7', '2BHK', 850, 1100, 'OCCUPIED', 'Flat 7 - Sagar & Abholi Gore'),
  ('flat-8', 'soc-parijat-a-wing', 'fl-2', '8', '2BHK', 850, 1000, 'OCCUPIED', 'Flat 8 - Subhash Marne'),
  ('flat-9', 'soc-parijat-a-wing', 'fl-3', '9', '2BHK', 850, 1000, 'OCCUPIED', 'Flat 9 - Yogita Kuyeskar'),
  ('flat-10', 'soc-parijat-a-wing', 'fl-3', '10', '2BHK', 850, 1100, 'OCCUPIED', 'Flat 10 - B.D. Deshmukh'),
  ('flat-11', 'soc-parijat-a-wing', 'fl-3', '11', '2BHK', 850, 1000, 'OCCUPIED', 'Flat 11 - Charushila Mohol'),
  ('flat-12', 'soc-parijat-a-wing', 'fl-3', '12', '2BHK', 850, 1100, 'OCCUPIED', 'Flat 12 - Sunil Yadav'),
  ('flat-13', 'soc-parijat-a-wing', 'fl-4', '13', '2BHK', 850, 1000, 'OCCUPIED', 'Flat 13 - Satish Deshmukh'),
  ('flat-14', 'soc-parijat-a-wing', 'fl-4', '14', '2BHK', 850, 1100, 'OCCUPIED', 'Flat 14 - B.D. Deshmukh'),
  ('flat-15', 'soc-parijat-a-wing', 'fl-4', '15', '2BHK', 850, 1000, 'OCCUPIED', 'Flat 15 - Sanjay Dhamale'),
  ('flat-16', 'soc-parijat-a-wing', 'fl-4', '16', '2BHK', 850, 1000, 'OCCUPIED', 'Flat 16 - Vishal Kusalkar'),
  ('flat-17', 'soc-parijat-a-wing', 'fl-5', '17', '2BHK', 850, 1100, 'OCCUPIED', 'Flat 17 - Suresh Walke'),
  ('flat-18', 'soc-parijat-a-wing', 'fl-5', '18', '2BHK', 850, 1100, 'OCCUPIED', 'Flat 18 - Chaudhari'),
  ('flat-19', 'soc-parijat-a-wing', 'fl-5', '19', '2BHK', 850, 1100, 'OCCUPIED', 'Flat 19 - Chahane'),
  ('flat-20', 'soc-parijat-a-wing', 'fl-5', '20', '2BHK', 850, 1100, 'OCCUPIED', 'Flat 20 - Rajput')
ON CONFLICT (id) DO NOTHING;

-- 4. RESIDENTS
INSERT INTO residents (id, flat_id, full_name, resident_type, email, mobile, move_in_date, is_active)
VALUES
  ('res-1', 'flat-1', 'Rohit Konde', 'OWNER', 'rohit.konde@parijat.org', '9822000001', '2025-09-01', TRUE),
  ('res-2', 'flat-2', 'S. Rane', 'TENANT', 's.rane@parijat.org', '9822000002', '2025-09-01', TRUE),
  ('res-3', 'flat-3', 'R. Kanse', 'TENANT', 'r.kanse@parijat.org', '9822000003', '2025-09-01', TRUE),
  ('res-4', 'flat-4', 'Pravin Zhunjar', 'OWNER', 'pravin.zhunjar@parijat.org', '9822000004', '2025-09-01', TRUE),
  ('res-5', 'flat-5', 'Milind Rane', 'OWNER', 'milind.rane@parijat.org', '9822000005', '2025-09-01', TRUE),
  ('res-6', 'flat-6', 'Wanjale', 'TENANT', 'wanjale@parijat.org', '9822000006', '2025-09-01', TRUE),
  ('res-7', 'flat-7', 'Sagar & Abholi Gore', 'TENANT', 'sagar.gore@parijat.org', '9822000007', '2025-09-01', TRUE),
  ('res-8', 'flat-8', 'Subhash Marne', 'OWNER', 'subhash.marne@parijat.org', '9822000008', '2025-09-01', TRUE),
  ('res-9', 'flat-9', 'Yogita Kuyeskar', 'OWNER', 'yogita.kuyeskar@parijat.org', '9822000009', '2025-09-01', TRUE),
  ('res-10', 'flat-10', 'B.D. Deshmukh', 'TENANT', 'bd.deshmukh10@parijat.org', '9822000010', '2025-09-01', TRUE),
  ('res-11', 'flat-11', 'Charushila Mohol', 'OWNER', 'charushila.mohol@parijat.org', '9822000011', '2025-09-01', TRUE),
  ('res-12', 'flat-12', 'Sunil Yadav', 'TENANT', 'sunil.yadav@parijat.org', '9822000012', '2025-09-01', TRUE),
  ('res-13', 'flat-13', 'Satish Deshmukh', 'OWNER', 'satish.deshmukh@parijat.org', '9822000013', '2025-09-01', TRUE),
  ('res-14', 'flat-14', 'B.D. Deshmukh', 'TENANT', 'bd.deshmukh14@parijat.org', '9822000014', '2025-09-01', TRUE),
  ('res-15', 'flat-15', 'Sanjay Dhamale', 'OWNER', 'sanjay.dhamale@parijat.org', '9822000015', '2025-09-01', TRUE),
  ('res-16', 'flat-16', 'Vishal Kusalkar', 'OWNER', 'vishal.kusalkar@parijat.org', '9822000016', '2025-09-01', TRUE),
  ('res-17', 'flat-17', 'Suresh Walke', 'TENANT', 'suresh.walke@parijat.org', '9822000017', '2025-09-01', TRUE),
  ('res-18', 'flat-18', 'Chaudhari', 'TENANT', 'chaudhari@parijat.org', '9822000018', '2025-09-01', TRUE),
  ('res-19', 'flat-19', 'Chahane', 'TENANT', 'chahane@parijat.org', '9822000019', '2025-09-01', TRUE),
  ('res-20', 'flat-20', 'Rajput', 'TENANT', 'rajput@parijat.org', '9822000020', '2025-09-01', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. EXPENSES
INSERT INTO society_expenses (id, society_id, category_id, title, amount, expense_date, payment_method, vendor_name, invoice_bill_no, description, created_by)
VALUES
  ('exp-2025-09-001', 'soc-parijat-a-wing', 'cat-3', 'Watchmen Salary', 3000.0, '2025-09-20', 'CASH', 'Vendor / Staff', 'BILL-202509-001', 'Watchmen Salary', 'System Seeder'),
  ('exp-2025-09-002', 'soc-parijat-a-wing', 'cat-4', 'Broom,phenel,zhadu', 740.0, '2025-09-20', 'CASH', 'Vendor / Staff', 'BILL-202509-002', 'Broom,phenel,zhadu', 'System Seeder'),
  ('exp-2025-09-003', 'soc-parijat-a-wing', 'cat-1', 'Electricity Bill', 9500.0, '2025-09-20', 'ONLINE', 'Vendor / Staff', 'BILL-202509-003', 'Electricity Bill', 'System Seeder'),
  ('exp-2025-09-004', 'soc-parijat-a-wing', 'cat-1', '1 Dozen Bulbs', 1000.0, '2025-09-20', 'ONLINE', 'Vendor / Staff', 'BILL-202509-004', '1 Dozen Bulbs', 'System Seeder'),
  ('exp-2025-10-005', 'soc-parijat-a-wing', 'cat-1', 'lightbill -september', 12390.0, '2025-10-20', 'ONLINE', 'Vendor / Staff', 'BILL-202510-005', 'lightbill -september', 'System Seeder'),
  ('exp-2025-10-006', 'soc-parijat-a-wing', 'cat-3', 'Watchmen salary', 3000.0, '2025-10-20', 'CASH', 'Vendor / Staff', 'BILL-202510-006', 'Watchmen salary', 'System Seeder'),
  ('exp-2025-10-007', 'soc-parijat-a-wing', 'cat-3', 'bonus watchmen', 3000.0, '2025-10-20', 'ONLINE', 'Vendor / Staff', 'BILL-202510-007', 'bonus watchmen', 'System Seeder'),
  ('exp-2025-10-008', 'soc-parijat-a-wing', 'cat-8', 'builder plan pass fee', 2500.0, '2025-10-20', 'ONLINE', 'Vendor / Staff', 'BILL-202510-008', 'builder plan pass fee', 'System Seeder'),
  ('exp-2025-10-009', 'soc-parijat-a-wing', 'cat-2', 'lift maintence shoes lyner', 1920.0, '2025-10-20', 'ONLINE', 'Vendor / Staff', 'BILL-202510-009', 'lift maintence shoes lyner', 'System Seeder'),
  ('exp-2025-11-010', 'soc-parijat-a-wing', 'cat-3', 'Watchmen salary', 3000.0, '2025-11-20', 'CASH', 'Vendor / Staff', 'BILL-202511-010', 'Watchmen salary', 'System Seeder'),
  ('exp-2025-11-011', 'soc-parijat-a-wing', 'cat-5', 'Tank Service and alteration service', 3200.0, '2025-11-20', 'ONLINE', 'Vendor / Staff', 'BILL-202511-011', 'Tank Service and alteration service', 'System Seeder'),
  ('exp-2025-11-012', 'soc-parijat-a-wing', 'cat-1', 'light bill', 12450.0, '2025-11-20', 'ONLINE', 'Vendor / Staff', 'BILL-202511-012', 'light bill', 'System Seeder'),
  ('exp-2025-11-013', 'soc-parijat-a-wing', 'cat-2', 'lift AMC Part payment', 5000.0, '2025-11-20', 'ONLINE', 'Vendor / Staff', 'BILL-202511-013', 'lift AMC Part payment', 'System Seeder'),
  ('exp-2025-12-014', 'soc-parijat-a-wing', 'cat-1', 'Lightbill', 10250.0, '2025-12-20', 'ONLINE', 'Vendor / Staff', 'BILL-202512-014', 'Lightbill', 'System Seeder'),
  ('exp-2025-12-015', 'soc-parijat-a-wing', 'cat-3', 'Watchmen salary', 3000.0, '2025-12-20', 'CASH', 'Vendor / Staff', 'BILL-202512-015', 'Watchmen salary', 'System Seeder'),
  ('exp-2026-01-016', 'soc-parijat-a-wing', 'cat-3', 'Watchmen salary', 3000.0, '2026-01-20', 'CASH', 'Vendor / Staff', 'BILL-202601-016', 'Watchmen salary', 'System Seeder'),
  ('exp-2026-01-017', 'soc-parijat-a-wing', 'cat-1', 'Electricity bill', 13360.0, '2026-01-20', 'ONLINE', 'Vendor / Staff', 'BILL-202601-017', 'Electricity bill', 'System Seeder'),
  ('exp-2026-01-018', 'soc-parijat-a-wing', 'cat-2', 'Lift Duct Construction work', 3500.0, '2026-01-20', 'ONLINE', 'Vendor / Staff', 'BILL-202601-018', 'Lift Duct Construction work', 'System Seeder'),
  ('exp-2026-02-019', 'soc-parijat-a-wing', 'cat-3', 'Watchmen salary', 3000.0, '2026-02-20', 'CASH', 'Vendor / Staff', 'BILL-202602-019', 'Watchmen salary', 'System Seeder'),
  ('exp-2026-02-020', 'soc-parijat-a-wing', 'cat-1', 'Electricity bill', 14930.0, '2026-02-20', 'ONLINE', 'Vendor / Staff', 'BILL-202602-020', 'Electricity bill', 'System Seeder'),
  ('exp-2026-03-021', 'soc-parijat-a-wing', 'cat-3', 'Watchmen salary', 3000.0, '2026-03-20', 'CASH', 'Vendor / Staff', 'BILL-202603-021', 'Watchmen salary', 'System Seeder'),
  ('exp-2026-03-022', 'soc-parijat-a-wing', 'cat-1', 'Electricity bill', 13850.0, '2026-03-20', 'ONLINE', 'Vendor / Staff', 'BILL-202603-022', 'Electricity bill', 'System Seeder'),
  ('exp-2026-03-023', 'soc-parijat-a-wing', 'cat-2', 'Safety window lift duct and lift maintence room', 6500.0, '2026-03-20', 'ONLINE', 'Vendor / Staff', 'BILL-202603-023', 'Safety window lift duct and lift maintence room', 'System Seeder'),
  ('exp-2026-03-024', 'soc-parijat-a-wing', 'cat-6', 'marne for duct work plaster and level', 3000.0, '2026-03-20', 'ONLINE', 'Vendor / Staff', 'BILL-202603-024', 'marne for duct work plaster and level', 'System Seeder'),
  ('exp-2026-03-025', 'soc-parijat-a-wing', 'cat-6', 'painter', 1000.0, '2026-03-20', 'ONLINE', 'Vendor / Staff', 'BILL-202603-025', 'painter', 'System Seeder'),
  ('exp-2026-03-026', 'soc-parijat-a-wing', 'cat-4', 'cleaning sxpenses broom phenel (February bill)', 770.0, '2026-03-20', 'CASH', 'Vendor / Staff', 'BILL-202603-026', 'cleaning sxpenses broom phenel (February bill)', 'System Seeder'),
  ('exp-2026-04-027', 'soc-parijat-a-wing', 'cat-3', 'watchmen salary', 3000.0, '2026-04-20', 'CASH', 'Vendor / Staff', 'BILL-202604-027', 'watchmen salary', 'System Seeder'),
  ('exp-2026-04-028', 'soc-parijat-a-wing', 'cat-1', 'Electricity bill', 13920.0, '2026-04-20', 'ONLINE', 'Vendor / Staff', 'BILL-202604-028', 'Electricity bill', 'System Seeder'),
  ('exp-2026-05-029', 'soc-parijat-a-wing', 'cat-3', 'watchmen salary', 3000.0, '2026-05-20', 'CASH', 'Vendor / Staff', 'BILL-202605-029', 'watchmen salary', 'System Seeder'),
  ('exp-2026-05-030', 'soc-parijat-a-wing', 'cat-1', 'Electricity bill', 12360.0, '2026-05-20', 'ONLINE', 'Vendor / Staff', 'BILL-202605-030', 'Electricity bill', 'System Seeder'),
  ('exp-2026-06-031', 'soc-parijat-a-wing', 'cat-3', 'watchmen salary', 3000.0, '2026-06-20', 'CASH', 'Vendor / Staff', 'BILL-202606-031', 'watchmen salary', 'System Seeder'),
  ('exp-2026-06-032', 'soc-parijat-a-wing', 'cat-1', 'Electricity bill', 12810.0, '2026-06-20', 'ONLINE', 'Vendor / Staff', 'BILL-202606-032', 'Electricity bill', 'System Seeder'),
  ('exp-2026-07-033', 'soc-parijat-a-wing', 'cat-3', 'watchmen salary', 3000.0, '2026-07-20', 'CASH', 'Vendor / Staff', 'BILL-202607-033', 'watchmen salary', 'System Seeder'),
  ('exp-2026-07-034', 'soc-parijat-a-wing', 'cat-1', 'Electricity bill', 16550.0, '2026-07-20', 'ONLINE', 'Vendor / Staff', 'BILL-202607-034', 'Electricity bill', 'System Seeder'),
  ('exp-2026-07-035', 'soc-parijat-a-wing', 'cat-4', 'jhadu,phenel etc expense', 750.0, '2026-07-20', 'ONLINE', 'Vendor / Staff', 'BILL-202607-035', 'jhadu,phenel etc expense', 'System Seeder'),
  ('exp-2026-07-036', 'soc-parijat-a-wing', 'cat-1', '3500(Electrical products)+1400(Labour) =4900', 4900.0, '2026-07-20', 'ONLINE', 'Vendor / Staff', 'BILL-202607-036', '3500(Electrical products)+1400(Labour) =4900', 'System Seeder'),
  ('exp-2026-08-037', 'soc-parijat-a-wing', 'cat-3', 'watchmen salary', 3000.0, '2026-08-20', 'CASH', 'Vendor / Staff', 'BILL-202608-037', 'watchmen salary', 'System Seeder'),
  ('exp-2026-08-038', 'soc-parijat-a-wing', 'cat-1', 'Electricity bill', 14950.0, '2026-08-20', 'ONLINE', 'Vendor / Staff', 'BILL-202608-038', 'Electricity bill', 'System Seeder'),
  ('exp-2026-09-039', 'soc-parijat-a-wing', 'cat-3', 'Watchmen salary', 3000.0, '2026-09-20', 'CASH', 'Vendor / Staff', 'BILL-202609-039', 'Watchmen salary', 'System Seeder'),
  ('exp-2026-09-040', 'soc-parijat-a-wing', 'cat-1', 'Electricity bill', 15100.0, '2026-09-20', 'ONLINE', 'Vendor / Staff', 'BILL-202609-040', 'Electricity bill', 'System Seeder'),
  ('exp-2026-09-041', 'soc-parijat-a-wing', 'cat-6', 'Parking plumbing expense for motor leak', 7500.0, '2026-09-20', 'ONLINE', 'Vendor / Staff', 'BILL-202609-041', 'Parking plumbing expense for motor leak', 'System Seeder'),
  ('exp-2026-09-042', 'soc-parijat-a-wing', 'cat-5', 'Water tanker', 1000.0, '2026-09-20', 'ONLINE', 'Vendor / Staff', 'BILL-202609-042', 'Water tanker', 'System Seeder'),
  ('exp-2026-09-043', 'soc-parijat-a-wing', 'cat-5', 'Water tanker', 1000.0, '2026-09-20', 'ONLINE', 'Vendor / Staff', 'BILL-202609-043', 'Water tanker', 'System Seeder'),
  ('exp-2026-09-044', 'soc-parijat-a-wing', 'cat-5', 'Water tanker', 1000.0, '2026-09-20', 'ONLINE', 'Vendor / Staff', 'BILL-202609-044', 'Water tanker', 'System Seeder'),
  ('exp-2026-09-045', 'soc-parijat-a-wing', 'cat-4', 'Borewell maintenance expense for cleaning and etc', 4000.0, '2026-09-20', 'ONLINE', 'Vendor / Staff', 'BILL-202609-045', 'Borewell maintenance expense for cleaning and etc', 'System Seeder'),
  ('exp-2026-09-046', 'soc-parijat-a-wing', 'cat-6', '2 locks for terrace', 500.0, '2026-09-20', 'ONLINE', 'Vendor / Staff', 'BILL-202609-046', '2 locks for terrace', 'System Seeder'),
  ('exp-2026-09-047', 'soc-parijat-a-wing', 'cat-6', 'new bore installation + old motor repair+hardware material+labour+motor labour+rickshaw charge', 11473.0, '2026-09-20', 'ONLINE', 'Vendor / Staff', 'BILL-202609-047', 'new bore installation + old motor repair+hardware material+labour+motor labour+rickshaw charge', 'System Seeder'),
  ('exp-2026-10-048', 'soc-parijat-a-wing', 'cat-3', 'Watchmen salary', 3000.0, '2026-10-20', 'CASH', 'Vendor / Staff', 'BILL-202610-048', 'Watchmen salary', 'System Seeder'),
  ('exp-2026-10-049', 'soc-parijat-a-wing', 'cat-4', 'Drainage  cleaning', 4500.0, '2026-10-20', 'ONLINE', 'Vendor / Staff', 'BILL-202610-049', 'Drainage  cleaning', 'System Seeder'),
  ('exp-2026-10-050', 'soc-parijat-a-wing', 'cat-4', 'Drain cleaning material expenses 2 ltr phnyel', 500.0, '2026-10-20', 'ONLINE', 'Vendor / Staff', 'BILL-202610-050', 'Drain cleaning material expenses 2 ltr phnyel', 'System Seeder'),
  ('exp-2026-10-051', 'soc-parijat-a-wing', 'cat-1', 'lightbill', 16060.0, '2026-10-20', 'ONLINE', 'Vendor / Staff', 'BILL-202610-051', 'lightbill', 'System Seeder')
ON CONFLICT (id) DO NOTHING;

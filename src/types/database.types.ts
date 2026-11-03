export interface Society {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  email: string;
  contact_number: string | null;
  financial_year: string;
  opening_balance: number;
  opening_balance_date: string;
  // Bank Details for App Setup & Mailer
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
  upi_id: string;
  qr_code_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Floor {
  id: string;
  society_id: string;
  floor_number: number;
  floor_name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  is_archived: boolean;
  total_flats?: number;
  created_at: string;
  updated_at: string;
}

export interface Flat {
  id: string;
  society_id: string;
  floor_id: string;
  floor?: Floor;
  flat_number: string;
  flat_type: string;
  area_sqft: number;
  maintenance_override: number | null;
  status: "OCCUPIED" | "VACANT" | "INACTIVE";
  description: string | null;
  current_resident?: Resident | null;
  advance_balance?: number;
  outstanding_dues?: number;
  created_at: string;
  updated_at: string;
}

export interface Resident {
  id: string;
  flat_id: string;
  flat?: Flat;
  full_name: string;
  resident_type: "OWNER" | "TENANT";
  email: string | null;
  mobile: string;
  alternate_mobile: string | null;
  move_in_date: string;
  move_out_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlatResidentHistory {
  id: string;
  flat_id: string;
  resident_name: string;
  resident_type: "OWNER" | "TENANT";
  email: string | null;
  mobile: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  changed_at: string;
  notes: string | null;
}

export interface MaintenanceSettings {
  id: string;
  society_id: string;
  monthly_amount: number;
  due_day_of_month: number;
  currency: string;
  late_fee_enabled: boolean;
  late_fee_amount: number;
  reminder_days: number[];
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRateHistory {
  id: string;
  society_id: string;
  amount: number;
  effective_from: string;
  effective_to: string | null;
  reason: string | null;
  created_at: string;
}

export interface MaintenanceInvoice {
  id: string;
  flat_id: string;
  flat?: Flat;
  resident_id: string | null;
  resident?: Resident | null;
  month: number;
  year: number;
  invoice_amount: number;
  paid_amount: number;
  due_amount: number;
  status: "PAID" | "UNPAID" | "PARTIAL" | "ADVANCE_COVERED" | "NO_DUES";
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenancePayment {
  id: string;
  flat_id: string;
  flat?: Flat;
  resident_id: string | null;
  resident?: Resident | null;
  receipt_number: string;
  total_amount_received: number;
  payment_date: string;
  payment_method: "CASH" | "ONLINE_UPI" | "ONLINE_NEFT" | "ONLINE_BANK" | "CHEQUE";
  transaction_ref: string | null;
  description: string | null;
  attachment_url?: string | null;
  created_by: string;
  created_at: string;
  allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  invoice_id: string;
  invoice?: MaintenanceInvoice;
  allocated_amount: number;
  allocation_date: string;
  created_at: string;
}

export interface AdvanceBalance {
  id: string;
  flat_id: string;
  total_advance_received: number;
  advance_utilized: number;
  current_advance_balance: number;
  last_updated: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SocietyExpense {
  id: string;
  society_id: string;
  category_id: string;
  category?: ExpenseCategory;
  title: string;
  amount: number;
  expense_date: string;
  payment_method: "CASH" | "ONLINE" | "CHEQUE";
  vendor_name: string | null;
  invoice_bill_no: string | null;
  attachment_url: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  society_id: string;
  transaction_date: string;
  transaction_type: "CREDIT" | "DEBIT";
  category: "MAINTENANCE" | "EXPENSE" | "OPENING_BALANCE" | "OTHER_INCOME";
  amount: number;
  source_ref_id: string | null;
  running_balance: number;
  description: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  module: string;
  record_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface EmailLog {
  id: string;
  recipient_id?: string | null;
  recipient_email: string;
  recipient_name: string | null;
  flat_id?: string | null;
  flat_number?: string | null;
  email_type: "DUE_REMINDER" | "PAYMENT_RECEIPT" | "EXPENSE_ALERT" | "GENERAL_ANNOUNCEMENT";
  subject: string;
  related_maintenance_month?: number | null;
  related_maintenance_year?: number | null;
  amount_due?: number | null;
  status: "SENT" | "FAILED" | "PENDING";
  error_message?: string | null;
  sent_at: string;
  last_attempt?: string | null;
  next_scheduled_at?: string | null;
  retry_count?: number;
}

export interface DashboardMetrics {
  totalFloors: number;
  totalFlats: number;
  totalResidents: number;
  ownerOccupied: number;
  rentedFlats: number;
  totalMaintenanceCollected: number;
  totalPendingDues: number;
  totalExpenses: number;
  previousBalance: number;
  currentWalletBalance: number;
  advanceLiability: number;
}

// RBAC Permissions System
export type ModulePermission = {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

export type SystemModuleKey =
  | "dashboard"
  | "floors"
  | "flats"
  | "residents"
  | "maintenance"
  | "payments"
  | "expenses"
  | "wallet"
  | "mailer"
  | "app_setup"
  | "reports"
  | "users"
  | "roles";

export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: Record<SystemModuleKey, ModulePermission>;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role_id: string;
  role_name: string;
  status: "ACTIVE" | "INACTIVE";
  last_login: string;
  created_at: string;
}

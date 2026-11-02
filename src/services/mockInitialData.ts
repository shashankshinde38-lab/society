import {
  Floor,
  Flat,
  Resident,
  MaintenanceSettings,
  SocietyExpense,
  ExpenseCategory,
  WalletTransaction,
  Society,
  MaintenancePayment,
} from "@/types/database.types";

export const initialSociety: Society = {
  id: "soc-parijat-a-wing",
  name: "Parijat Cooperative Housing Society - A Wing",
  address: "Survey No. 42/1, Parijat Enclave, Kothrud",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411038",
  email: "parijatsociety@gmail.com",
  contact_number: "+91 98220 12345",
  financial_year: "2026-2027",
  opening_balance: 0.0,
  opening_balance_date: "2026-04-01",
  created_at: "2026-04-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

export const initialSettings: MaintenanceSettings = {
  id: "setting-1",
  society_id: "soc-parijat-a-wing",
  monthly_amount: 1100.0,
  due_day_of_month: 10,
  currency: "INR",
  late_fee_enabled: false,
  late_fee_amount: 0.0,
  reminder_days: [5, 10, 15, 20, 25, 30],
  created_at: "2026-04-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

// All dummy data cleared out - start fresh!
export const initialFloors: Floor[] = [];
export const initialFlats: Flat[] = [];
export const initialResidents: Resident[] = [];
export const initialExpenses: SocietyExpense[] = [];
export const initialPayments: MaintenancePayment[] = [];
export const initialWalletTransactions: WalletTransaction[] = [];

export const initialCategories: ExpenseCategory[] = [
  { id: "cat-1", name: "Electricity Bill (MSEDCL)", description: "Common area, lift, motor pump", is_active: true, created_at: "2026-04-01" },
  { id: "cat-2", name: "Lift AMC & Maintenance", description: "Monthly inspection and service", is_active: true, created_at: "2026-04-01" },
  { id: "cat-3", name: "Security & Watchman Salary", description: "24/7 security staff", is_active: true, created_at: "2026-04-01" },
  { id: "cat-4", name: "Housekeeping & Cleaning", description: "Staircase, premises, garbage", is_active: true, created_at: "2026-04-01" },
  { id: "cat-5", name: "Water Tanker Charges", description: "Municipal supplemental water", is_active: true, created_at: "2026-04-01" },
  { id: "cat-6", name: "Plumbing & Hardware Repairs", description: "Valves, taps, motor pump", is_active: true, created_at: "2026-04-01" },
  { id: "cat-7", name: "Generator Diesel & Service", description: "Backup generator power", is_active: true, created_at: "2026-04-01" },
  { id: "cat-8", name: "Stationery & Admin Expenses", description: "Registers, printing, stamps", is_active: true, created_at: "2026-04-01" },
];

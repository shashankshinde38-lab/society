"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { DataStorage } from "@/services/dataStorage";
import { Society, MaintenanceSettings, MaintenanceRateHistory } from "@/types/database.types";
import { AmountInput } from "@/components/common/AmountInput/AmountInput";
import { Building2, Settings2, History, Save, AlertCircle, TrendingUp, Landmark, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function AppSetupPage() {
  const [society, setSociety] = useState<Society | null>(null);
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [rateHistory, setRateHistory] = useState<MaintenanceRateHistory[]>([]);

  // Society Profile Form
  const [socName, setSocName] = useState("");
  const [socAddress, setSocAddress] = useState("");
  const [socCity, setSocCity] = useState("Pune");
  const [socState, setSocState] = useState("Maharashtra");
  const [socPincode, setSocPincode] = useState("411038");
  const [socEmail, setSocEmail] = useState("");
  const [socPhone, setSocPhone] = useState("");
  const [financialYear, setFinancialYear] = useState("2026-2027");
  const [openingBalance, setOpeningBalance] = useState<number | "">(45000);

  // Common Bank & UPI Details (Source of Truth for Mailer & Invoices)
  const [bankName, setBankName] = useState("HDFC Bank");
  const [accountHolderName, setAccountHolderName] = useState("Parijat Cooperative Housing Society Ltd");
  const [accountNumber, setAccountNumber] = useState("5020008910291");
  const [ifscCode, setIfscCode] = useState("HDFC0001234");
  const [branchName, setBranchName] = useState("Kothrud Branch, Pune");
  const [upiId, setUpiId] = useState("parijatsociety@okhdfcbank");

  // Settings Form
  const [dueDay, setDueDay] = useState<number>(10);
  const [lateFeeEnabled, setLateFeeEnabled] = useState(false);
  const [lateFeeAmount, setLateFeeAmount] = useState<number | "">(50);

  // Rate Change Modal
  const [showRateModal, setShowRateModal] = useState(false);
  const [newRateAmount, setNewRateAmount] = useState<number | "">(1300);
  const [rateReason, setRateReason] = useState("");

  const loadData = () => {
    const s = DataStorage.getSociety();
    const st = DataStorage.getSettings();
    const rh = DataStorage.getRateHistory();

    setSociety(s);
    setSettings(st);
    setRateHistory(rh);

    setSocName(s.name);
    setSocAddress(s.address);
    setSocCity(s.city);
    setSocState(s.state);
    setSocPincode(s.pincode);
    setSocEmail(s.email);
    setSocPhone(s.contact_number || "");
    setFinancialYear(s.financial_year);
    setOpeningBalance(s.opening_balance !== undefined ? s.opening_balance : "");

    // Load Bank Details from Society
    setBankName(s.bank_name || "HDFC Bank");
    setAccountHolderName(s.account_holder_name || "Parijat Cooperative Housing Society Ltd");
    setAccountNumber(s.account_number || "5020008910291");
    setIfscCode(s.ifsc_code || "HDFC0001234");
    setBranchName(s.branch_name || "Kothrud Branch, Pune");
    setUpiId(s.upi_id || "parijatsociety@okhdfcbank");

    setDueDay(st.due_day_of_month);
    setLateFeeEnabled(st.late_fee_enabled);
    setLateFeeAmount(st.late_fee_amount !== undefined ? st.late_fee_amount : "");
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSociety = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      DataStorage.updateSociety({
        name: socName,
        address: socAddress,
        city: socCity,
        state: socState,
        pincode: socPincode,
        email: socEmail,
        contact_number: socPhone,
        financial_year: financialYear,
        opening_balance: openingBalance === "" ? 0 : Number(openingBalance),
        // Common single source of truth for bank details
        bank_name: bankName.trim(),
        account_holder_name: accountHolderName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim(),
        branch_name: branchName.trim(),
        upi_id: upiId.trim(),
      });
      toast.success("Society & official bank details updated successfully! Changes reflect automatically in Mailer.");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update society");
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      DataStorage.updateSettings({
        due_day_of_month: Number(dueDay),
        late_fee_enabled: lateFeeEnabled,
        late_fee_amount: lateFeeAmount === "" ? 0 : Number(lateFeeAmount),
      });
      toast.success("Maintenance & billing configuration saved");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update settings");
    }
  };

  const handleSaveRateChange = (e: React.FormEvent) => {
    e.preventDefault();
    const rateVal = Number(newRateAmount);
    if (!newRateAmount || rateVal <= 0) {
      toast.error("Please enter a valid maintenance rate");
      return;
    }

    try {
      const rec = DataStorage.addRateChange(
        rateVal,
        rateReason || "Annual rate revision approved by General Body"
      );
      toast.success(`Rate change to ₹${rateVal} scheduled for ${rec.effective_from}`);
      setShowRateModal(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change rate");
    }
  };

  return (
    <div>
      <PageHeader
        title="App Setup & Society Configuration"
        subtitle="Manage society profiles, bank accounts for email notices, financial year, and maintenance rate rules"
        breadcrumbs={[{ label: "App Setup" }]}
      />

      <div className="row g-4 mb-4">
        {/* Society Profile & Official Bank Details Form */}
        <div className="col-12 col-lg-7">
          <div className="card-premium h-100">
            <div className="card-premium-header">
              <div className="d-flex align-items-center gap-2">
                <Building2 size={20} className="text-primary" />
                <h5 className="fw-bold text-dark mb-0">Society Profile &amp; Location</h5>
              </div>
            </div>

            <form onSubmit={handleSaveSociety} className="p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold text-secondary">
                    Society Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={socName}
                    onChange={(e) => setSocName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold text-secondary">
                    Full Address
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={socAddress}
                    onChange={(e) => setSocAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-sm-4">
                  <label className="form-label small fw-semibold text-secondary">City</label>
                  <input
                    type="text"
                    className="form-control"
                    value={socCity}
                    onChange={(e) => setSocCity(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-sm-4">
                  <label className="form-label small fw-semibold text-secondary">State</label>
                  <input
                    type="text"
                    className="form-control"
                    value={socState}
                    onChange={(e) => setSocState(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-sm-4">
                  <label className="form-label small fw-semibold text-secondary">Pincode</label>
                  <input
                    type="text"
                    className="form-control"
                    value={socPincode}
                    onChange={(e) => setSocPincode(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Society Official Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={socEmail}
                    onChange={(e) => setSocEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={socPhone}
                    onChange={(e) => setSocPhone(e.target.value)}
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Current Financial Year
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Opening Balance (₹)
                  </label>
                  <AmountInput
                    value={openingBalance}
                    onChange={(val) => setOpeningBalance(val)}
                    placeholder="Enter Opening Balance"
                    className="form-control font-monospace"
                  />
                </div>
              </div>

              {/* Dynamic Bank & Payment Details Section (Single Source of Truth) */}
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Landmark size={18} className="text-primary" />
                  <h6 className="fw-bold text-dark mb-0">Official Society Bank &amp; UPI Details</h6>
                  <span className="badge bg-primary-subtle text-primary ms-auto">Shared with Mailer &amp; Invoices</span>
                </div>
                <div className="small text-secondary mb-3">
                  These bank details are dynamically embedded into outgoing maintenance emails, reminders, and payment previews.
                </div>

                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-semibold text-secondary">Bank Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      required
                    />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-semibold text-secondary">Account Holder Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="e.g. Parijat Cooperative Housing Society Ltd"
                      required
                    />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-semibold text-secondary">Account Number</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 5020008910291"
                      required
                    />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-semibold text-secondary">IFSC Code</label>
                    <input
                      type="text"
                      className="form-control font-monospace text-uppercase"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      required
                    />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-semibold text-secondary">Branch Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Kothrud Branch, Pune"
                      required
                    />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label small fw-semibold text-secondary">Society UPI ID (VPA)</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. parijatsociety@okhdfcbank"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-top mt-4 text-end">
                <button type="submit" className="btn btn-primary-custom">
                  <Save size={16} />
                  <span>Update Society &amp; Bank Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Maintenance Rate & Billing Rules */}
        <div className="col-12 col-lg-5">
          <div className="card-premium h-100">
            <div className="card-premium-header">
              <div className="d-flex align-items-center gap-2">
                <Settings2 size={20} className="text-primary" />
                <h5 className="fw-bold text-dark mb-0">Maintenance &amp; Billing Rules</h5>
              </div>
            </div>

            <div className="p-4">
              {/* Current Active Rate Card */}
              <div className="p-3 bg-primary-subtle rounded-3 border border-primary-subtle mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="small text-secondary fw-semibold">CURRENT MONTHLY RATE</span>
                    <h2 className="fw-extrabold text-primary mb-0">
                      ₹{settings?.monthly_amount.toLocaleString() || "1,100"}
                      <span className="small text-secondary fw-normal fs-6"> / flat / month</span>
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary fw-semibold"
                    onClick={() => {
                      setNewRateAmount(settings ? settings.monthly_amount + 200 : 1300);
                      setRateReason("");
                      setShowRateModal(true);
                    }}
                  >
                    Change Rate
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveSettings}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Maintenance Due Date
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light small">Every</span>
                    <input
                      type="number"
                      className="form-control"
                      value={dueDay}
                      onChange={(e) => setDueDay(Number(e.target.value))}
                      min={1}
                      max={31}
                      required
                    />
                    <span className="input-group-text bg-light small">th of the month</span>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Daily 9:00 AM Cron Schedule (Asia/Kolkata)
                  </label>
                  <div className="p-2 bg-light rounded-2 small text-secondary">
                    Automated maintenance reminders execute <strong>every day at 09:00 AM IST</strong> to all residents with unpaid dues. If a flat has paid its dues, reminders stop immediately.
                  </div>
                </div>

                <div className="mb-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="lateFeeToggle"
                      checked={lateFeeEnabled}
                      onChange={(e) => setLateFeeEnabled(e.target.checked)}
                    />
                    <label className="form-check-label small fw-semibold text-secondary" htmlFor="lateFeeToggle">
                      Enable Late Payment Surcharge
                    </label>
                  </div>
                  {lateFeeEnabled && (
                    <div className="mt-2">
                      <AmountInput
                        value={lateFeeAmount}
                        onChange={(val) => setLateFeeAmount(val)}
                        placeholder="Fixed surcharge amount in ₹"
                        className="form-control form-control-sm"
                      />
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-outline-primary w-100 fw-semibold">
                  Save Billing Rules
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Rate History Table */}
      <div className="card-premium">
        <div className="card-premium-header">
          <div className="d-flex align-items-center gap-2">
            <History size={18} className="text-secondary" />
            <h5 className="fw-bold text-dark mb-0">Maintenance Rate History</h5>
          </div>
          <span className="small text-secondary">
            Strict accounting rule: Rate changes only take effect from the 1st of next month.
            Historical invoices are permanently locked.
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-premium align-middle mb-0">
            <thead>
              <tr>
                <th>Monthly Rate</th>
                <th>Effective From</th>
                <th>Effective To</th>
                <th>Status</th>
                <th>Reason / Approval Reference</th>
                <th>Recorded Date</th>
              </tr>
            </thead>
            <tbody>
              {rateHistory.map((rh) => (
                <tr key={rh.id}>
                  <td className="fw-bold text-dark fs-6">
                    <div className="d-flex align-items-center gap-2">
                      <TrendingUp size={16} className="text-primary" />
                      <span>₹{rh.amount.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="fw-semibold text-primary">{rh.effective_from}</td>
                  <td>{rh.effective_to || <span className="badge bg-success-subtle text-success">Current / Active</span>}</td>
                  <td>
                    {!rh.effective_to ? (
                      <span className="badge bg-success">ACTIVE</span>
                    ) : (
                      <span className="badge bg-secondary">HISTORICAL</span>
                    )}
                  </td>
                  <td className="small text-secondary">{rh.reason || "Standard rate"}</td>
                  <td className="small text-muted">{rh.created_at.split("T")[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate Change Modal */}
      {showRateModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title fw-bold text-dark">Schedule Maintenance Rate Revision</h5>
                <button type="button" className="btn-close" onClick={() => setShowRateModal(false)} />
              </div>

              <form onSubmit={handleSaveRateChange}>
                <div className="modal-body p-4">
                  <div className="alert alert-info d-flex align-items-start gap-2 small mb-3">
                    <AlertCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Accounting Protection:</strong> The new rate will take effect on the{" "}
                      <strong>1st of next month</strong>. Current and previous month invoices will
                      never be modified.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      New Monthly Maintenance Rate (₹)
                    </label>
                    <AmountInput
                      value={newRateAmount}
                      onChange={(val) => setNewRateAmount(val)}
                      placeholder="e.g. 1300"
                      className="form-control"
                      min={100}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Revision Reason / General Body Resolution
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={rateReason}
                      onChange={(e) => setRateReason(e.target.value)}
                      placeholder="e.g. Approved in AGM dated 25th March 2026 for increased security staff"
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowRateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom">
                    Confirm Rate Revision
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { DataStorage } from "@/services/dataStorage";
import { SocietyExpense, ExpenseCategory } from "@/types/database.types";
import { AmountInput } from "@/components/common/AmountInput/AmountInput";
import { formatDate } from "@/utils/dateFormatter";
import {
  Receipt,
  PlusCircle,
  Search,
  Trash2,
  Calendar,
  Wallet,
  TrendingDown,
  Building,
  Tag,
  Paperclip,
  Image as ImageIcon,
  Eye,
  X,
  Mail,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<SocietyExpense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "CASH" | "CHEQUE">("ONLINE");
  const [vendorName, setVendorName] = useState("");
  const [invoiceBillNo, setInvoiceBillNo] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [notifyResidents, setNotifyResidents] = useState(true);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const loadData = () => {
    setExpenses(DataStorage.getExpenses());
    setCategories(DataStorage.getCategories());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setTitle("");
    setCategoryId(categories.length > 0 ? categories[0].id : "");
    setAmount("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("ONLINE");
    setVendorName("");
    setInvoiceBillNo("");
    setDescription("");
    setAttachmentUrl(null);
    setNotifyResidents(true);
    setShowAddModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!title.trim() || amount === "" || isNaN(numAmount) || numAmount <= 0 || !categoryId) {
      toast.error("Please fill in all required expense fields with a valid amount");
      return;
    }

    try {
      const newExp = DataStorage.addExpense({
        category_id: categoryId,
        title: title.trim(),
        amount: numAmount,
        expense_date: expenseDate,
        payment_method: paymentMethod,
        vendor_name: vendorName.trim() || null,
        invoice_bill_no: invoiceBillNo.trim() || null,
        attachment_url: attachmentUrl,
        description: description.trim() || null,
        created_by: "admin@gmail.com",
      });

      toast.success(`Expense ₹${numAmount.toLocaleString()} recorded and debited from Society Wallet`);

      // Phase 3: Notify registered society residents if enabled
      if (notifyResidents) {
        const residents = DataStorage.getResidents().filter((r) => r.is_active && r.email);
        const cat = categories.find((c) => c.id === categoryId);
        const society = DataStorage.getSociety();

        if (residents.length > 0) {
          const recipientPayload = residents.map((r) => ({
            name: r.full_name,
            email: r.email,
            flatNumber: r.flat?.flat_number || "Society Resident",
          }));

          fetch("/api/mailer/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "EXPENSE_ALERT",
              recipients: recipientPayload,
              society,
              expenseData: {
                title: title.trim(),
                category: cat?.name || "General Maintenance",
                amount: numAmount,
                expenseDate,
                vendorName: vendorName.trim() || null,
                invoiceBillNo: invoiceBillNo.trim() || null,
                description: description.trim() || null,
              },
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.results) {
                data.results.forEach((logItem: any) => {
                  DataStorage.addEmailLog({
                    recipient_email: logItem.recipient_email,
                    recipient_name: logItem.recipient,
                    flat_number: logItem.flat_number,
                    subject: logItem.subject,
                    email_type: "EXPENSE_ALERT",
                    amount_due: numAmount,
                    status: logItem.status,
                    error_message: logItem.error_message,
                  });
                });
                toast.success(`Expenditure notice emailed to ${data.sentCount} society resident(s)`);
              }
            })
            .catch((err) => {
              console.error("Expense notification dispatch error:", err);
            });
        }
      }

      setShowAddModal(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record expense");
    }
  };

  const handleDeleteExpense = (id: string, expTitle: string, expAmount: number) => {
    if (confirm(`Delete expense "${expTitle}" of ₹${expAmount}? This will reverse the wallet debit.`)) {
      try {
        DataStorage.deleteExpense(id);
        toast.success(`Expense deleted and ₹${expAmount} credited back to Wallet`);
        loadData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete expense");
      }
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.vendor_name && exp.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exp.invoice_bill_no && exp.invoice_bill_no.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === "ALL" || exp.category_id === categoryFilter;
    const matchesMethod = methodFilter === "ALL" || exp.payment_method === methodFilter;

    return matchesSearch && matchesCategory && matchesMethod;
  });

  const totalExpenseSum = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="Society Expense Management"
        subtitle="Record vendor bills, utilities, security salaries, repairs, and maintain automated wallet debits"
        breadcrumbs={[{ label: "Expenses" }]}
        actions={
          <button className="btn btn-primary-custom" onClick={handleOpenAdd}>
            <PlusCircle size={16} />
            <span>Record New Expense</span>
          </button>
        }
      />

      {/* Top Expense KPI Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-4">
          <div className="stat-card border-start border-4 border-warning">
            <div className="stat-title">Total Expenses Recorded</div>
            <div className="stat-value text-dark">₹{totalExpenseSum.toLocaleString()}</div>
            <div className="small text-secondary mt-1">
              Across <strong className="text-dark">{expenses.length}</strong> audited vouchers
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-4">
          <div className="stat-card border-start border-4 border-primary">
            <div className="stat-title">Wallet Impact</div>
            <div className="stat-value text-danger d-flex align-items-center gap-1">
              <TrendingDown size={22} />
              <span>-₹{totalExpenseSum.toLocaleString()}</span>
            </div>
            <div className="small text-secondary mt-1">Automatically deducted from ledger</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-4">
          <div className="stat-card border-start border-4 border-info">
            <div className="stat-title">Active Categories</div>
            <div className="stat-value text-dark">{categories.length}</div>
            <div className="small text-secondary mt-1">Electricity, Lift AMC, Watchman, etc.</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-premium mb-4">
        <div className="p-3 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div className="d-flex flex-column flex-sm-row gap-2 flex-grow-1" style={{ maxWidth: "750px" }}>
            <div className="position-relative flex-grow-1">
              <Search size={16} className="position-absolute text-secondary" style={{ top: "10px", left: "12px" }} />
              <input
                type="text"
                className="form-control form-control-sm ps-5 bg-light"
                placeholder="Search expense title, vendor name, or bill no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select form-select-sm"
              style={{ width: "220px" }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="form-select form-select-sm"
              style={{ width: "160px" }}
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="ALL">All Modes</option>
              <option value="ONLINE">Online</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div className="small text-secondary">
            Showing <strong className="text-dark">{filteredExpenses.length}</strong> Expenses
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card-premium">
        <div className="table-responsive">
          <table className="table table-premium align-middle mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Expense Title</th>
                <th>Category</th>
                <th>Vendor / Payee</th>
                <th>Payment Mode</th>
                <th>Amount</th>
                <th>Attachment</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-secondary">
                    {searchTerm ? `No expenses matching "${searchTerm}"` : "No expenses recorded yet. Click 'Record New Expense' to log society bills."}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="small text-secondary font-monospace">{formatDate(exp.expense_date)}</td>
                    <td>
                      <div className="fw-bold text-dark">{exp.title}</div>
                      {exp.invoice_bill_no && (
                        <span className="small text-muted">Bill #: {exp.invoice_bill_no}</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-primary border">
                        <Tag size={12} className="me-1" />
                        {exp.category?.name || "General"}
                      </span>
                    </td>
                    <td className="small text-dark fw-medium">{exp.vendor_name || "—"}</td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {exp.payment_method}
                      </span>
                    </td>
                    <td className="fw-extrabold text-danger fs-6">
                      -₹{Number(exp.amount).toLocaleString()}
                    </td>
                    <td>
                      {exp.attachment_url ? (
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={exp.attachment_url}
                            alt="Bill preview"
                            className="rounded border cursor-pointer"
                            style={{ width: "36px", height: "36px", objectFit: "cover" }}
                            onClick={() => setPreviewImage({ url: exp.attachment_url!, title: exp.title })}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary p-1"
                            onClick={() => setPreviewImage({ url: exp.attachment_url!, title: exp.title })}
                            title="View Attachment"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted small">No photo</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-outline-danger btn-action-icon"
                          onClick={() => handleDeleteExpense(exp.id, exp.title, exp.amount)}
                          title="Delete & Reverse Debit"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title fw-bold text-dark">Record Society Expense</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
              </div>

              <form onSubmit={handleSaveExpense}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-sm-8">
                      <label className="form-label small fw-semibold text-secondary">
                        Expense Title / Description
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. MSEDCL Common Electricity Bill - April"
                        required
                      />
                    </div>

                    <div className="col-12 col-sm-4">
                      <label className="form-label small fw-semibold text-secondary">
                        Amount (₹) <span className="text-danger">*</span>
                      </label>
                      <AmountInput
                        value={amount}
                        onChange={(val) => setAmount(val)}
                        placeholder="e.g. 2500"
                        className="form-control font-monospace fs-5 fw-bold text-danger"
                        min={1}
                        required
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Expense Category
                      </label>
                      <select
                        className="form-select"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Payment Mode
                      </label>
                      <select
                        className="form-select"
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as "ONLINE" | "CASH" | "CHEQUE")
                        }
                      >
                        <option value="ONLINE">Online Transfer / Net Banking / UPI</option>
                        <option value="CASH">Cash</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Vendor / Payee Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        placeholder="e.g. MSEDCL, CleanWell Services"
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Expense Date
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Bill / Voucher / Invoice Number
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={invoiceBillNo}
                        onChange={(e) => setInvoiceBillNo(e.target.value)}
                        placeholder="e.g. INV-2026/04/91"
                      />
                    </div>

                    {/* Photo Attachment Option */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary d-flex align-items-center gap-1">
                        <Paperclip size={14} className="text-primary" />
                        <span>Add Photo Attachment (Bill / Cash Receipt / Invoice Photo)</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("Photo size should be less than 5MB");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setAttachmentUrl(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {attachmentUrl && (
                        <div className="mt-2 d-flex align-items-center gap-3 p-2 bg-light border rounded-3">
                          <img
                            src={attachmentUrl}
                            alt="Receipt preview"
                            className="rounded border"
                            style={{ width: "64px", height: "64px", objectFit: "cover" }}
                          />
                          <div className="flex-grow-1">
                            <span className="small fw-bold text-success d-block">Photo attached</span>
                            <span className="small text-muted">Will be permanently saved with this expense voucher</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setAttachmentUrl(null)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Phase 3: Expenditure Email Notification Option */}
                    <div className="col-12">
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="form-check form-switch mb-1">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="notifyResidentsSwitch"
                            checked={notifyResidents}
                            onChange={(e) => setNotifyResidents(e.target.checked)}
                          />
                          <label className="form-check-label fw-bold text-dark small" htmlFor="notifyResidentsSwitch">
                            Notify all registered society residents via email (Expenditure Alert)
                          </label>
                        </div>
                        <div className="small text-secondary ps-4">
                          An official transparency email with expense details, vendor, bill number, and amount will be dispatched to all registered occupants.
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary">
                        Additional Remarks
                      </label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide details about the work or items purchased"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom">
                    Record &amp; Debit Wallet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.8)", zIndex: 1090 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-dark text-white">
              <div className="modal-header border-bottom border-secondary px-4 py-3 d-flex justify-content-between align-items-center">
                <h6 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                  <ImageIcon size={18} className="text-primary" />
                  <span>{previewImage.title}</span>
                </h6>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light"
                  onClick={() => setPreviewImage(null)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body p-3 text-center bg-black d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
                <img
                  src={previewImage.url}
                  alt="Attachment Preview"
                  className="img-fluid rounded"
                  style={{ maxHeight: "75vh", maxWidth: "100%", objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

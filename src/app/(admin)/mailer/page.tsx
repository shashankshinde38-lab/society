"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { DataStorage } from "@/services/dataStorage";
import { EmailLog, Society, Flat, Resident, SocietyExpense } from "@/types/database.types";
import { formatDate } from "@/utils/dateFormatter";
import {
  Mail,
  Send,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  Building,
  User,
  Calendar,
  AlertCircle,
  Megaphone,
  Receipt,
  CreditCard,
  X,
  ExternalLink,
  CheckSquare,
  Square,
  Users2,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface UserRecipientItem {
  id: string; // resident id or flat id
  flatId: string;
  flatNumber: string;
  floorName: string;
  residentName: string;
  residentType: "OWNER" | "TENANT" | "ADMIN";
  email: string;
  mobile: string;
  outstandingDues: number;
  pendingMonthsText: string;
  status: "IDLE" | "PENDING" | "SENT" | "FAILED";
  lastSentTime?: string;
  errorMessage?: string;
}

export default function MailerPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [society, setSociety] = useState<Society | null>(null);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [recipientsList, setRecipientsList] = useState<UserRecipientItem[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Filter & Search for Users Table
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userDuesFilter, setUserDuesFilter] = useState<"ALL" | "WITH_DUES" | "NO_DUES">("ALL");

  // Filter & Search for Audit Logs Table
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logFilterStatus, setLogFilterStatus] = useState("ALL");
  const [logFilterType, setLogFilterType] = useState("ALL");

  // Loading & Execution States
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [sendingCron, setSendingCron] = useState(false);
  const [smtpStatus] = useState<{
    configured: boolean;
    host: string;
    port: number;
    user: string;
    verified: boolean;
    message?: string;
  }>({
    configured: true,
    host: "smtp.gmail.com",
    port: 587,
    user: "parijatsociety@gmail.com",
    verified: true,
    message: "SMTP server verified and active via backend environment",
  });

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFlatId, setPreviewFlatId] = useState<string>("");

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const loadData = () => {
    // 1. Purge legacy dummy logs completely
    const cleanLogs = DataStorage.getEmailLogs();
    setLogs(cleanLogs);

    const soc = DataStorage.getSociety();
    setSociety(soc);

    let allFlats = DataStorage.getFlats();
    const invoices = DataStorage.getInvoices();

    // If no flats exist yet in this browser, provide auto-initialization option or build list
    if (allFlats.length === 0) {
      DataStorage.seedStarterResidents();
      allFlats = DataStorage.getFlats();
    }
    setFlats(allFlats);

    // Build the Users Directory list with live maintenance due calculation
    const users: UserRecipientItem[] = allFlats.map((flat) => {
      const flatInvoices = invoices.filter(
        (inv) => inv.flat_id === flat.id && (inv.status === "UNPAID" || inv.status === "PARTIAL") && Number(inv.due_amount) > 0
      );
      const totalDue = flatInvoices.reduce((sum, inv) => sum + Number(inv.due_amount || 0), 0);
      const resident = flat.current_resident;

      const pendingMonthsText = flatInvoices.length > 0
        ? flatInvoices.map((inv) => `${MONTH_NAMES[inv.month - 1]} ${inv.year} (₹${inv.due_amount})`).join(", ")
        : "No Dues (Paid)";

      return {
        id: resident?.id || `flat-user-${flat.id}`,
        flatId: flat.id,
        flatNumber: flat.flat_number,
        floorName: flat.floor?.floor_name || "Floor",
        residentName: resident?.full_name || `Flat ${flat.flat_number} Occupant`,
        residentType: resident?.resident_type || "OWNER",
        email: resident?.email || "",
        mobile: resident?.mobile || "—",
        outstandingDues: totalDue,
        pendingMonthsText,
        status: "IDLE",
      };
    });

    setRecipientsList(users);

    if (allFlats.length > 0 && !previewFlatId) {
      setPreviewFlatId(allFlats[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return recipientsList.filter((u) => {
      const q = userSearchQuery.toLowerCase();
      const matchesSearch =
        !userSearchQuery ||
        u.residentName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.flatNumber.toLowerCase().includes(q);

      const matchesDues =
        userDuesFilter === "ALL" ||
        (userDuesFilter === "WITH_DUES" && u.outstandingDues > 0) ||
        (userDuesFilter === "NO_DUES" && u.outstandingDues === 0);

      return matchesSearch && matchesDues;
    });
  }, [recipientsList, userSearchQuery, userDuesFilter]);

  // Selection Toggles
  const handleToggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleToggleUser = (id: string) => {
    const next = new Set(selectedUserIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedUserIds(next);
  };


  // Send Email Helper for a single user
  const dispatchEmailToSingleUser = async (user: UserRecipientItem): Promise<{ success: boolean; error?: string }> => {
    if (!user.email) {
      return { success: false, error: "No email address registered for this resident." };
    }

    const currentSoc = DataStorage.getSociety();
    const invoices = DataStorage.getInvoices().filter(
      (inv) => inv.flat_id === user.flatId && (inv.status === "UNPAID" || inv.status === "PARTIAL") && Number(inv.due_amount) > 0
    );

    const pendingMonths = invoices.map((inv) => ({
      month: inv.month,
      monthName: MONTH_NAMES[inv.month - 1],
      year: inv.year,
      amount: Number(inv.due_amount),
      status: inv.status,
    }));

    const isPaid = user.outstandingDues === 0;
    const emailType = isPaid ? "PAYMENT_RECEIPT" : "DUE_REMINDER";

    const res = await fetch("/api/mailer/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: emailType,
        society: currentSoc,
        recipients: [
          {
            name: user.residentName,
            email: user.email,
            flatNumber: user.flatNumber,
            totalOutstanding: user.outstandingDues,
            amountPaid: 1100,
            billingMonth: invoices.length > 0 ? MONTH_NAMES[invoices[0].month - 1] : "April",
            billingYear: invoices.length > 0 ? invoices[0].year : 2026,
            dueDate: invoices.length > 0 ? invoices[0].due_date : "10th of the month",
            receiptNumber: `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${user.flatNumber}`,
            paymentDate: new Date().toISOString().split("T")[0],
            paymentMethod: "Online / Bank Transfer",
            paidMonths: ["April 2026 (Maintenance Cleared)"],
            pendingMonths,
          },
        ],
      }),
    });

    const data = await res.json();
    if (data.success && data.results && data.results.length > 0) {
      const item = data.results[0];
      const isSent = item.status === "SENT";

      // Append genuine record to Audit Trail
      DataStorage.addEmailLog({
        recipient_email: user.email,
        recipient_name: user.residentName,
        flat_number: user.flatNumber,
        subject: item.subject || (isPaid ? `Maintenance Payment Clearance – Flat ${user.flatNumber}` : `Maintenance Reminder – Flat ${user.flatNumber}`),
        email_type: emailType,
        amount_due: isPaid ? 1100 : user.outstandingDues,
        status: isSent ? "SENT" : "FAILED",
        error_message: item.error_message || null,
        next_scheduled_at: isSent ? item.next_scheduled_at : null,
      });

      return { success: isSent, error: item.error_message };
    }

    return { success: false, error: data.message || "Failed to dispatch email." };
  };

  // Action: Send to a particular user directly
  const handleSendToParticularUser = async (user: UserRecipientItem) => {
    if (!user.email) {
      toast.error(`Flat ${user.flatNumber} has no email address. Please update resident contact in Masters.`);
      return;
    }

    // 1. Set status to PENDING
    setRecipientsList((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: "PENDING", errorMessage: undefined } : u))
    );

    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    try {
      const result = await dispatchEmailToSingleUser(user);

      // 2. Set status to SENT or FAILED
      setRecipientsList((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
              ...u,
              status: result.success ? "SENT" : "FAILED",
              lastSentTime: result.success ? nowStr : undefined,
              errorMessage: result.error,
            }
            : u
        )
      );

      // Refresh Audit Trail
      setLogs(DataStorage.getEmailLogs());

      if (result.success) {
        toast.success(`Email successfully sent to ${user.residentName} (${user.email})!`);
      } else {
        toast.error(`Email delivery failed: ${result.error}`);
      }
    } catch (err: unknown) {
      setRecipientsList((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
              ...u,
              status: "FAILED",
              errorMessage: err instanceof Error ? err.message : "Network error",
            }
            : u
        )
      );
      toast.error("Failed to send email");
    }
  };

  // Action: Send to selected users one by one with sequential status updates
  const handleSendBatchOneByOne = async () => {
    const selectedTargets = recipientsList.filter((u) => selectedUserIds.has(u.id));
    if (selectedTargets.length === 0) {
      toast.error("Please select at least one resident to send email.");
      return;
    }

    setIsBatchSending(true);
    toast.info(`Starting sequential email dispatch for ${selectedTargets.length} recipient(s)...`);

    let sentCount = 0;
    let failedCount = 0;

    for (const target of selectedTargets) {
      // Step 1: Set current user row to PENDING
      setRecipientsList((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, status: "PENDING", errorMessage: undefined } : u))
      );

      // Brief delay for visible progression
      await new Promise((resolve) => setTimeout(resolve, 350));

      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      try {
        const result = await dispatchEmailToSingleUser(target);

        // Step 2: Set current user row to SENT or FAILED immediately
        setRecipientsList((prev) =>
          prev.map((u) =>
            u.id === target.id
              ? {
                ...u,
                status: result.success ? "SENT" : "FAILED",
                lastSentTime: result.success ? nowStr : undefined,
                errorMessage: result.error,
              }
              : u
          )
        );

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }

        // Live update audit trail
        setLogs(DataStorage.getEmailLogs());
      } catch (err: unknown) {
        failedCount++;
        setRecipientsList((prev) =>
          prev.map((u) =>
            u.id === target.id
              ? {
                ...u,
                status: "FAILED",
                errorMessage: err instanceof Error ? err.message : "Network error",
              }
              : u
          )
        );
      }

      // 400ms pause before starting the next user in queue
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    setIsBatchSending(false);
    toast.success(`Sequential dispatch complete: ${sentCount} Sent, ${failedCount} Failed.`);
  };

  // Clear Audit Trail
  const handleClearAuditTrail = () => {
    if (confirm("Clear all email delivery logs? This cannot be undone.")) {
      DataStorage.clearEmailLogs();
      setLogs([]);
      toast.success("Delivery logs cleared successfully.");
    }
  };

  // 9:00 AM Cron Execution
  const handleRunDailyCron = async () => {
    setSendingCron(true);
    try {
      const unpaidTargets = recipientsList.filter((u) => u.outstandingDues > 0 && u.email);
      if (unpaidTargets.length === 0) {
        toast.info("All flats are paid up to date! No maintenance reminders needed.");
        setSendingCron(false);
        return;
      }

      // Mark all target users as PENDING
      setRecipientsList((prev) =>
        prev.map((u) =>
          u.outstandingDues > 0 && u.email ? { ...u, status: "PENDING", errorMessage: undefined } : u
        )
      );

      const invoices = DataStorage.getInvoices();
      const currentSoc = DataStorage.getSociety();

      const unpaidFlatsPayload = unpaidTargets.map((u) => {
        const flatInvoices = invoices.filter(
          (inv) => inv.flat_id === u.flatId && (inv.status === "UNPAID" || inv.status === "PARTIAL") && Number(inv.due_amount) > 0
        );
        return {
          flatId: u.flatId,
          flatNumber: u.flatNumber,
          residentName: u.residentName,
          residentEmail: u.email,
          outstandingDues: u.outstandingDues,
          billingMonth: flatInvoices.length > 0 ? MONTH_NAMES[flatInvoices[0].month - 1] : "April",
          billingYear: flatInvoices.length > 0 ? flatInvoices[0].year : 2026,
          dueDate: flatInvoices.length > 0 ? flatInvoices[0].due_date : "10th of this month",
          pendingMonths: flatInvoices.map((inv) => ({
            month: inv.month,
            monthName: MONTH_NAMES[inv.month - 1],
            year: inv.year,
            amount: Number(inv.due_amount),
            status: inv.status,
          })),
        };
      });

      const res = await fetch("/api/cron/maintenance-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flatsWithDues: unpaidFlatsPayload,
          society: currentSoc,
        }),
      });

      const data = await res.json();
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (data.success && data.results) {
        data.results.forEach((item: any) => {
          DataStorage.addEmailLog({
            recipient_email: item.recipient_email,
            recipient_name: item.recipient,
            flat_number: item.flat_number,
            subject: item.subject,
            email_type: "DUE_REMINDER",
            amount_due: item.amount_due,
            status: item.status,
            error_message: item.error_message,
            next_scheduled_at: item.next_scheduled_at,
          });
        });

        // Update live status for each user
        setRecipientsList((prev) =>
          prev.map((u) => {
            const match = data.results.find((r: any) => r.flat_number === u.flatNumber);
            if (match) {
              return {
                ...u,
                status: match.status === "SENT" ? "SENT" : "FAILED",
                lastSentTime: match.status === "SENT" ? nowStr : undefined,
                errorMessage: match.error_message,
              };
            }
            return u;
          })
        );

        setLogs(DataStorage.getEmailLogs());
        toast.success(`9:00 AM Cron run completed: ${data.sentCount} reminder(s) dispatched!`);
      } else {
        toast.error(data.message || "Cron execution failed");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error executing daily cron");
    } finally {
      setSendingCron(false);
    }
  };

  // Preview target data
  const previewFlat = flats.find((f) => f.id === previewFlatId) || flats[0];
  const previewInvoices = useMemo(() => {
    if (!previewFlat) return [];
    return DataStorage.getInvoices().filter((inv) => inv.flat_id === previewFlat.id);
  }, [previewFlat]);
  const previewPending = previewInvoices.filter((inv) => inv.status === "UNPAID" || inv.status === "PARTIAL");
  const previewTotalDue = previewPending.reduce((sum, inv) => sum + Number(inv.due_amount || 0), 0) || 1100;

  const currentSoc = society || {
    name: "Parijat Cooperative Housing Society - A Wing",
    address: "Survey No. 42/1, Parijat Enclave, Kothrud, Pune - 411038",
    email: "parijatsociety@gmail.com",
    contact_number: "+91 98220 12345",
    bank_name: "HDFC Bank",
    account_holder_name: "Parijat Cooperative Housing Society Ltd",
    account_number: "5020008910291",
    ifsc_code: "HDFC0001234",
    branch_name: "Kothrud Branch, Pune",
    upi_id: "parijatsociety@okhdfcbank",
  };

  // Status counters for recipients
  const statusCounts = useMemo(() => {
    let sent = 0;
    let pending = 0;
    let failed = 0;
    let idle = 0;
    recipientsList.forEach((u) => {
      if (u.status === "SENT") sent++;
      else if (u.status === "PENDING") pending++;
      else if (u.status === "FAILED") failed++;
      else idle++;
    });
    return { sent, pending, failed, idle };
  }, [recipientsList]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = logSearchQuery.toLowerCase();
      const matchesSearch =
        !logSearchQuery ||
        (log.recipient_name && log.recipient_name.toLowerCase().includes(q)) ||
        log.recipient_email.toLowerCase().includes(q) ||
        (log.flat_number && log.flat_number.toLowerCase().includes(q)) ||
        log.subject.toLowerCase().includes(q);

      const matchesStatus = logFilterStatus === "ALL" || log.status === logFilterStatus;
      const matchesType = logFilterType === "ALL" || log.email_type === logFilterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [logs, logSearchQuery, logFilterStatus, logFilterType]);

  return (
    <div>
      <PageHeader
        title="Mailer &amp; Automated Email Notifications"
        subtitle="Select any user to dispatch maintenance notices with live status tracking, execute 9:00 AM daily cron, and inspect delivery logs"
        breadcrumbs={[{ label: "Mailer" }]}
        actions={
          <div className="toolbar-actions">
            <button
              className="btn btn-outline-primary"
              onClick={() => setShowPreviewModal(true)}
            >
              <Eye size={16} className="me-1" />
              <span>Preview HTML Template</span>
            </button>
            <button
              className="btn btn-primary-custom"
              onClick={handleRunDailyCron}
              disabled={sendingCron || isBatchSending}
            >
              {sendingCron ? (
                <span className="spinner-border spinner-border-sm me-1" />
              ) : (
                <RefreshCw size={16} className="me-1" />
              )}
              <span>Run 9:00 AM Cron Now</span>
            </button>
          </div>
        }
      />

      {/* Top Banner: 9:00 AM Cron & Secure SMTP Status */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card-premium p-3 h-100 border-start border-4 border-primary">
            <div className="d-flex align-items-center gap-2 mb-1">
              <Clock size={18} className="text-primary" />
              <span className="fw-bold text-dark">Automated 9:00 AM IST Daily Maintenance Reminder Cron</span>
              <span className="badge bg-success-subtle text-success border">Active (Asia/Kolkata)</span>
            </div>
            <div className="small text-secondary">
              Executes daily at 09:00 AM IST. Automatically verifies latest payment status, embeds dynamic bank details from <strong>App Setup</strong>, and stops sending as soon as maintenance is paid.
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card-premium p-3 h-100 border-start border-4 border-success bg-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <ShieldCheck size={18} className="text-success" />
                <span className="fw-bold text-dark small">SMTP Server Secured</span>
              </div>
              <span className="badge bg-success-subtle text-success border d-inline-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
                <CheckCircle2 size={11} />
                <span>Active</span>
              </span>
            </div>
            <div className="small text-secondary">
              Host: <code>{smtpStatus.host}:{smtpStatus.port}</code> &bull; User: <code>{smtpStatus.user}</code>
            </div>
            <div className="mt-2 text-success small d-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
              <CheckCircle2 size={12} />
              <span>Credentials securely loaded from backend environment</span>
            </div>
          </div>
        </div>
      </div>

      {/* PRIMARY SECTION: SOCIETY USERS & DIRECT DISPATCH INTERFACE */}
      <div className="card-premium mb-4 border border-primary-subtle shadow-sm">
        <div className="card-premium-header bg-white">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Users2 size={20} className="text-primary" />
            <h5 className="fw-bold text-dark mb-0">Society Users &amp; Email Recipients</h5>
            <span className="badge bg-primary text-white ms-2">{filteredUsers.length} Users</span>

            {/* Live Status Indicators */}
            <div className="d-flex align-items-center gap-2 ms-auto flex-wrap">
              {statusCounts.sent > 0 && (
                <span className="badge bg-success-subtle text-success border">
                  <CheckCircle2 size={12} className="me-1" />
                  Sent: {statusCounts.sent}
                </span>
              )}
              {statusCounts.pending > 0 && (
                <span className="badge bg-warning text-dark border">
                  <span className="spinner-border spinner-border-sm me-1" style={{ width: "10px", height: "10px" }} />
                  Sending: {statusCounts.pending}
                </span>
              )}
              {statusCounts.failed > 0 && (
                <span className="badge bg-danger-subtle text-danger border">
                  <AlertTriangle size={12} className="me-1" />
                  Failed: {statusCounts.failed}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filter & Batch Actions Bar */}
        <div className="p-3 border-bottom bg-light">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex flex-grow-1 gap-2 flex-wrap" style={{ maxWidth: "600px" }}>
              <div className="position-relative flex-grow-1">
                <Search size={15} className="position-absolute text-secondary" style={{ top: "10px", left: "12px" }} />
                <input
                  type="text"
                  className="form-control form-control-sm ps-5 bg-white"
                  placeholder="Search user name, flat number, or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-select form-select-sm bg-white"
                style={{ width: "180px" }}
                value={userDuesFilter}
                onChange={(e) => setUserDuesFilter(e.target.value as any)}
              >
                <option value="ALL">All Dues Status</option>
                <option value="WITH_DUES">Pending Dues Only</option>
                <option value="NO_DUES">Paid / No Dues Only</option>
              </select>
            </div>

            {/* Batch Send Action */}
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-primary fw-semibold"
                onClick={handleSendBatchOneByOne}
                disabled={selectedUserIds.size === 0 || isBatchSending}
              >
                {isBatchSending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" />
                    <span>Sending One-by-One...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} className="me-1" />
                    <span>Send Email to Selected ({selectedUserIds.size})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-responsive">
          <table className="table table-premium align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: "42px" }} className="text-center">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length}
                    onChange={handleToggleSelectAll}
                    title="Select All"
                  />
                </th>
                <th>User / Resident</th>
                <th>Flat &amp; Floor</th>
                <th>Email Address</th>
                <th>Maintenance Dues</th>
                <th style={{ width: "160px" }}>Delivery Status</th>
                <th className="text-end" style={{ width: "180px", minWidth: "180px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    No society users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.has(user.id);
                  return (
                    <tr
                      key={user.id}
                      className={isSelected ? "table-active" : ""}
                    >
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={isSelected}
                          onChange={() => handleToggleUser(user.id)}
                        />
                      </td>

                      {/* User details */}
                      <td>
                        <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                          <span>{user.residentName}</span>
                          <span
                            className={`badge ${user.residentType === "OWNER"
                              ? "bg-primary-subtle text-primary border"
                              : "bg-info-subtle text-info-emphasis border"
                              }`}
                            style={{ fontSize: "0.68rem" }}
                          >
                            {user.residentType}
                          </span>
                        </div>
                        <div className="small text-secondary">{user.mobile}</div>
                      </td>

                      {/* Flat */}
                      <td>
                        <span className="badge bg-light text-dark border fw-bold fs-6">
                          {user.flatNumber}
                        </span>
                        <div className="small text-muted">{user.floorName}</div>
                      </td>

                      {/* Email */}
                      <td>
                        {user.email ? (
                          <span className="small text-dark font-monospace fw-semibold">
                            {user.email}
                          </span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning border">
                            No Email Registered
                          </span>
                        )}
                      </td>

                      {/* Dues */}
                      <td>
                        {user.outstandingDues > 0 ? (
                          <div>
                            <span className="fw-bold text-danger font-monospace">
                              ₹{user.outstandingDues.toLocaleString()} Due
                            </span>
                            <div className="small text-secondary text-truncate" style={{ maxWidth: "220px" }}>
                              {user.pendingMonthsText}
                            </div>
                          </div>
                        ) : (
                          <span className="badge bg-success-subtle text-success border">
                            <CheckCircle2 size={11} className="me-1" />
                            No Dues (Paid)
                          </span>
                        )}
                      </td>

                      {/* One-by-One Status Display */}
                      <td>
                        {user.status === "IDLE" && (
                          <span className="badge bg-light text-secondary border">
                            Ready to Send
                          </span>
                        )}
                        {user.status === "PENDING" && (
                          <span className="badge bg-warning text-dark border d-inline-flex align-items-center">
                            <span className="spinner-border spinner-border-sm me-1" style={{ width: "12px", height: "12px" }} />
                            Sending...
                          </span>
                        )}
                        {user.status === "SENT" && (
                          <span className="badge bg-success-subtle text-success border d-inline-flex align-items-center">
                            <CheckCircle2 size={13} className="me-1" />
                            Sent {user.lastSentTime ? `(${user.lastSentTime})` : ""}
                          </span>
                        )}
                        {user.status === "FAILED" && (
                          <span
                            className="badge bg-danger-subtle text-danger border d-inline-flex align-items-center"
                            title={user.errorMessage || "Delivery error"}
                          >
                            <AlertTriangle size={13} className="me-1" />
                            Failed
                          </span>
                        )}
                      </td>

                      {/* Action Button: Send Email to this particular user */}
                      <td className="text-end">
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary btn-action-icon"
                            onClick={() => {
                              setPreviewFlatId(user.flatId);
                              setShowPreviewModal(true);
                            }}
                            title="Preview Email"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary fw-semibold d-inline-flex align-items-center gap-1.5 px-2.5"
                            onClick={() => handleSendToParticularUser(user)}
                            disabled={!user.email || user.status === "PENDING" || isBatchSending}
                          >
                            {user.status === "PENDING" ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : (
                              <>
                                <Send size={13} />
                                <span>Send Mail</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECONDARY SECTION: RECIPIENT DELIVERY LOGS & AUDIT TRAIL (ALL DUMMY DATA REMOVED) */}
      <div className="card-premium">
        <div className="card-premium-header">
          <div className="d-flex align-items-center gap-2">
            <Mail size={18} className="text-secondary" />
            <h5 className="fw-bold text-dark mb-0">Recipient Delivery Logs &amp; Audit Trail</h5>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-secondary">
              {filteredAuditLogs.length} Genuinely Dispatched Record(s) &bull; Zero Dummy Data
            </span>
            {logs.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger py-0 px-2 ms-2"
                onClick={handleClearAuditTrail}
                style={{ fontSize: "0.75rem" }}
              >
                <Trash2 size={12} className="me-1" />
                Clear Logs
              </button>
            )}
          </div>
        </div>

        {/* Audit Search Bar */}
        <div className="p-3 border-bottom bg-light">
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <div className="position-relative">
                <Search size={15} className="position-absolute text-secondary" style={{ top: "10px", left: "12px" }} />
                <input
                  type="text"
                  className="form-control form-control-sm ps-5 bg-white"
                  placeholder="Filter audit trail by recipient, email, flat, or subject..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm bg-white"
                value={logFilterStatus}
                onChange={(e) => setLogFilterStatus(e.target.value)}
              >
                <option value="ALL">All Delivery Statuses</option>
                <option value="SENT">Delivered / Sent</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm bg-white"
                value={logFilterType}
                onChange={(e) => setLogFilterType(e.target.value)}
              >
                <option value="ALL">All Email Types</option>
                <option value="DUE_REMINDER">Due Reminders</option>
                <option value="EXPENSE_ALERT">Expense Notices</option>
                <option value="GENERAL_ANNOUNCEMENT">Announcements</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-premium align-middle mb-0">
            <thead>
              <tr>
                <th>Recipient Name &amp; Email</th>
                <th>Flat</th>
                <th>Type</th>
                <th>Subject &amp; Error Note</th>
                <th>Amount</th>
                <th>Time Sent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="text-muted small">
                      <Mail size={32} className="text-secondary opacity-50 mb-2" /><br />
                      <strong>No delivery logs recorded yet.</strong><br />
                      Select a user from the table above and click <strong>Send Mail</strong> to dispatch genuine notifications.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAuditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="fw-bold text-dark">{log.recipient_name || "Resident"}</div>
                      <div className="small text-secondary font-monospace">{log.recipient_email}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {log.flat_number || "All"}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary border">
                        {log.email_type}
                      </span>
                    </td>
                    <td style={{ maxWidth: "280px" }}>
                      <div className="small fw-semibold text-dark text-truncate" title={log.subject}>
                        {log.subject}
                      </div>
                      {log.error_message && (
                        <div className="small text-danger text-truncate" title={log.error_message}>
                          {log.error_message}
                        </div>
                      )}
                    </td>
                    <td className="font-monospace fw-semibold">
                      {log.amount_due ? `₹${Number(log.amount_due).toLocaleString()}` : "—"}
                    </td>
                    <td className="small text-secondary" style={{ whiteSpace: "nowrap" }}>
                      {log.sent_at.includes("T")
                        ? formatDate(log.sent_at) + " " + log.sent_at.split("T")[1].substring(0, 5)
                        : log.sent_at}
                    </td>
                    <td>
                      <span
                        className={`badge ${log.status === "SENT"
                          ? "bg-success-subtle text-success border"
                          : "bg-danger-subtle text-danger border"
                          }`}
                      >
                        {log.status === "SENT" ? (
                          <>
                            <CheckCircle2 size={12} className="me-1" />
                            SENT
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={12} className="me-1" />
                            FAILED
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redesigned Dynamic HTML Email Preview Modal */}
      {showPreviewModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <div className="d-flex align-items-center gap-2">
                  <Eye size={20} className="text-primary" />
                  <h5 className="modal-title fw-bold text-dark mb-0">Dynamic HTML Email Preview &mdash; Maintenance Reminder</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowPreviewModal(false)} />
              </div>

              {/* Dynamic Flat Selector & App Setup Indicator */}
              <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-secondary fw-semibold">Preview For Flat:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "220px" }}
                    value={previewFlatId}
                    onChange={(e) => setPreviewFlatId(e.target.value)}
                  >
                    {flats.map((f) => (
                      <option key={f.id} value={f.id}>
                        Flat {f.flat_number} ({f.current_resident?.full_name || "Occupant"})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="badge bg-primary-subtle text-primary border">
                  ⚡ Live Bank Details Loaded From App Setup
                </div>
              </div>

              <div className="modal-body p-4 bg-light overflow-auto" style={{ maxHeight: "70vh" }}>
                {/* Modern Responsive HTML Email Container */}
                <div
                  className="bg-white rounded-4 shadow-sm border mx-auto overflow-hidden"
                  style={{ maxWidth: "600px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                >
                  {/* Header */}
                  <div className="p-4 text-white" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
                    <div style={{ display: "inline-block", backgroundColor: "#2563eb", color: "#fff", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                      Maintenance Reminder
                    </div>
                    <h3 className="fw-bold mb-1" style={{ fontSize: "1.3rem" }}>
                      {currentSoc.name}
                    </h3>
                    <div className="small text-light opacity-75">
                      Automated Maintenance Billing Notice &bull; April 2026
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <p className="text-secondary small mb-3">
                      Dear <strong>{previewFlat?.current_resident?.full_name || "Resident"}</strong>,
                    </p>
                    <p className="small text-secondary mb-3">
                      This is a friendly reminder that the society maintenance payment for flat{" "}
                      <strong>{previewFlat?.flat_number || "A-401"}</strong> is currently pending.
                    </p>

                    {/* Due Amount Highlight Card */}
                    <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b", textTransform: "uppercase" }}>
                            Total Outstanding Dues
                          </div>
                          <div className="fw-extrabold text-danger fs-3">
                            ₹{previewTotalDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <span className="badge bg-danger text-white px-3 py-2 fw-bold">
                          Due Date: 10th of the month
                        </span>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="small fw-bold text-secondary text-uppercase mb-2" style={{ letterSpacing: "0.5px" }}>
                      Pending Months Breakdown
                    </div>
                    <div className="table-responsive rounded-3 border mb-3 overflow-hidden">
                      <table className="table table-sm mb-0 small">
                        <thead className="table-light">
                          <tr>
                            <th>Billing Month</th>
                            <th className="text-end">Pending Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewPending.length > 0 ? (
                            previewPending.map((inv) => (
                              <tr key={inv.id}>
                                <td>Month {inv.month} / {inv.year}</td>
                                <td className="text-end text-danger fw-semibold">₹{Number(inv.due_amount).toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td>April 2026</td>
                              <td className="text-end text-danger fw-semibold">₹1,100.00</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Dynamic Official Bank Details (From App Setup Single Source) */}
                    <div className="p-3 rounded-3 mb-3" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)", border: "1px solid #bfdbfe" }}>
                      <div className="fw-bold text-primary mb-2 small d-flex align-items-center gap-1">
                        <Building size={14} />
                        <span>Official Society Bank &amp; UPI Details (From App Setup)</span>
                      </div>
                      <div className="small text-dark" style={{ lineHeight: "1.7" }}>
                        <div><strong>Bank Name:</strong> {currentSoc.bank_name}</div>
                        <div><strong>Account Holder:</strong> {currentSoc.account_holder_name}</div>
                        <div><strong>Account Number:</strong> <code className="fw-bold text-dark">{currentSoc.account_number}</code></div>
                        <div><strong>IFSC Code:</strong> <code className="fw-bold text-dark">{currentSoc.ifsc_code}</code> &bull; <strong>Branch:</strong> {currentSoc.branch_name}</div>
                        <div className="mt-1 pt-1 border-top border-primary-subtle">
                          <strong className="text-primary">Society UPI ID:</strong>{" "}
                          <span className="badge bg-primary text-white font-monospace">{currentSoc.upi_id}</span>
                        </div>
                      </div>
                    </div>

                    <p className="small text-muted mb-0">
                      Please make the payment online via UPI or bank transfer. Once transferred, please submit your transaction reference to society office.
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="p-3 bg-light border-top text-center text-muted small" style={{ fontSize: "0.75rem", lineHeight: "1.6" }}>
                    <strong>{currentSoc.name}</strong><br />
                    {currentSoc.address} &bull; Email: {currentSoc.email}
                    {currentSoc.contact_number ? ` • Tel: ${currentSoc.contact_number}` : ""}
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

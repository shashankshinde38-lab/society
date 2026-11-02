"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { Mail, Send, CheckCircle2, Clock, Eye, Settings, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface EmailLogItem {
  id: string;
  recipient: string;
  flat: string;
  subject: string;
  type: string;
  status: "SENT" | "PENDING" | "FAILED";
  sentAt: string;
}

const INITIAL_EMAIL_LOGS: EmailLogItem[] = [
  {
    id: "log-1",
    recipient: "suresh.kulkarni@gmail.com",
    flat: "A-401",
    subject: "Maintenance Payment Reminder – April 2026 – Flat A-401",
    type: "DUE_REMINDER",
    status: "SENT",
    sentAt: "2026-04-10 10:00 AM",
  },
  {
    id: "log-2",
    recipient: "anita.joshi@gmail.com",
    flat: "A-204",
    subject: "Payment Confirmation Receipt: REC-202604-1002 (₹6,600)",
    type: "PAYMENT_RECEIPT",
    status: "SENT",
    sentAt: "2026-04-02 10:35 AM",
  },
  {
    id: "log-3",
    recipient: "rajesh.sharma@gmail.com",
    flat: "A-101",
    subject: "Payment Confirmation Receipt: REC-202604-1001 (₹1,100)",
    type: "PAYMENT_RECEIPT",
    status: "SENT",
    sentAt: "2026-04-04 11:05 AM",
  },
  {
    id: "log-4",
    recipient: "parijat.committee@gmail.com",
    flat: "Admin",
    subject: "New Society Expense Added: MSEDCL Common Electricity (₹14,250)",
    type: "EXPENSE_ALERT",
    status: "SENT",
    sentAt: "2026-04-12 10:05 AM",
  },
];

export default function MailerPage() {
  const [logs, setLogs] = useState<EmailLogItem[]>(INITIAL_EMAIL_LOGS);
  const [sending, setSending] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<"REMINDER" | "RECEIPT">("REMINDER");

  // SMTP Settings
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("parijatsociety@gmail.com");
  const [senderName, setSenderName] = useState("Parijat Society Office");

  const handleSendDueRemindersNow = () => {
    setSending(true);
    setTimeout(() => {
      const newLog: EmailLogItem = {
        id: "log-" + Date.now(),
        recipient: "suresh.kulkarni@gmail.com",
        flat: "A-401",
        subject: "Urgent Maintenance Reminder – April 2026 – Flat A-401",
        type: "DUE_REMINDER",
        status: "SENT",
        sentAt: "Just now",
      };
      setLogs([newLog, ...logs]);
      setSending(false);
      toast.success("Automated reminder dispatched to 1 flat with outstanding dues (Flat A-401)!");
    }, 1200);
  };

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("SMTP notification settings saved successfully");
  };

  return (
    <div>
      <PageHeader
        title="Mailer &amp; Automated Email Notifications"
        subtitle="Manage scheduled 5-day cycle maintenance reminders, payment confirmations, and SMTP configurations"
        breadcrumbs={[{ label: "Mailer" }]}
        actions={
          <button
            className="btn btn-primary-custom"
            onClick={handleSendDueRemindersNow}
            disabled={sending}
          >
            {sending ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              <Send size={16} />
            )}
            <span>Send Dues Reminders Now</span>
          </button>
        }
      />

      {/* Auto-Reminder Schedule Info Banner */}
      <div className="card-premium p-3 mb-4 border-start border-4 border-primary">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <div className="fw-bold text-dark">Automated Cron Schedule Active (Asia/Kolkata)</div>
            <div className="small text-secondary">
              Reminders trigger automatically on <strong>5th, 10th, 15th, 20th, 25th, and 30th</strong> of every
              month at 09:00 AM. Reminders are sent <strong>only</strong> to flats with outstanding balances and stop
              immediately once paid.
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                setPreviewTemplate("REMINDER");
                setShowPreviewModal(true);
              }}
            >
              <Eye size={14} className="me-1" />
              Preview Reminder Email
            </button>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Email Logs Table */}
        <div className="col-12 col-lg-8">
          <div className="card-premium h-100">
            <div className="card-premium-header">
              <div className="d-flex align-items-center gap-2">
                <Mail size={18} className="text-primary" />
                <h5 className="fw-bold text-dark mb-0">Sent Email History</h5>
              </div>
              <span className="small text-secondary">Last 30 days delivery log</span>
            </div>

            <div className="table-responsive">
              <table className="table table-premium align-middle mb-0">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Flat</th>
                    <th>Subject</th>
                    <th>Sent At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="fw-semibold text-dark small">{log.recipient}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{log.flat}</span>
                      </td>
                      <td className="small text-secondary" style={{ maxWidth: "260px" }}>
                        {log.subject}
                      </td>
                      <td className="small text-muted" style={{ whiteSpace: "nowrap" }}>
                        {log.sentAt}
                      </td>
                      <td>
                        <span className="badge bg-success-subtle text-success border">
                          <CheckCircle2 size={12} className="me-1" />
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SMTP Configuration Card */}
        <div className="col-12 col-lg-4">
          <div className="card-premium h-100">
            <div className="card-premium-header">
              <div className="d-flex align-items-center gap-2">
                <Settings size={18} className="text-secondary" />
                <h6 className="fw-bold text-dark mb-0">SMTP Server Configuration</h6>
              </div>
            </div>

            <form onSubmit={handleSaveSmtp} className="p-4">
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">SMTP Host</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  required
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-8">
                  <label className="form-label small fw-semibold text-secondary">Sender Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-4">
                  <label className="form-label small fw-semibold text-secondary">Port</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">SMTP Username / Email</label>
                <input
                  type="email"
                  className="form-control form-control-sm"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-secondary">App Password</label>
                <input
                  type="password"
                  className="form-control form-control-sm"
                  placeholder="••••••••••••••••"
                  defaultValue="app-password-secret"
                />
              </div>

              <button type="submit" className="btn btn-outline-primary w-100 btn-sm fw-semibold">
                Save SMTP Settings
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* HTML Email Template Preview Modal */}
      {showPreviewModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title fw-bold text-dark">HTML Email Preview &mdash; Maintenance Reminder</h5>
                <button type="button" className="btn-close" onClick={() => setShowPreviewModal(false)} />
              </div>

              <div className="modal-body p-4 bg-light">
                {/* Simulated Responsive HTML Email */}
                <div
                  className="bg-white rounded-3 shadow-sm border mx-auto overflow-hidden"
                  style={{ maxWidth: "600px", fontFamily: "sans-serif" }}
                >
                  <div className="p-4 text-white" style={{ backgroundColor: "#0f172a" }}>
                    <h4 className="fw-bold mb-1">Parijat Cooperative Housing Society</h4>
                    <div className="small text-light opacity-75">Maintenance Payment Reminder &mdash; April 2026</div>
                  </div>

                  <div className="p-4">
                    <p className="text-secondary small mb-3">Dear <strong>Mr. Suresh Kulkarni</strong>,</p>
                    <p className="small text-secondary">
                      This is a friendly reminder that the society maintenance payment for flat{" "}
                      <strong>A-401</strong> for the month of <strong>April 2026</strong> is currently pending.
                    </p>

                    <div className="p-3 bg-light rounded-3 border my-3">
                      <div className="d-flex justify-content-between small py-1 border-bottom">
                        <span className="text-secondary">Flat Number:</span>
                        <span className="fw-bold text-dark">A-401 (4th Floor)</span>
                      </div>
                      <div className="d-flex justify-content-between small py-1 border-bottom">
                        <span className="text-secondary">Billing Month:</span>
                        <span className="fw-bold text-dark">April 2026</span>
                      </div>
                      <div className="d-flex justify-content-between small py-1 border-bottom">
                        <span className="text-secondary">Due Date:</span>
                        <span className="fw-bold text-danger">10th April 2026 (Overdue)</span>
                      </div>
                      <div className="d-flex justify-content-between py-2 mt-1">
                        <span className="fw-bold text-dark">Total Due Amount:</span>
                        <span className="fw-extrabold text-danger fs-5">₹1,100.00</span>
                      </div>
                    </div>

                    <p className="small text-secondary mb-3">
                      Please make the payment online via UPI or bank transfer to the society account to avoid late
                      surcharges.
                    </p>

                    <div className="p-3 bg-primary-subtle text-primary rounded-3 small">
                      <strong>Society UPI ID:</strong> <code>parijatsociety@okhdfcbank</code><br />
                      <strong>Bank A/C:</strong> HDFC Bank, Kothrud Branch | A/C: 5020008910291 | IFSC: HDFC0001234
                    </div>
                  </div>

                  <div className="p-3 bg-light border-top text-center text-muted small" style={{ fontSize: "0.75rem" }}>
                    Parijat Housing Society &bull; Survey No. 42/1, Kothrud, Pune - 411038 &bull; Email:
                    parijatsociety@gmail.com
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

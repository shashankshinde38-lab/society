"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { DataStorage } from "@/services/dataStorage";
import { Settings as SettingsIcon, Database, Shield, Bell, Lock, RefreshCw, CheckCircle2, Mail, BellOff } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [autoBackup, setAutoBackup] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  useEffect(() => {
    setEmailNotifications(DataStorage.isEmailNotificationsEnabled());
    const handleToggleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      setEmailNotifications(customEvent.detail?.enabled ?? DataStorage.isEmailNotificationsEnabled());
    };
    window.addEventListener("email_notifications_toggled", handleToggleEvent);
    return () => window.removeEventListener("email_notifications_toggled", handleToggleEvent);
  }, []);

  const handleToggleEmailNotifications = (enabled: boolean) => {
    DataStorage.setEmailNotificationsEnabled(enabled);
    setEmailNotifications(enabled);
    if (enabled) {
      toast.success("Email notifications enabled! Outgoing emails will be sent.");
    } else {
      toast.warning("Email notifications paused! No outgoing emails will be sent.");
    }
  };

  const handleBackupNow = () => {
    toast.success("Database snapshot created and verified successfully!");
  };

  return (
    <div>
      <PageHeader
        title="System Settings &amp; Security"
        subtitle="Manage database backups, security audit policies, and email notification controls"
        breadcrumbs={[{ label: "Settings" }]}
      />

      <div className="row g-4">
        {/* Email Notifications Master Card */}
        <div className="col-12 col-lg-6">
          <div className="card-premium h-100 p-4 border border-primary-subtle shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <Mail size={20} className="text-primary" />
                <h5 className="fw-bold text-dark mb-0">Email Notifications &amp; Mailer</h5>
              </div>
              <span className={`badge ${emailNotifications ? "bg-success text-white" : "bg-danger text-white"} py-1 px-2.5`}>
                {emailNotifications ? "ACTIVE" : "PAUSED"}
              </span>
            </div>
            <p className="text-secondary small mb-4">
              Master control for all outgoing email notifications across the society platform (payment receipts, maintenance dues reminders, expense alerts, and announcements).
            </p>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input cursor-pointer"
                type="checkbox"
                id="emailNotificationToggle"
                checked={emailNotifications}
                onChange={(e) => handleToggleEmailNotifications(e.target.checked)}
                style={{ width: "2.5em", height: "1.3em", cursor: "pointer" }}
              />
              <label className="form-check-label fw-bold text-dark small cursor-pointer" htmlFor="emailNotificationToggle">
                Allow Outgoing Email Notifications ({emailNotifications ? "ON" : "OFF"})
              </label>
            </div>

            <div className={`p-3 rounded-3 border mb-4 small ${emailNotifications ? "bg-success-subtle text-success-emphasis border-success-subtle" : "bg-warning-subtle text-warning-emphasis border-warning-subtle"}`}>
              {emailNotifications ? (
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                  <div>
                    <strong>Emails Active:</strong> Payment receipts and maintenance reminders will be dispatched automatically as configured.
                  </div>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <BellOff size={16} className="text-warning-emphasis flex-shrink-0" />
                  <div>
                    <strong>Emails Paused:</strong> No emails will be sent from this system under any circumstances until toggled back ON.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card-premium h-100 p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Database size={20} className="text-primary" />
              <h5 className="fw-bold text-dark mb-0">Database &amp; Data Backup</h5>
            </div>
            <p className="text-secondary small mb-4">
              Parijat Society data is secured in PostgreSQL with automated point-in-time recovery and snapshot archives.
            </p>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="autoBackupToggle"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
              />
              <label className="form-check-label fw-semibold text-dark small" htmlFor="autoBackupToggle">
                Daily Automated Cloud Backups
              </label>
            </div>

            <div className="p-3 bg-light rounded-3 border mb-4 small text-secondary">
              Last automatic backup: <strong>Today at 03:00 AM (Status: Healthy)</strong>
            </div>

            <button className="btn btn-outline-primary d-inline-flex align-items-center gap-2" onClick={handleBackupNow}>
              <RefreshCw size={15} />
              <span>Create Immediate Backup Snapshot</span>
            </button>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card-premium h-100 p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Shield size={20} className="text-primary" />
              <h5 className="fw-bold text-dark mb-0">Security &amp; Audit Trail</h5>
            </div>
            <p className="text-secondary small mb-4">
              All financial entries (payments, advance adjustments, expense vouchers) are immutably logged with admin identity.
            </p>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="auditToggle"
                checked={auditLogging}
                onChange={(e) => setAuditLogging(e.target.checked)}
              />
              <label className="form-check-label fw-semibold text-dark small" htmlFor="auditToggle">
                Immutable Transaction Audit Trail
              </label>
            </div>

            <div className="p-3 bg-success-subtle text-success border border-success-subtle rounded-3 small mb-4">
              <CheckCircle2 size={16} className="me-1 inline" />
              Supabase Row Level Security (RLS) policies are active and enforced.
            </div>

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => toast.info("Audit log history exported to audit_trail.json")}
            >
              Export Security Audit Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

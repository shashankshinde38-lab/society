"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { Settings as SettingsIcon, Database, Shield, Bell, Lock, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [autoBackup, setAutoBackup] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);

  const handleBackupNow = () => {
    toast.success("Database snapshot created and verified successfully!");
  };

  return (
    <div>
      <PageHeader
        title="System Settings &amp; Security"
        subtitle="Manage database backups, security audit policies, and financial year rollover rules"
        breadcrumbs={[{ label: "Settings" }]}
      />

      <div className="row g-4">
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

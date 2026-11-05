"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/common/Sidebar/Sidebar";
import { Header } from "@/components/common/Header/Header";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Building2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isVerifying, currentUser, userEmail } = useSessionGuard();

  // Strict Protection: Do not render any protected content while verifying session
  if (isVerifying) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
        <div className="p-4 bg-white rounded-4 shadow-sm text-center border" style={{ maxWidth: "340px", width: "90%" }}>
          <div className="bg-primary text-white p-3 rounded-circle d-inline-flex mb-3">
            <Building2 size={32} />
          </div>
          <h6 className="fw-bold text-dark mb-1">Parijat Society ERP</h6>
          <p className="small text-muted mb-3">Verifying secure session...</p>
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        currentUser={currentUser}
      />

      {/* Main Container */}
      <div className={`admin-main ${collapsed ? "expanded" : ""}`}>
        <Header
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed(!collapsed)}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          userEmail={userEmail}
          currentUser={currentUser}
        />

        <main className="admin-content">
          <div className="container-fluid p-0">{children}</div>
        </main>
      </div>
    </div>
  );
}

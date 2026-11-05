"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings2,
  Building2,
  Layers,
  Home,
  Users2,
  CreditCard,
  Receipt,
  Wallet,
  FileBarChart,
  Mail,
  ShieldCheck,
  ChevronDown,
  X,
} from "lucide-react";
import { DataStorage } from "@/services/dataStorage";
import { AdminUser } from "@/types/database.types";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  currentUser?: AdminUser | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  mobileOpen,
  onCloseMobile,
  currentUser,
}) => {
  const pathname = usePathname();
  const [mastersExpanded, setMastersExpanded] = useState(
    pathname.startsWith("/masters")
  );

  const permissions = DataStorage.getUserPermissions(currentUser?.email);
  const canAccessRolesAndUsers = Boolean(
    (permissions.roles && permissions.roles.read) ||
    (permissions.users && permissions.users.read) ||
    currentUser?.role_name === "Super Admin"
  );
  const canReadSetup = permissions.app_setup ? permissions.app_setup.read : true;

  const isActive = (path: string) => pathname === path;
  const isMasterActive = pathname.startsWith("/masters");

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-overlay ${mobileOpen ? "show" : ""}`}
        onClick={onCloseMobile}
      />

      <aside
        className={`admin-sidebar ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "show-mobile" : ""
        }`}
      >
        {/* Brand Header */}
        <div className="sidebar-brand">
          <Link href="/dashboard" className="d-flex align-items-center gap-2 text-decoration-none">
            <div
              className="d-flex align-items-center justify-content-center bg-primary rounded-3 text-white"
              style={{ width: "38px", height: "38px" }}
            >
              <Building2 size={22} />
            </div>
            {!collapsed && (
              <div className="d-flex flex-column">
                <span className="fw-bold text-white fs-6 lh-sm">Parijat Society</span>
                <span className="text-secondary small" style={{ fontSize: "0.7rem" }}>
                  Management ERP
                </span>
              </div>
            )}
          </Link>

          {/* Close on Mobile */}
          <button
            className="btn btn-link text-secondary p-0 d-lg-none"
            onClick={onCloseMobile}
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="sidebar-nav-container">
          <div className="nav-section-title">{!collapsed && "Overview"}</div>

          <Link
            href="/dashboard"
            className={`sidebar-nav-item ${isActive("/dashboard") ? "active" : ""}`}
            title="Dashboard"
            onClick={onCloseMobile}
          >
            <LayoutDashboard className="nav-icon" />
            {!collapsed && <span>Dashboard</span>}
          </Link>

          <div className="nav-section-title mt-3">{!collapsed && "Management"}</div>

          {/* Masters Submenu */}
          <div className="nav-dropdown-wrapper">
            <div
              className={`sidebar-nav-item justify-content-between ${
                isMasterActive ? "text-white" : ""
              }`}
              onClick={() => setMastersExpanded(!mastersExpanded)}
              title="Masters"
              style={{ cursor: "pointer" }}
            >
              <div className="d-flex align-items-center gap-2">
                <Layers className="nav-icon" />
                {!collapsed && <span>Masters</span>}
              </div>
              {!collapsed && (
                <ChevronDown
                  size={16}
                  style={{
                    transform: mastersExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              )}
            </div>

            {(!collapsed && mastersExpanded) && (
              <div className="ps-4 pt-1 pb-1">
                <Link
                  href="/masters/floors"
                  className={`sidebar-nav-item ${
                    isActive("/masters/floors") ? "active" : ""
                  }`}
                  onClick={onCloseMobile}
                >
                  <Layers size={14} className="nav-icon" />
                  <span>Floors</span>
                </Link>
                <Link
                  href="/masters/flats"
                  className={`sidebar-nav-item ${
                    isActive("/masters/flats") ? "active" : ""
                  }`}
                  onClick={onCloseMobile}
                >
                  <Home size={14} className="nav-icon" />
                  <span>Flats</span>
                </Link>
                <Link
                  href="/masters/residents"
                  className={`sidebar-nav-item ${
                    isActive("/masters/residents") ? "active" : ""
                  }`}
                  onClick={onCloseMobile}
                >
                  <Users2 size={14} className="nav-icon" />
                  <span>Residents</span>
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/maintenance"
            className={`sidebar-nav-item ${isActive("/maintenance") ? "active" : ""}`}
            title="Maintenance"
            onClick={onCloseMobile}
          >
            <CreditCard className="nav-icon" />
            {!collapsed && <span>Maintenance</span>}
          </Link>

          <Link
            href="/expenses"
            className={`sidebar-nav-item ${isActive("/expenses") ? "active" : ""}`}
            title="Society Expenses"
            onClick={onCloseMobile}
          >
            <Receipt className="nav-icon" />
            {!collapsed && <span>Expenses</span>}
          </Link>

          <Link
            href="/wallet"
            className={`sidebar-nav-item ${isActive("/wallet") ? "active" : ""}`}
            title="Society Wallet"
            onClick={onCloseMobile}
          >
            <Wallet className="nav-icon" />
            {!collapsed && <span>Society Wallet</span>}
          </Link>

          <div className="nav-section-title mt-3">{!collapsed && "Analytics & Tools"}</div>

          <Link
            href="/reports"
            className={`sidebar-nav-item ${isActive("/reports") ? "active" : ""}`}
            title="Reports"
            onClick={onCloseMobile}
          >
            <FileBarChart className="nav-icon" />
            {!collapsed && <span>Reports</span>}
          </Link>

          <Link
            href="/mailer"
            className={`sidebar-nav-item ${isActive("/mailer") ? "active" : ""}`}
            title="Email Reminders & Mailer"
            onClick={onCloseMobile}
          >
            <Mail className="nav-icon" />
            {!collapsed && <span>Mailer</span>}
          </Link>

          {canAccessRolesAndUsers && (
            <Link
              href="/roles-permissions"
              className={`sidebar-nav-item ${
                isActive("/roles-permissions") || isActive("/users") ? "active" : ""
              }`}
              title="Roles & Permissions"
              onClick={onCloseMobile}
            >
              <ShieldCheck className="nav-icon" />
              {!collapsed && <span>Roles &amp; Permissions</span>}
            </Link>
          )}

          {canReadSetup && (
            <Link
              href="/app-setup"
              className={`sidebar-nav-item ${isActive("/app-setup") ? "active" : ""}`}
              title="App Setup & Rules"
              onClick={onCloseMobile}
            >
              <Settings2 className="nav-icon" />
              {!collapsed && <span>App Setup</span>}
            </Link>
          )}
        </div>

        {/* Sidebar Footer info */}
        {!collapsed && (
          <div
            className="p-3 border-top border-secondary-subtle"
            style={{ borderColor: "var(--sidebar-border) !important" }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="bg-success rounded-circle"
                  style={{ width: "8px", height: "8px" }}
                />
                <span className="text-secondary small" style={{ fontSize: "0.75rem" }}>
                  {currentUser?.role_name || "Admin"} Active
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

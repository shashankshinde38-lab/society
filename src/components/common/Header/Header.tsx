"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clearAdminSession } from "@/features/auth/authActions";
import { DataStorage } from "@/services/dataStorage";
import { AdminUser } from "@/types/database.types";
import { toast } from "sonner";

interface HeaderProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  userEmail?: string | null;
  currentUser?: AdminUser | null;
}

export const Header: React.FC<HeaderProps> = ({
  collapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
  userEmail = "admin@gmail.com",
  currentUser,
}) => {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const supabase = createClient();

  const activeEmail = currentUser?.email || userEmail || "admin@gmail.com";
  const activeName = currentUser?.name || (currentUser?.role_name === "Accountant" ? "Pratik Mohol" : "Administrator");
  const activeRole = currentUser?.role_name || "Admin";

  const handleSignOut = async () => {
    try {
      DataStorage.setCurrentUser(null);
      await clearAdminSession();
      try {
        await fetch("/api/auth/session", { method: "DELETE" });
      } catch {
        // Ignore
      }
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore
      }
      toast.success("Signed out successfully");
      window.location.replace("/login");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <header className="admin-header">
      <div className="d-flex align-items-center gap-3">
        {/* Desktop Collapse Toggle */}
        <button
          className="btn btn-light d-none d-lg-flex align-items-center justify-content-center p-2 rounded-2 border"
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu size={18} />
        </button>

        {/* Mobile Sidebar Toggle */}
        <button
          className="btn btn-light d-lg-none d-flex align-items-center justify-content-center p-2 rounded-2 border"
          onClick={onOpenMobileSidebar}
          aria-label="Open Mobile Menu"
        >
          <Menu size={18} />
        </button>

        {/* Search Bar / Quick Finder */}
        <div className="position-relative d-none d-md-block" style={{ width: "260px" }}>
          <Search
            size={16}
            className="position-absolute text-secondary"
            style={{ top: "10px", left: "12px" }}
          />
          <input
            type="text"
            className="form-control form-control-sm ps-5 bg-light border-1"
            placeholder="Search flats, residents..."
            style={{ borderRadius: "8px", fontSize: "0.85rem", height: "36px" }}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="d-flex align-items-center gap-3">
        {/* Society Financial Year Badge */}
        <div className="d-none d-sm-inline-flex align-items-center gap-2 px-3 py-1 bg-light border rounded-pill">
          <span
            className="bg-primary rounded-circle"
            style={{ width: "7px", height: "7px" }}
          />
          <span className="small fw-semibold text-secondary" style={{ fontSize: "0.75rem" }}>
            {(() => {
              const d = new Date();
              const y = d.getFullYear();
              const m = d.getMonth() + 1;
              return m >= 4 ? `FY ${y}–${y + 1}` : `FY ${y - 1}–${y}`;
            })()}
          </span>
        </div>

        {/* Notification Icon */}
        {/* <button
          className="btn btn-light position-relative p-2 rounded-circle border"
          aria-label="Notifications"
          onClick={() => toast.info("No unread alerts")}
        >
          <Bell size={18} className="text-secondary" />
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "0.6rem", padding: "0.25em 0.45em" }}
          >
            2
          </span>
        </button> */}

        {/* Profile Dropdown */}
        <div className="position-relative">
          <button
            className="btn btn-light d-flex align-items-center gap-2 p-1 pe-2 rounded-pill border"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
          >
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
              style={{ width: "34px", height: "34px", fontSize: "0.85rem" }}
            >
              {activeName ? activeName.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="d-none d-md-flex flex-column text-start">
              <span className="fw-semibold text-dark small lh-sm">
                {activeName}
              </span>
              <div className="d-flex align-items-center gap-1">
                <span
                  className="badge bg-primary-subtle text-primary border border-primary-subtle"
                  style={{ fontSize: "0.65rem", padding: "1px 5px", fontWeight: 600 }}
                >
                  {activeRole}
                </span>
                <span
                  className="text-secondary"
                  style={{ fontSize: "0.7rem", maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {activeEmail}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className="text-secondary ms-1" />
          </button>

          {profileOpen && (
            <div
              className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border p-2"
              style={{ width: "230px", zIndex: 1050 }}
            >
              <div className="px-3 py-2 border-bottom">
                <p className="fw-bold mb-0 small text-dark">{activeName}</p>
                <div className="d-flex align-items-center gap-1.5 mt-0.5">
                  <span className="badge bg-secondary-subtle text-secondary small" style={{ fontSize: "0.65rem" }}>
                    {activeRole}
                  </span>
                  <span className="text-muted small mb-0" style={{ fontSize: "0.72rem" }}>
                    {activeEmail}
                  </span>
                </div>
              </div>
              <button
                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 rounded small text-dark mt-1"
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/app-setup");
                }}
              >
                <Settings size={15} />
                <span>Society Settings</span>
              </button>
              {activeRole !== "Accountant" && (
                <button
                  className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 rounded small text-dark"
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/users");
                  }}
                >
                  <User size={15} />
                  <span>Profile & Roles</span>
                </button>
              )}
              <div className="dropdown-divider my-1" />
              <button
                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 rounded small text-danger"
                onClick={() => {
                  setProfileOpen(false);
                  handleSignOut();
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

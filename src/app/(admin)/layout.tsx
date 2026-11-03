"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/common/Sidebar/Sidebar";
import { Header } from "@/components/common/Header/Header";
import { createClient } from "@/lib/supabase/client";
import { DataStorage } from "@/services/dataStorage";
import { AdminUser } from "@/types/database.types";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>("admin@gmail.com");
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // 1. Prioritize active DataStorage session
    const current = DataStorage.getCurrentUser();
    if (current) {
      setCurrentUser(current);
      setUserEmail(current.email);
    }

    // 2. Sync with Supabase Auth if session exists
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email && !current) {
        setUserEmail(user.email);
      }
    });
  }, []);

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

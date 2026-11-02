"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/common/Sidebar/Sidebar";
import { Header } from "@/components/common/Header/Header";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>("admin@gmail.com");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
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
      />

      {/* Main Container */}
      <div className={`admin-main ${collapsed ? "expanded" : ""}`}>
        <Header
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed(!collapsed)}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          userEmail={userEmail}
        />

        <main className="admin-content">
          <div className="container-fluid p-0">{children}</div>
        </main>
      </div>
    </div>
  );
}

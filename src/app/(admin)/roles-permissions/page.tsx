"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RolesPermissionsView } from "@/components/features/roles-permissions/RolesPermissionsView";

function RolesPermissionsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam?.toLowerCase() === "users" ? "USERS" : "ROLES";

  return <RolesPermissionsView initialTab={initialTab} />;
}

export default function RolesPermissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      }
    >
      <RolesPermissionsContent />
    </Suspense>
  );
}

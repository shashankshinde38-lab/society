"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RolesPermissionsView } from "@/components/features/roles-permissions/RolesPermissionsView";

function UsersPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam?.toLowerCase() === "roles" ? "ROLES" : "USERS";

  return <RolesPermissionsView initialTab={initialTab} />;
}

export default function UsersPage() {
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
      <UsersPageContent />
    </Suspense>
  );
}

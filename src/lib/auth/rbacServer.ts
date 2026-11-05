import { SessionPayload } from "./session";
import { initialRoles, initialAdminUsers } from "@/services/mockInitialData";
import { Role, AdminUser } from "@/types/database.types";

/**
 * Server-side RBAC validation helper.
 * Validates whether an authenticated user has permission to perform an action on a module.
 */
export function verifyServerPermission(
  session: SessionPayload | null | undefined,
  module: string,
  action: string = "read"
): { authorized: boolean; status: number; error?: string } {
  if (!session || !session.email) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required. Please log in.",
    };
  }

  // Super Admin bypasses all checks
  if (
    session.roleName === "Super Admin" ||
    session.email.toLowerCase() === "admin@gmail.com"
  ) {
    return { authorized: true, status: 200 };
  }

  // Lookup role from initial mock or custom role definition
  const roleName = session.roleName;
  const matchedRole: Role | undefined = initialRoles.find(
    (r) => r.name.toLowerCase() === roleName?.toLowerCase() || r.id === session.roleId
  );

  if (!matchedRole) {
    // If role cannot be found, allow read if generic, but reject write
    if (action === "read") {
      return { authorized: true, status: 200 };
    }
    return {
      authorized: false,
      status: 403,
      error: `Forbidden: Role '${roleName || "Unknown"}' lacks permission for '${module}:${action}'.`,
    };
  }

  const modulePerm = matchedRole.permissions?.[module];
  if (!modulePerm || !(modulePerm as any)[action]) {
    return {
      authorized: false,
      status: 403,
      error: `Forbidden: Your account does not have '${action}' permission for '${module}'.`,
    };
  }

  return { authorized: true, status: 200 };
}

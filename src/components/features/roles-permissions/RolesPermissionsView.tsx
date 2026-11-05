"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { DataStorage } from "@/services/dataStorage";
import { Role, AdminUser, ModulePermission } from "@/types/database.types";
import {
  ShieldCheck,
  Shield,
  KeyRound,
  Users2,
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Save,
  ArrowRight,
  Lock,
  UserCheck,
  UserPlus,
  Building2,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

// =========================================================================
// MODULE AND PERMISSION DEFINITIONS BASED ON ACTUAL APPLICATION CAPABILITIES
// =========================================================================

export interface ActionDefinition {
  key: string;
  label: string;
  column: "view" | "create" | "update" | "delete" | "export" | "other";
  description: string;
}

export interface ModuleDefinition {
  key: string;
  name: string;
  description: string;
  category: "Overview" | "Operations" | "Finance & Accounts" | "Administration";
  actions: ActionDefinition[];
}

export const APPLICATION_MODULES: ModuleDefinition[] = [
  // --- OVERVIEW ---
  {
    key: "dashboard",
    name: "Dashboard",
    description: "Society overview, collections breakdown, expense tracking & occupancy metrics",
    category: "Overview",
    actions: [
      { key: "read", label: "View Dashboard", column: "view", description: "View financial stats & charts" },
    ],
  },

  // --- OPERATIONS ---
  {
    key: "floors",
    name: "Floors Management",
    description: "Building floors configuration, floor ordering and structural layout",
    category: "Operations",
    actions: [
      { key: "read", label: "View Floors", column: "view", description: "View list of society floors" },
      { key: "create", label: "Add Floor", column: "create", description: "Create new floor records" },
      { key: "update", label: "Edit Floor", column: "update", description: "Modify floor details" },
      { key: "delete", label: "Delete Floor", column: "delete", description: "Remove floors with dependency checks" },
    ],
  },
  {
    key: "flats",
    name: "Flats Management",
    description: "Flat records, maintenance rate overrides, and flat occupancy directory",
    category: "Operations",
    actions: [
      { key: "read", label: "View Flats", column: "view", description: "View list of all flats" },
      { key: "create", label: "Add Flat", column: "create", description: "Create new flat units" },
      { key: "update", label: "Edit Flat", column: "update", description: "Modify flat specifications & rate overrides" },
      { key: "delete", label: "Delete Flat", column: "delete", description: "Remove flats with occupant verification" },
      { key: "export", label: "Export Flats", column: "export", description: "Export flat directory" },
    ],
  },
  {
    key: "residents",
    name: "Residents Management",
    description: "Owner and tenant profiles, residency history, and contact details",
    category: "Operations",
    actions: [
      { key: "read", label: "View Residents", column: "view", description: "View resident directory" },
      { key: "create", label: "Add Resident", column: "create", description: "Register owner or tenant residents" },
      { key: "update", label: "Edit Resident", column: "update", description: "Modify resident information" },
      { key: "delete", label: "Delete Resident", column: "delete", description: "Delete resident while preserving transaction history" },
      { key: "export", label: "Export Residents", column: "export", description: "Export resident contacts list" },
    ],
  },

  // --- FINANCE & ACCOUNTS ---
  {
    key: "maintenance",
    name: "Maintenance Billing",
    description: "12-month billing schedule, owner/tenant dues, and invoice generation",
    category: "Finance & Accounts",
    actions: [
      { key: "read", label: "View Maintenance", column: "view", description: "View 12-month maintenance calendar" },
      { key: "create", label: "Generate Bills", column: "create", description: "Generate monthly maintenance invoices" },
      { key: "update", label: "Configure Rates", column: "update", description: "Update owner and tenant maintenance rates" },
      { key: "delete", label: "Void Invoice", column: "delete", description: "Cancel or void unpaid invoices" },
      { key: "collect", label: "Annual Collection", column: "other", description: "Collect maintenance payments across months" },
      { key: "export", label: "Export Billing", column: "export", description: "Export maintenance ledger" },
    ],
  },
  {
    key: "payments",
    name: "Payment Receipts",
    description: "Maintenance payment collection, transaction receipts, and payment allocations",
    category: "Finance & Accounts",
    actions: [
      { key: "read", label: "View Payments", column: "view", description: "View collection receipts and history" },
      { key: "create", label: "Record Payment", column: "create", description: "Record cash, UPI, bank or cheque payments" },
      { key: "update", label: "Edit Payment", column: "update", description: "Update receipt details and allocations" },
      { key: "delete", label: "Void Payment", column: "delete", description: "Void or reverse incorrect payments" },
      { key: "export", label: "Download Receipt", column: "export", description: "Print & download PDF payment receipts" },
    ],
  },
  {
    key: "expenses",
    name: "Society Expenses",
    description: "Operational expenditure, utility bills, maintenance contracts, and payment approvals",
    category: "Finance & Accounts",
    actions: [
      { key: "read", label: "View Expenses", column: "view", description: "View expenditure registers and categories" },
      { key: "create", label: "Add Expense", column: "create", description: "Record new society expenditure voucher" },
      { key: "update", label: "Edit Expense", column: "update", description: "Modify expense details" },
      { key: "delete", label: "Delete Expense", column: "delete", description: "Remove expense records" },
      { key: "approve", label: "Approve / Pay", column: "other", description: "Approve and disburse expense from wallet" },
      { key: "export", label: "Export Expenses", column: "export", description: "Export expense statements" },
    ],
  },
  {
    key: "wallet",
    name: "Society Wallet & Cash Book",
    description: "Society central liquid wallet, cash book ledger, and balance reconciliations",
    category: "Finance & Accounts",
    actions: [
      { key: "read", label: "View Wallet", column: "view", description: "View liquid wallet balance & passbook" },
      { key: "create", label: "Record Entry", column: "create", description: "Record manual credit or debit adjustment" },
      { key: "export", label: "Export Ledger", column: "export", description: "Download complete cash book ledger" },
    ],
  },
  {
    key: "reports",
    name: "Reports & Financial Audits",
    description: "Audit statements, collection summaries, pending dues, and annual financial statements",
    category: "Finance & Accounts",
    actions: [
      { key: "read", label: "View Reports", column: "view", description: "View audit reports and analytics" },
      { key: "export", label: "Export Reports", column: "export", description: "Export PDF & Excel summary reports" },
    ],
  },

  // --- ADMINISTRATION ---
  {
    key: "mailer",
    name: "Mailer & Email Notices",
    description: "Automated maintenance due notices, payment receipts, and dispatch logs",
    category: "Administration",
    actions: [
      { key: "read", label: "View Logs", column: "view", description: "View mail dispatch history and audit logs" },
      { key: "send", label: "Send Notices", column: "other", description: "Trigger manual due reminders & general notices" },
      { key: "retry", label: "Retry Failed", column: "other", description: "Retry sending failed email dispatches" },
    ],
  },
  {
    key: "app_setup",
    name: "App Setup & Rules",
    description: "Society profile, bank account details, maintenance rates & operational resets",
    category: "Administration",
    actions: [
      { key: "read", label: "View Setup", column: "view", description: "View society configurations & bank details" },
      { key: "update", label: "Edit Setup", column: "update", description: "Update society rules and rate schedules" },
      { key: "reset", label: "Reset Data", column: "other", description: "Truncate live operational data (destructive)" },
    ],
  },
  {
    key: "roles",
    name: "Roles & Permissions",
    description: "Role-based access control (RBAC), custom roles, and granular action matrix",
    category: "Administration",
    actions: [
      { key: "read", label: "View Roles", column: "view", description: "View configured system and custom roles" },
      { key: "create", label: "Create Role", column: "create", description: "Create new custom administrative role" },
      { key: "update", label: "Edit Role", column: "update", description: "Modify role permissions and details" },
      { key: "delete", label: "Delete Role", column: "delete", description: "Delete role after user reassignment" },
    ],
  },
  {
    key: "users",
    name: "User Management",
    description: "Administrative user accounts, credentials, and role assignments",
    category: "Administration",
    actions: [
      { key: "read", label: "View Users", column: "view", description: "View administrative user accounts" },
      { key: "create", label: "Create User", column: "create", description: "Add new administrative user" },
      { key: "update", label: "Edit User", column: "update", description: "Modify user profile & reset password" },
      { key: "assign", label: "Assign Role", column: "other", description: "Assign roles to administrative users" },
      { key: "delete", label: "Delete User", column: "delete", description: "Remove user account" },
    ],
  },
];

// Calculate total available permissions across the application
const TOTAL_AVAILABLE_PERMISSIONS = APPLICATION_MODULES.reduce(
  (acc, mod) => acc + mod.actions.length,
  0
);

interface RolesPermissionsViewProps {
  initialTab?: "ROLES" | "USERS";
}

export function RolesPermissionsView({ initialTab = "ROLES" }: RolesPermissionsViewProps) {
  // Tabs: exactly TWO tabs
  const [activeTab, setActiveTab] = useState<"ROLES" | "USERS">(initialTab);

  // Data states
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // --- ROLES TAB FILTERS & PAGINATION ---
  const [roleSearch, setRoleSearch] = useState("");
  const [roleStatusFilter, setRoleStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [rolePage, setRolePage] = useState(1);
  const rolesPerPage = 8;

  // --- USERS TAB FILTERS & PAGINATION ---
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 8;

  // --- ROLE MODALS & FORM ---
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleStatus, setRoleStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({});

  // Mobile expanded modules in form
  const [expandedMobileModules, setExpandedMobileModules] = useState<Record<string, boolean>>({});

  // View Role Modal
  const [viewingRole, setViewingRole] = useState<Role | null>(null);

  // Delete / Reassign Role Modal
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [reassignTargetRoleId, setReassignTargetRoleId] = useState<string>("");

  // --- USERS TAB MODALS ---
  // Assign Role Modal
  const [assigningUser, setAssigningUser] = useState<AdminUser | null>(null);
  const [selectedNewRoleId, setSelectedNewRoleId] = useState<string>("");

  // Add / Edit User Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userNameInput, setUserNameInput] = useState("");
  const [userEmailInput, setUserEmailInput] = useState("");
  const [userMobileInput, setUserMobileInput] = useState("");
  const [userRoleInput, setUserRoleInput] = useState("");
  const [userStatusInput, setUserStatusInput] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [userPasswordInput, setUserPasswordInput] = useState("");
  const [userConfirmPasswordInput, setUserConfirmPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load Data
  const loadData = () => {
    const allRoles = DataStorage.getRoles();
    const allUsers = DataStorage.getUsers();
    const activeUser = DataStorage.getCurrentUser();
    setRoles(allRoles);
    setUsers(allUsers);
    setCurrentUser(activeUser);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync initial tab when changed by prop
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // =========================================================================
  // ROLES TAB LOGIC
  // =========================================================================

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesSearch =
        role.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(roleSearch.toLowerCase()));
      const roleEffectiveStatus = role.status || "ACTIVE";
      const matchesStatus =
        roleStatusFilter === "ALL" || roleEffectiveStatus === roleStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [roles, roleSearch, roleStatusFilter]);

  const totalRolePages = Math.ceil(filteredRoles.length / rolesPerPage) || 1;
  const paginatedRoles = useMemo(() => {
    const start = (rolePage - 1) * rolesPerPage;
    return filteredRoles.slice(start, start + rolesPerPage);
  }, [filteredRoles, rolePage, rolesPerPage]);

  // Count assigned users per role
  const getAssignedUsersCount = (role: Role) => {
    return users.filter(
      (u) => u.role_id === role.id || u.role_name.toLowerCase() === role.name.toLowerCase()
    ).length;
  };

  // Count active permissions per role
  const getAssignedPermissionsCount = (role: Role) => {
    if (!role.permissions) return 0;
    let count = 0;
    APPLICATION_MODULES.forEach((mod) => {
      const modPerms = role.permissions[mod.key];
      if (modPerms) {
        mod.actions.forEach((act) => {
          if ((modPerms as Record<string, any>)[act.key]) count++;
        });
      }
    });
    return count;
  };

  // Open Create Role Form: STRICT RULE -> ALL CHECKBOXES UNCHECKED BY DEFAULT!
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setRoleStatus("ACTIVE");

    // Initialize all modules with ALL actions false (completely empty!)
    const emptyPerms: Record<string, Record<string, boolean>> = {};
    APPLICATION_MODULES.forEach((mod) => {
      emptyPerms[mod.key] = {};
      mod.actions.forEach((act) => {
        emptyPerms[mod.key][act.key] = false;
      });
    });

    setRolePermissions(emptyPerms);
    setExpandedMobileModules({});
    setShowRoleModal(true);
  };

  // Open Edit Role Form: Loads saved permissions cleanly
  const handleOpenEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setRoleStatus(role.status || "ACTIVE");

    const loadedPerms: Record<string, Record<string, boolean>> = {};
    APPLICATION_MODULES.forEach((mod) => {
      loadedPerms[mod.key] = {};
      const savedModPerms = role.permissions?.[mod.key] || {};
      mod.actions.forEach((act) => {
        loadedPerms[mod.key][act.key] = Boolean((savedModPerms as Record<string, any>)[act.key]);
      });
    });

    setRolePermissions(loadedPerms);
    setExpandedMobileModules({});
    setShowRoleModal(true);
  };

  // Toggle single permission action
  const handleTogglePermission = (moduleKey: string, actionKey: string) => {
    setRolePermissions((prev) => {
      const currentMod = prev[moduleKey] || {};
      return {
        ...prev,
        [moduleKey]: {
          ...currentMod,
          [actionKey]: !currentMod[actionKey],
        },
      };
    });
  };

  // Module-level Select All / Deselect All
  const handleModuleSelectAll = (moduleKey: string, select: boolean) => {
    const modDef = APPLICATION_MODULES.find((m) => m.key === moduleKey);
    if (!modDef) return;

    setRolePermissions((prev) => {
      const updatedMod: Record<string, boolean> = { ...(prev[moduleKey] || {}) };
      modDef.actions.forEach((act) => {
        updatedMod[act.key] = select;
      });
      return {
        ...prev,
        [moduleKey]: updatedMod,
      };
    });
  };

  // Global Select All / Clear All
  const handleGlobalSelectAll = (select: boolean) => {
    const allPerms: Record<string, Record<string, boolean>> = {};
    APPLICATION_MODULES.forEach((mod) => {
      allPerms[mod.key] = {};
      mod.actions.forEach((act) => {
        allPerms[mod.key][act.key] = select;
      });
    });
    setRolePermissions(allPerms);
  };

  // Selected permissions count in the active form
  const selectedPermissionsCount = useMemo(() => {
    let count = 0;
    APPLICATION_MODULES.forEach((mod) => {
      const modPerms = rolePermissions[mod.key];
      if (modPerms) {
        mod.actions.forEach((act) => {
          if (modPerms[act.key]) count++;
        });
      }
    });
    return count;
  }, [rolePermissions]);

  // Save Role (Create or Edit)
  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error("Please enter a valid role name");
      return;
    }

    try {
      // Clean permissions to format expected by storage
      const formattedPermissions: Record<string, ModulePermission> = {};
      APPLICATION_MODULES.forEach((mod) => {
        const modPerms = rolePermissions[mod.key] || {};
        const cleaned: ModulePermission = {
          read: Boolean(modPerms.read),
          create: Boolean(modPerms.create),
          update: Boolean(modPerms.update),
          delete: Boolean(modPerms.delete),
        };
        // Add additional module actions (e.g. export, collect, approve, send, retry, reset, assign)
        mod.actions.forEach((act) => {
          if (!["read", "create", "update", "delete"].includes(act.key)) {
            (cleaned as Record<string, any>)[act.key] = Boolean(modPerms[act.key]);
          }
        });
        formattedPermissions[mod.key] = cleaned;
      });

      if (editingRole) {
        DataStorage.updateRole(editingRole.id, {
          name: roleName.trim(),
          description: roleDescription.trim() || null,
          status: roleStatus,
          permissions: formattedPermissions,
        });
        toast.success(`Role "${roleName.trim()}" updated successfully!`);
      } else {
        DataStorage.addRole({
          name: roleName.trim(),
          description: roleDescription.trim() || null,
          is_system: false,
          status: roleStatus,
          permissions: formattedPermissions,
        });
        toast.success(`New role "${roleName.trim()}" created successfully!`);
      }

      setShowRoleModal(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    }
  };

  // Delete Role Handler
  const handleInitiateDeleteRole = (role: Role) => {
    if (role.is_system || role.id === "role-super-admin") {
      toast.error("System Super Admin role cannot be deleted.");
      return;
    }

    const assignedCount = getAssignedUsersCount(role);
    if (assignedCount > 0) {
      // Require reassignment first
      const otherActiveRoles = roles.filter(
        (r) => r.id !== role.id && (r.status === "ACTIVE" || !r.status)
      );
      if (otherActiveRoles.length === 0) {
        toast.error("No other active role exists to reassign users to. Please create or activate another role first.");
        return;
      }
      setRoleToDelete(role);
      setReassignTargetRoleId(otherActiveRoles[0].id);
    } else {
      // No assigned users -> confirm delete directly
      if (confirm(`Are you sure you want to delete role "${role.name}"? This action cannot be undone.`)) {
        try {
          DataStorage.deleteRole(role.id);
          toast.success(`Role "${role.name}" deleted successfully.`);
          loadData();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Failed to delete role");
        }
      }
    }
  };

  // Confirm Delete with Reassignment
  const handleConfirmDeleteWithReassignment = () => {
    if (!roleToDelete || !reassignTargetRoleId) return;
    try {
      const targetRole = roles.find((r) => r.id === reassignTargetRoleId);
      DataStorage.deleteRole(roleToDelete.id, reassignTargetRoleId);
      toast.success(
        `Users reassigned to "${targetRole?.name || "Active Role"}" and role "${roleToDelete.name}" deleted.`
      );
      setRoleToDelete(null);
      setReassignTargetRoleId("");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete role");
    }
  };

  // =========================================================================
  // USERS TAB LOGIC
  // =========================================================================

  // Active roles available for dropdowns
  const availableActiveRoles = useMemo(() => {
    return roles.filter((r) => r.status === "ACTIVE" || !r.status);
  }, [roles]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.mobile && u.mobile.includes(userSearch)) ||
        (u.phone && u.phone.includes(userSearch));

      const matchesRole =
        userRoleFilter === "ALL" ||
        u.role_id === userRoleFilter ||
        u.role_name.toLowerCase() === userRoleFilter.toLowerCase();

      const matchesStatus =
        userStatusFilter === "ALL" || u.status === userStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, userPage, usersPerPage]);

  // Open Assign Role Modal
  const handleOpenAssignRole = (user: AdminUser) => {
    setAssigningUser(user);
    // Find current role id or default to first available active role
    const matchedRole = roles.find(
      (r) => r.id === user.role_id || r.name.toLowerCase() === user.role_name.toLowerCase()
    );
    setSelectedNewRoleId(matchedRole?.id || (availableActiveRoles[0]?.id || ""));
  };

  // Save Assign Role Workflow
  const handleSaveRoleAssignment = () => {
    if (!assigningUser || !selectedNewRoleId) return;
    const selectedRole = roles.find((r) => r.id === selectedNewRoleId);
    if (!selectedRole) {
      toast.error("Please select a valid role");
      return;
    }

    try {
      DataStorage.updateUser(assigningUser.id, {
        role_id: selectedRole.id,
        role_name: selectedRole.name,
      });

      toast.success(
        `Role "${selectedRole.name}" assigned to ${assigningUser.name}. All corresponding permissions have been updated immediately!`
      );
      setAssigningUser(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to assign role");
    }
  };

  // Open Add User Modal
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserNameInput("");
    setUserEmailInput("");
    setUserMobileInput("");
    setUserRoleInput(availableActiveRoles[0]?.id || "");
    setUserStatusInput("ACTIVE");
    setUserPasswordInput("");
    setUserConfirmPasswordInput("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowUserModal(true);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setUserNameInput(user.name);
    setUserEmailInput(user.email);
    setUserMobileInput(user.mobile || user.phone || "");
    setUserRoleInput(user.role_id || "");
    setUserStatusInput(user.status || "ACTIVE");
    setUserPasswordInput("");
    setUserConfirmPasswordInput("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowUserModal(true);
  };

  // Save Add/Edit User
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNameInput.trim() || !userEmailInput.trim()) {
      toast.error("Please fill in Name and Email");
      return;
    }

    // Password validation if provided
    if (userPasswordInput.trim()) {
      if (userPasswordInput.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }
      if (userPasswordInput !== userConfirmPasswordInput) {
        toast.error("Password and Confirm Password do not match");
        return;
      }
    }

    const selectedRole = roles.find((r) => r.id === userRoleInput);
    const assignedRoleName = selectedRole ? selectedRole.name : "Society Admin";

    try {
      if (editingUser) {
        const updatePayload: Partial<AdminUser> = {
          name: userNameInput.trim(),
          mobile: userMobileInput.trim() || undefined,
          phone: userMobileInput.trim() || undefined,
          role_id: userRoleInput,
          role_name: assignedRoleName,
          status: userStatusInput,
        };
        if (userPasswordInput.trim()) {
          updatePayload.password = userPasswordInput.trim();
        }
        DataStorage.updateUser(editingUser.id, updatePayload);
        toast.success(`User "${editingUser.name}" updated successfully.`);
      } else {
        DataStorage.addUser({
          name: userNameInput.trim(),
          email: userEmailInput.trim().toLowerCase(),
          mobile: userMobileInput.trim() || undefined,
          phone: userMobileInput.trim() || undefined,
          password: userPasswordInput.trim() || "admin@123",
          role_id: userRoleInput,
          role_name: assignedRoleName,
          status: userStatusInput,
          last_login: "Never",
        });
        toast.success(`User "${userNameInput.trim()}" created successfully.`);
      }

      setShowUserModal(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save user");
    }
  };

  // Delete User
  const handleDeleteUser = (user: AdminUser) => {
    if (confirm(`Are you sure you want to delete user "${user.name}" (${user.email})?`)) {
      try {
        DataStorage.deleteUser(user.id);
        toast.success(`User "${user.name}" deleted.`);
        loadData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete user");
      }
    }
  };

  return (
    <div className="pb-5">
      {/* Page Header */}
      <PageHeader
        title="Roles &amp; Permissions"
        subtitle="Manage administrative access roles, configure granular module permissions, and assign roles to users"
        breadcrumbs={[{ label: "Roles & Permissions" }]}
        actions={
          <div className="d-flex align-items-center gap-2">
            {activeTab === "ROLES" ? (
              <button
                type="button"
                className="btn btn-primary-custom d-flex align-items-center gap-2"
                onClick={handleOpenCreateRole}
              >
                <PlusCircle size={16} />
                <span>Create Role</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary-custom d-flex align-items-center gap-2"
                onClick={handleOpenAddUser}
              >
                <UserPlus size={16} />
                <span>Add User</span>
              </button>
            )}
          </div>
        }
      />

      {/* Main Two-Tab Navigation Card */}
      <div className="card-premium mb-4">
        <div className="px-3 px-md-4 pt-3 border-bottom bg-white rounded-top-3">
          <ul className="nav nav-tabs border-0 gap-2 gap-md-4">
            {/* TAB 1: ROLES */}
            <li className="nav-item">
              <button
                className={`nav-link pb-3 fw-bold border-0 bg-transparent position-relative ${
                  activeTab === "ROLES"
                    ? "text-primary border-bottom border-3 border-primary"
                    : "text-secondary"
                }`}
                onClick={() => setActiveTab("ROLES")}
                style={{ fontSize: "0.95rem" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <ShieldCheck size={18} />
                  <span>Roles ({roles.length})</span>
                </div>
              </button>
            </li>

            {/* TAB 2: USERS */}
            <li className="nav-item">
              <button
                className={`nav-link pb-3 fw-bold border-0 bg-transparent position-relative ${
                  activeTab === "USERS"
                    ? "text-primary border-bottom border-3 border-primary"
                    : "text-secondary"
                }`}
                onClick={() => setActiveTab("USERS")}
                style={{ fontSize: "0.95rem" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <Users2 size={18} />
                  <span>Users ({users.length})</span>
                </div>
              </button>
            </li>
          </ul>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1 CONTENT: ROLES TAB                                                  */}
        {/* ========================================================================= */}
        {activeTab === "ROLES" && (
          <div className="p-3 p-md-4">
            {/* Filter and Search Bar */}
            <div className="row g-2 mb-3 align-items-center justify-content-between">
              <div className="col-12 col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Search roles by name or description..."
                    value={roleSearch}
                    onChange={(e) => {
                      setRoleSearch(e.target.value);
                      setRolePage(1);
                    }}
                  />
                  {roleSearch && (
                    <button
                      className="btn btn-outline-secondary border-start-0"
                      onClick={() => setRoleSearch("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-auto d-flex align-items-center gap-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-secondary fw-semibold text-nowrap">
                    <Filter size={14} className="me-1" />
                    Status:
                  </span>
                  <select
                    className="form-select form-select-sm"
                    style={{ minWidth: "140px" }}
                    value={roleStatusFilter}
                    onChange={(e) => {
                      setRoleStatusFilter(e.target.value as any);
                      setRolePage(1);
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="INACTIVE">Inactive Only</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary text-nowrap d-flex align-items-center gap-1"
                  onClick={handleOpenCreateRole}
                >
                  <PlusCircle size={14} />
                  <span>New Role</span>
                </button>
              </div>
            </div>

            {/* Roles Table */}
            {filteredRoles.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-3 border">
                <Shield size={36} className="text-muted mb-2" />
                <h6 className="fw-bold text-dark">No Roles Found</h6>
                <p className="text-secondary small mb-3">
                  {roleSearch || roleStatusFilter !== "ALL"
                    ? "No roles match your search or filter criteria."
                    : "No roles have been created yet. Click 'Create Role' to add one."}
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-primary-custom"
                  onClick={handleOpenCreateRole}
                >
                  <PlusCircle size={14} className="me-1" />
                  Create Your First Role
                </button>
              </div>
            ) : (
              <div className="table-responsive rounded-3 border">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-secondary small text-uppercase fw-bold">
                    <tr>
                      <th style={{ minWidth: "180px" }}>Role Name</th>
                      <th style={{ minWidth: "220px" }}>Description</th>
                      <th className="text-center" style={{ minWidth: "140px" }}>
                        Assigned Users
                      </th>
                      <th className="text-center" style={{ minWidth: "160px" }}>
                        Permissions
                      </th>
                      <th className="text-center" style={{ minWidth: "100px" }}>
                        Status
                      </th>
                      <th style={{ minWidth: "120px" }}>Created Date</th>
                      <th className="text-end" style={{ minWidth: "180px" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRoles.map((role) => {
                      const userCount = getAssignedUsersCount(role);
                      const permCount = getAssignedPermissionsCount(role);
                      const isSystemRole = role.is_system || role.id === "role-super-admin";
                      const effectiveStatus = role.status || "ACTIVE";

                      return (
                        <tr key={role.id}>
                          {/* Role Name */}
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold text-dark">{role.name}</span>
                              {isSystemRole && (
                                <span
                                  className="badge bg-secondary-subtle text-secondary border"
                                  style={{ fontSize: "0.65rem" }}
                                >
                                  SYSTEM
                                </span>
                              )}
                            </div>
                            <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                              ID: {role.id}
                            </div>
                          </td>

                          {/* Description */}
                          <td>
                            <span className="small text-secondary">
                              {role.description || "—"}
                            </span>
                          </td>

                          {/* Assigned Users Count */}
                          <td className="text-center">
                            <span
                              className={`badge rounded-pill ${
                                userCount > 0
                                  ? "bg-primary-subtle text-primary border border-primary-subtle"
                                  : "bg-light text-muted border"
                              }`}
                              style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                            >
                              <Users2 size={13} className="me-1 d-inline" />
                              {userCount} User{userCount === 1 ? "" : "s"}
                            </span>
                          </td>

                          {/* Permissions Count */}
                          <td className="text-center">
                            <span
                              className={`badge rounded-pill ${
                                permCount > 0
                                  ? "bg-success-subtle text-success border border-success-subtle"
                                  : "bg-light text-muted border"
                              }`}
                              style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                            >
                              <CheckCircle2 size={13} className="me-1 d-inline" />
                              {permCount} / {TOTAL_AVAILABLE_PERMISSIONS} Active
                            </span>
                          </td>

                          {/* Status */}
                          <td className="text-center">
                            <span
                              className={`badge ${
                                effectiveStatus === "ACTIVE"
                                  ? "bg-success text-white"
                                  : "bg-secondary text-white"
                              }`}
                              style={{ fontSize: "0.75rem" }}
                            >
                              {effectiveStatus}
                            </span>
                          </td>

                          {/* Created Date */}
                          <td className="small text-secondary">
                            {role.created_at
                              ? new Date(role.created_at).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>

                          {/* Actions: View, Edit, Delete */}
                          <td className="text-end">
                            <div className="d-inline-flex align-items-center gap-1">
                              {/* View Role */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                title="View Role Permissions"
                                onClick={() => setViewingRole(role)}
                              >
                                <Eye size={13} className="me-1" />
                                <span>View</span>
                              </button>

                              {/* Edit Role */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                title="Edit Role & Permissions"
                                onClick={() => handleOpenEditRole(role)}
                              >
                                <Edit2 size={13} className="me-1" />
                                <span>Edit</span>
                              </button>

                              {/* Delete Role */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                title={
                                  isSystemRole
                                    ? "System Super Admin cannot be deleted"
                                    : "Delete Role"
                                }
                                disabled={isSystemRole}
                                onClick={() => handleInitiateDeleteRole(role)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredRoles.length > rolesPerPage && (
              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <span className="small text-secondary">
                  Showing {(rolePage - 1) * rolesPerPage + 1} to{" "}
                  {Math.min(rolePage * rolesPerPage, filteredRoles.length)} of{" "}
                  {filteredRoles.length} roles
                </span>
                <div className="btn-group btn-group-sm">
                  <button
                    className="btn btn-outline-secondary"
                    disabled={rolePage === 1}
                    onClick={() => setRolePage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalRolePages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      className={`btn ${
                        rolePage === num ? "btn-primary" : "btn-outline-secondary"
                      }`}
                      onClick={() => setRolePage(num)}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    className="btn btn-outline-secondary"
                    disabled={rolePage === totalRolePages}
                    onClick={() => setRolePage((p) => Math.min(totalRolePages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2 CONTENT: USERS TAB                                                  */}
        {/* ========================================================================= */}
        {activeTab === "USERS" && (
          <div className="p-3 p-md-4">
            {/* Filter and Search Bar */}
            <div className="row g-2 mb-3 align-items-center justify-content-between">
              <div className="col-12 col-md-4">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Search by name, email or phone..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                  />
                  {userSearch && (
                    <button
                      className="btn btn-outline-secondary border-start-0"
                      onClick={() => setUserSearch("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-auto d-flex flex-wrap align-items-center gap-2">
                {/* Filter by Role */}
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-secondary fw-semibold text-nowrap">Role:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ minWidth: "140px" }}
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setUserPage(1);
                    }}
                  >
                    <option value="ALL">All Roles</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Status */}
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-secondary fw-semibold text-nowrap">Status:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ minWidth: "120px" }}
                    value={userStatusFilter}
                    onChange={(e) => {
                      setUserStatusFilter(e.target.value as any);
                      setUserPage(1);
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {/* Add User */}
                <button
                  type="button"
                  className="btn btn-sm btn-primary-custom text-nowrap d-flex align-items-center gap-1"
                  onClick={handleOpenAddUser}
                >
                  <UserPlus size={14} />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-3 border">
                <Users2 size={36} className="text-muted mb-2" />
                <h6 className="fw-bold text-dark">No Users Found</h6>
                <p className="text-secondary small mb-3">
                  {userSearch || userRoleFilter !== "ALL" || userStatusFilter !== "ALL"
                    ? "No users match your search or filter criteria."
                    : "No administrative accounts exist yet."}
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-primary-custom"
                  onClick={handleOpenAddUser}
                >
                  <UserPlus size={14} className="me-1" />
                  Add Administrative User
                </button>
              </div>
            ) : (
              <div className="table-responsive rounded-3 border">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-secondary small text-uppercase fw-bold">
                    <tr>
                      <th style={{ minWidth: "220px" }}>User Details</th>
                      <th style={{ minWidth: "140px" }}>Mobile Number</th>
                      <th style={{ minWidth: "160px" }}>Assigned Role</th>
                      <th className="text-center" style={{ minWidth: "100px" }}>
                        Status
                      </th>
                      <th style={{ minWidth: "130px" }}>Created Date</th>
                      <th className="text-end" style={{ minWidth: "200px" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => {
                      const isSuperAdmin = user.role_name === "Super Admin";

                      return (
                        <tr key={user.id}>
                          {/* User Details */}
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center"
                                style={{ width: "36px", height: "36px", fontSize: "0.85rem" }}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {currentUser?.email?.toLowerCase() === user.email.toLowerCase() && (
                                    <span
                                      className="badge bg-info-subtle text-info border"
                                      style={{ fontSize: "0.65rem" }}
                                    >
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-muted small font-monospace">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Mobile */}
                          <td>
                            <span className="small text-secondary font-monospace">
                              {user.mobile || user.phone || "—"}
                            </span>
                          </td>

                          {/* Assigned Role */}
                          <td>
                            <span
                              className={`badge rounded-pill ${
                                isSuperAdmin
                                  ? "bg-primary-subtle text-primary border border-primary-subtle"
                                  : user.role_name === "Accountant"
                                  ? "bg-success-subtle text-success border border-success-subtle"
                                  : "bg-light text-dark border"
                              }`}
                              style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                            >
                              <ShieldCheck size={13} className="me-1 d-inline" />
                              {user.role_name}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="text-center">
                            <span
                              className={`badge ${
                                user.status === "ACTIVE"
                                  ? "bg-success text-white"
                                  : "bg-secondary text-white"
                              }`}
                              style={{ fontSize: "0.75rem" }}
                            >
                              {user.status || "ACTIVE"}
                            </span>
                          </td>

                          {/* Created Date */}
                          <td className="small text-secondary">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>

                          {/* Actions: Assign Role, Edit User, Delete User */}
                          <td className="text-end">
                            <div className="d-inline-flex align-items-center gap-1">
                              {/* Assign Role Workflow Modal Trigger */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary fw-semibold"
                                title="Assign Role"
                                onClick={() => handleOpenAssignRole(user)}
                              >
                                <KeyRound size={13} className="me-1" />
                                <span>Assign Role</span>
                              </button>

                              {/* Edit User */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                title="Edit Account Details"
                                onClick={() => handleOpenEditUser(user)}
                              >
                                <Edit2 size={13} />
                              </button>

                              {/* Delete User */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                title="Delete Account"
                                disabled={
                                  isSuperAdmin &&
                                  users.filter((u) => u.role_name === "Super Admin").length <= 1
                                }
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredUsers.length > usersPerPage && (
              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <span className="small text-secondary">
                  Showing {(userPage - 1) * usersPerPage + 1} to{" "}
                  {Math.min(userPage * usersPerPage, filteredUsers.length)} of{" "}
                  {filteredUsers.length} users
                </span>
                <div className="btn-group btn-group-sm">
                  <button
                    className="btn btn-outline-secondary"
                    disabled={userPage === 1}
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      className={`btn ${
                        userPage === num ? "btn-primary" : "btn-outline-secondary"
                      }`}
                      onClick={() => setUserPage(num)}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    className="btn btn-outline-secondary"
                    disabled={userPage === totalUserPages}
                    onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT ROLE WITH GRANULAR PERMISSION MATRIX                 */}
      {/* ========================================================================= */}
      {showRoleModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 pt-4 pb-3 bg-white">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="bg-primary-subtle text-primary rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style={{ width: "36px", height: "36px" }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">
                      {editingRole ? `Edit Role: ${editingRole.name}` : "Create New Custom Role"}
                    </h5>
                    <div className="small text-secondary">
                      {editingRole
                        ? "Update role name, status and modify assigned module permissions"
                        : "Define a new role and manually select the exact permissions it will grant"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRoleModal(false)}
                />
              </div>

              <form onSubmit={handleSaveRole}>
                <div className="modal-body p-4 overflow-auto" style={{ maxHeight: "72vh" }}>
                  {/* Basic Role Fields */}
                  <div className="row g-3 mb-4 bg-light p-3 rounded-3 border">
                    <div className="col-12 col-md-5">
                      <label className="form-label small fw-bold text-dark">
                        Role Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Society Manager, Billing Auditor"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        disabled={editingRole?.id === "role-super-admin"}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-5">
                      <label className="form-label small fw-bold text-dark">
                        Description <span className="text-muted fw-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Brief summary of duties and responsibilities"
                        value={roleDescription}
                        onChange={(e) => setRoleDescription(e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-2">
                      <label className="form-label small fw-bold text-dark">Status</label>
                      <select
                        className="form-select"
                        value={roleStatus}
                        onChange={(e) => setRoleStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                        disabled={editingRole?.id === "role-super-admin"}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>

                  {/* Permission Matrix Header & Global Controls */}
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
                    <div>
                      <div className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
                        <span>Module-Wise Permission Matrix</span>
                        <span
                          className={`badge rounded-pill ${
                            selectedPermissionsCount > 0
                              ? "bg-primary-subtle text-primary border border-primary-subtle"
                              : "bg-light text-muted border"
                          }`}
                          style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                        >
                          {selectedPermissionsCount} of {TOTAL_AVAILABLE_PERMISSIONS} Permissions Selected
                        </span>
                      </div>
                      <div className="text-secondary small">
                        Select applicable actions for each module. Unchecked permissions will remain strictly forbidden.
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleGlobalSelectAll(true)}
                      >
                        <Check size={14} className="me-1" />
                        Select All
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleGlobalSelectAll(false)}
                      >
                        <X size={14} className="me-1" />
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* DESKTOP TABLE VIEW (hidden on mobile, visible on md and up) */}
                  <div className="d-none d-md-block table-responsive rounded-3 border">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
                      <thead className="table-light">
                        <tr className="text-secondary text-uppercase small" style={{ fontSize: "0.75rem" }}>
                          <th style={{ width: "260px" }}>Module</th>
                          <th className="text-center" style={{ width: "100px" }}>
                            View
                          </th>
                          <th className="text-center" style={{ width: "100px" }}>
                            Create
                          </th>
                          <th className="text-center" style={{ width: "100px" }}>
                            Edit
                          </th>
                          <th className="text-center" style={{ width: "100px" }}>
                            Delete
                          </th>
                          <th className="text-center" style={{ width: "100px" }}>
                            Export
                          </th>
                          <th style={{ minWidth: "220px" }}>Other Actions</th>
                          <th className="text-end" style={{ width: "110px" }}>
                            Quick
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {APPLICATION_MODULES.map((mod) => {
                          const modPerms = rolePermissions[mod.key] || {};
                          const viewAct = mod.actions.find((a) => a.column === "view");
                          const createAct = mod.actions.find((a) => a.column === "create");
                          const updateAct = mod.actions.find((a) => a.column === "update");
                          const deleteAct = mod.actions.find((a) => a.column === "delete");
                          const exportAct = mod.actions.find((a) => a.column === "export");
                          const otherActs = mod.actions.filter((a) => a.column === "other");

                          const isAllSelected = mod.actions.every((a) => modPerms[a.key]);

                          return (
                            <tr key={mod.key}>
                              {/* Module info */}
                              <td>
                                <div className="fw-bold text-dark">{mod.name}</div>
                                <div className="text-muted" style={{ fontSize: "0.74rem" }}>
                                  {mod.description}
                                </div>
                              </td>

                              {/* View / Read */}
                              <td className="text-center">
                                {viewAct ? (
                                  <div className="form-check d-inline-block m-0">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={Boolean(modPerms[viewAct.key])}
                                      onChange={() => handleTogglePermission(mod.key, viewAct.key)}
                                      title={viewAct.description}
                                      style={{ cursor: "pointer", width: "18px", height: "18px" }}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>

                              {/* Create */}
                              <td className="text-center">
                                {createAct ? (
                                  <div className="form-check d-inline-block m-0">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={Boolean(modPerms[createAct.key])}
                                      onChange={() => handleTogglePermission(mod.key, createAct.key)}
                                      title={createAct.description}
                                      style={{ cursor: "pointer", width: "18px", height: "18px" }}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>

                              {/* Edit / Update */}
                              <td className="text-center">
                                {updateAct ? (
                                  <div className="form-check d-inline-block m-0">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={Boolean(modPerms[updateAct.key])}
                                      onChange={() => handleTogglePermission(mod.key, updateAct.key)}
                                      title={updateAct.description}
                                      style={{ cursor: "pointer", width: "18px", height: "18px" }}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>

                              {/* Delete */}
                              <td className="text-center">
                                {deleteAct ? (
                                  <div className="form-check d-inline-block m-0">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={Boolean(modPerms[deleteAct.key])}
                                      onChange={() => handleTogglePermission(mod.key, deleteAct.key)}
                                      title={deleteAct.description}
                                      style={{ cursor: "pointer", width: "18px", height: "18px" }}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>

                              {/* Export */}
                              <td className="text-center">
                                {exportAct ? (
                                  <div className="form-check d-inline-block m-0">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={Boolean(modPerms[exportAct.key])}
                                      onChange={() => handleTogglePermission(mod.key, exportAct.key)}
                                      title={exportAct.description}
                                      style={{ cursor: "pointer", width: "18px", height: "18px" }}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>

                              {/* Other / Module-Specific actions */}
                              <td>
                                {otherActs.length > 0 ? (
                                  <div className="d-flex flex-wrap gap-2">
                                    {otherActs.map((act) => (
                                      <label
                                        key={act.key}
                                        className="form-check form-check-inline m-0 small d-flex align-items-center gap-1.5 p-1 rounded bg-light border"
                                        style={{ cursor: "pointer" }}
                                      >
                                        <input
                                          type="checkbox"
                                          className="form-check-input m-0"
                                          checked={Boolean(modPerms[act.key])}
                                          onChange={() => handleTogglePermission(mod.key, act.key)}
                                          style={{ cursor: "pointer" }}
                                        />
                                        <span className="small fw-semibold text-dark">{act.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>

                              {/* Module Select All / Clear All */}
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm p-0 text-decoration-none small"
                                  onClick={() => handleModuleSelectAll(mod.key, !isAllSelected)}
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {isAllSelected ? "Clear" : "All"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE EXPANDABLE CARD VIEW (<768px) */}
                  <div className="d-block d-md-none d-flex flex-column gap-2">
                    {APPLICATION_MODULES.map((mod) => {
                      const modPerms = rolePermissions[mod.key] || {};
                      const isExpanded = expandedMobileModules[mod.key] ?? false;
                      const selectedInMod = mod.actions.filter((a) => modPerms[a.key]).length;

                      return (
                        <div key={mod.key} className="border rounded-3 bg-white overflow-hidden shadow-sm">
                          <div
                            className="p-3 d-flex justify-content-between align-items-center bg-light"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              setExpandedMobileModules((prev) => ({
                                ...prev,
                                [mod.key]: !isExpanded,
                              }))
                            }
                          >
                            <div>
                              <div className="fw-bold text-dark">{mod.name}</div>
                              <span
                                className={`badge rounded-pill ${
                                  selectedInMod > 0 ? "bg-primary text-white" : "bg-secondary-subtle text-secondary"
                                }`}
                                style={{ fontSize: "0.7rem" }}
                              >
                                {selectedInMod} / {mod.actions.length} selected
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleModuleSelectAll(mod.key, selectedInMod < mod.actions.length);
                                }}
                              >
                                {selectedInMod === mod.actions.length ? "Deselect" : "Select All"}
                              </button>
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-3 border-top">
                              <div className="d-flex flex-column gap-2">
                                {mod.actions.map((act) => (
                                  <label
                                    key={act.key}
                                    className="d-flex align-items-start gap-2 p-2 rounded bg-light border"
                                    style={{ cursor: "pointer" }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="form-check-input mt-1"
                                      checked={Boolean(modPerms[act.key])}
                                      onChange={() => handleTogglePermission(mod.key, act.key)}
                                      style={{ cursor: "pointer" }}
                                    />
                                    <div>
                                      <div className="fw-semibold text-dark small">{act.label}</div>
                                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                                        {act.description}
                                      </div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowRoleModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom d-flex align-items-center gap-2">
                    <Save size={16} />
                    <span>{editingRole ? "Save Changes" : "Create Role"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW ROLE DETAILS & PERMISSION SUMMARY                             */}
      {/* ========================================================================= */}
      {viewingRole && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 pt-4 pb-3 bg-white">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="bg-primary-subtle text-primary rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style={{ width: "36px", height: "36px" }}
                  >
                    <Eye size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">
                      Role Overview: {viewingRole.name}
                    </h5>
                    <div className="small text-secondary">{viewingRole.description || "Custom Role"}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingRole(null)}
                />
              </div>

              <div className="modal-body p-4 overflow-auto" style={{ maxHeight: "70vh" }}>
                <div className="row g-3 mb-4">
                  <div className="col-4">
                    <div className="p-3 bg-light rounded-3 border text-center">
                      <div className="small text-secondary fw-semibold">Status</div>
                      <div className="fw-bold fs-6 text-dark mt-1">
                        <span className="badge bg-success">{viewingRole.status || "ACTIVE"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 bg-light rounded-3 border text-center">
                      <div className="small text-secondary fw-semibold">Assigned Users</div>
                      <div className="fw-bold fs-6 text-dark mt-1">
                        {getAssignedUsersCount(viewingRole)} Account(s)
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 bg-light rounded-3 border text-center">
                      <div className="small text-secondary fw-semibold">Permissions</div>
                      <div className="fw-bold fs-6 text-dark mt-1">
                        {getAssignedPermissionsCount(viewingRole)} / {TOTAL_AVAILABLE_PERMISSIONS} Active
                      </div>
                    </div>
                  </div>
                </div>

                <div className="fw-bold text-dark mb-2">Granted Module Permissions</div>
                <div className="table-responsive rounded-3 border">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light small text-secondary">
                      <tr>
                        <th>Module</th>
                        <th>Granted Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {APPLICATION_MODULES.map((mod) => {
                        const modPerms = viewingRole.permissions?.[mod.key] || {};
                        const activeActions = mod.actions.filter((a) => (modPerms as Record<string, any>)[a.key]);

                        return (
                          <tr key={mod.key}>
                            <td className="fw-semibold text-dark small" style={{ width: "200px" }}>
                              {mod.name}
                            </td>
                            <td>
                              {activeActions.length > 0 ? (
                                <div className="d-flex flex-wrap gap-1">
                                  {activeActions.map((act) => (
                                    <span
                                      key={act.key}
                                      className="badge bg-success-subtle text-success border border-success-subtle"
                                      style={{ fontSize: "0.72rem" }}
                                    >
                                      ✓ {act.label}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted small">None</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                <button
                  type="button"
                  className="btn btn-primary-custom"
                  onClick={() => setViewingRole(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN ROLE TO USER (Dedicated 4-Step Simple Workflow)            */}
      {/* ========================================================================= */}
      {assigningUser && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 pt-4 pb-3 bg-white">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="bg-primary-subtle text-primary rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style={{ width: "36px", height: "36px" }}
                  >
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">Assign Role to User</h5>
                    <div className="small text-secondary">Update user role and auto-inherit permissions</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setAssigningUser(null)}
                />
              </div>

              <div className="modal-body p-4">
                {/* User Name (Read Only) */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">User Full Name</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={assigningUser.name}
                    readOnly
                  />
                </div>

                {/* Email Address (Read Only) */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Email Address (Login)</label>
                  <input
                    type="text"
                    className="form-control bg-light font-monospace"
                    value={assigningUser.email}
                    readOnly
                  />
                </div>

                {/* Current Assigned Role (Read Only) */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Current Assigned Role</label>
                  <div className="p-2.5 bg-light rounded border d-flex align-items-center justify-content-between">
                    <span className="fw-semibold text-dark">{assigningUser.role_name}</span>
                    <span className="badge bg-secondary-subtle text-secondary">CURRENT</span>
                  </div>
                </div>

                {/* New Role Dropdown (Dynamically shows manually created & active roles) */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">
                    Select New Role <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-lg fs-6"
                    value={selectedNewRoleId}
                    onChange={(e) => setSelectedNewRoleId(e.target.value)}
                  >
                    {availableActiveRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.is_system ? "(System Super Admin)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Information Callout */}
                <div className="p-3 rounded-3 bg-primary-subtle border border-primary-subtle small text-primary d-flex align-items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    The user will automatically inherit all permissions configured under this role without needing individual permission assignments.
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setAssigningUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary-custom d-flex align-items-center gap-2"
                  onClick={handleSaveRoleAssignment}
                >
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE ROLE WITH USER REASSIGNMENT                                 */}
      {/* ========================================================================= */}
      {roleToDelete && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 pt-4 pb-3 bg-danger-subtle text-danger">
                <div className="d-flex align-items-center gap-2">
                  <AlertCircle size={22} />
                  <h5 className="modal-title fw-bold mb-0">Reassign Users Before Deleting</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRoleToDelete(null)}
                />
              </div>

              <div className="modal-body p-4">
                <p className="text-dark small mb-3">
                  Role <strong>&quot;{roleToDelete.name}&quot;</strong> is currently assigned to{" "}
                  <strong>{getAssignedUsersCount(roleToDelete)}</strong> active user(s).
                  To prevent broken permissions or orphaned accounts, please choose another active role to reassign these users to before deleting this role:
                </p>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">
                    Reassign Users To Role:
                  </label>
                  <select
                    className="form-select"
                    value={reassignTargetRoleId}
                    onChange={(e) => setReassignTargetRoleId(e.target.value)}
                  >
                    {roles
                      .filter((r) => r.id !== roleToDelete.id && (r.status === "ACTIVE" || !r.status))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setRoleToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger d-flex align-items-center gap-1.5"
                  onClick={handleConfirmDeleteWithReassignment}
                >
                  <Trash2 size={15} />
                  <span>Reassign Users &amp; Delete Role</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT ADMINISTRATIVE USER                                     */}
      {/* ========================================================================= */}
      {showUserModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 pt-4 pb-3 bg-white">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="bg-primary-subtle text-primary rounded-3 p-2 d-flex align-items-center justify-content-center"
                    style={{ width: "36px", height: "36px" }}
                  >
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">
                      {editingUser ? `Edit Account: ${editingUser.name}` : "Add Administrative User"}
                    </h5>
                    <div className="small text-secondary">
                      {editingUser
                        ? "Update name, contact info, status or password"
                        : "Create an administrator account with login credentials"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUserModal(false)}
                />
              </div>

              <form onSubmit={handleSaveUser}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Anand Kulkarni"
                      value={userNameInput}
                      onChange={(e) => setUserNameInput(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">
                      Email Address (Login Username) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. anand@parijatsociety.org"
                      value={userEmailInput}
                      onChange={(e) => setUserEmailInput(e.target.value)}
                      disabled={Boolean(editingUser)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-bold text-dark">Mobile Number</label>
                      <input
                        type="tel"
                        maxLength={10}
                        className="form-control"
                        placeholder="10-digit number"
                        value={userMobileInput}
                        onChange={(e) => setUserMobileInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-bold text-dark">Account Status</label>
                      <select
                        className="form-select"
                        value={userStatusInput}
                        onChange={(e) => setUserStatusInput(e.target.value as "ACTIVE" | "INACTIVE")}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">
                      Assigned Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={userRoleInput}
                      onChange={(e) => setUserRoleInput(e.target.value)}
                      required
                    >
                      {availableActiveRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Password section */}
                  <div className="row g-2 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-bold text-dark">
                        {editingUser ? "New Password" : "Password"}{" "}
                        <span className="text-muted fw-normal">
                          {editingUser ? "(leave blank to keep)" : "(default: admin@123)"}
                        </span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control"
                          placeholder={editingUser ? "Unchanged" : "admin@123"}
                          value={userPasswordInput}
                          onChange={(e) => setUserPasswordInput(e.target.value)}
                          minLength={6}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-bold text-dark">Confirm Password</label>
                      <div className="input-group">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className="form-control"
                          placeholder="Re-enter password"
                          value={userConfirmPasswordInput}
                          onChange={(e) => setUserConfirmPasswordInput(e.target.value)}
                          disabled={!userPasswordInput.trim()}
                          minLength={6}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowUserModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom d-flex align-items-center gap-2">
                    <Save size={16} />
                    <span>{editingUser ? "Save Changes" : "Create Account"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { DataStorage } from "@/services/dataStorage";
import { Role, AdminUser, SystemModuleKey, ModulePermission } from "@/types/database.types";
import {
  ShieldCheck,
  PlusCircle,
  UserCheck,
  Lock,
  Check,
  X,
  Shield,
  Edit2,
  Trash2,
  KeyRound,
  Users2,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

const MODULE_DEFINITIONS: { key: SystemModuleKey; label: string; description: string }[] = [
  { key: "dashboard", label: "Dashboard", description: "Society KPI metrics & summary charts" },
  { key: "floors", label: "Floors Management", description: "Floor master & structure configuration" },
  { key: "flats", label: "Flats Management", description: "Flat master, overrides, and occupant links" },
  { key: "residents", label: "Residents Management", description: "Resident profiles, owner/tenant history" },
  { key: "maintenance", label: "Maintenance Billing", description: "Monthly invoices & due generation" },
  { key: "payments", label: "Payments Collection", description: "Maintenance receipts & allocations" },
  { key: "expenses", label: "Society Expenses", description: "Society operational & common expenditures" },
  { key: "wallet", label: "Society Wallet & Ledger", description: "Financial cash book & balance ledger" },
  { key: "mailer", label: "Mailer & Reminders", description: "Automated cron & manual email notices" },
  { key: "app_setup", label: "App Setup & Rules", description: "Society bank details, rates & billing rules" },
  { key: "reports", label: "Reports & Audits", description: "Financial summaries, Excel & PDF exports" },
  { key: "users", label: "Admin Users", description: "Administrative accounts & credentials" },
  { key: "roles", label: "Roles & Permissions", description: "RBAC security & access matrix" },
];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<"USERS" | "ROLES">("USERS");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // User Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRoleId, setUserRoleId] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userConfirmPassword, setUserConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editUserRoleId, setEditUserRoleId] = useState("");
  const [editUserStatus, setEditUserStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Role Modals
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<Record<SystemModuleKey, ModulePermission>>({
    dashboard: { create: false, read: true, update: false, delete: false },
    floors: { create: false, read: true, update: false, delete: false },
    flats: { create: false, read: true, update: false, delete: false },
    residents: { create: false, read: true, update: false, delete: false },
    maintenance: { create: false, read: true, update: false, delete: false },
    payments: { create: false, read: true, update: false, delete: false },
    expenses: { create: false, read: true, update: false, delete: false },
    wallet: { create: false, read: true, update: false, delete: false },
    mailer: { create: false, read: true, update: false, delete: false },
    app_setup: { create: false, read: false, update: false, delete: false },
    reports: { create: false, read: true, update: false, delete: false },
    users: { create: false, read: false, update: false, delete: false },
    roles: { create: false, read: false, update: false, delete: false },
  });

  const loadData = () => {
    const allUsers = DataStorage.getUsers();
    const allRoles = DataStorage.getRoles();
    setUsers(allUsers);
    setRoles(allRoles);
    if (allRoles.length > 0 && !userRoleId) {
      setUserRoleId(allRoles[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- USER HANDLERS ---
  const handleOpenAddUser = () => {
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setUserRoleId(roles.length > 0 ? roles[0].id : "role-super-admin");
    setShowAddUserModal(true);
  };

  const handleSaveAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      toast.error("Please fill in user name and email address");
      return;
    }

    const finalPassword = userPassword.trim() || "admin@123";
    if (userPassword.trim()) {
      if (userPassword.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }
      if (userPassword !== userConfirmPassword) {
        toast.error("Password and Confirm Password do not match");
        return;
      }
    }

    try {
      const selectedRole = roles.find((r) => r.id === userRoleId);
      DataStorage.addUser({
        name: userName.trim(),
        email: userEmail.trim(),
        password: finalPassword,
        role_id: userRoleId,
        role_name: selectedRole ? selectedRole.name : "Society Admin",
        status: "ACTIVE",
        last_login: "Never",
      });
      toast.success(
        userPassword.trim()
          ? `User "${userName}" created successfully with custom login password!`
          : `User "${userName}" created successfully with default password (admin@123)!`
      );
      setShowAddUserModal(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add user");
    }
  };

  const handleOpenEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditUserRoleId(user.role_id);
    setEditUserStatus(user.status);
    setEditUserPassword("");
    setShowEditPassword(false);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const selectedRole = roles.find((r) => r.id === editUserRoleId);
      const updateData: Partial<AdminUser> = {
        role_id: editUserRoleId,
        role_name: selectedRole ? selectedRole.name : editingUser.role_name,
        status: editUserStatus,
      };

      if (editUserPassword.trim()) {
        if (editUserPassword.length < 6) {
          toast.error("New password must be at least 6 characters long");
          return;
        }
        updateData.password = editUserPassword.trim();
      }

      DataStorage.updateUser(editingUser.id, updateData);
      toast.success(
        editUserPassword.trim()
          ? `User "${editingUser.name}" updated with new password. They can now log in with the new password.`
          : `User "${editingUser.name}" updated successfully.`
      );
      setEditingUser(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleDeleteUser = (user: AdminUser) => {
    if (confirm(`Are you sure you want to delete admin account "${user.name}" (${user.email})?`)) {
      try {
        DataStorage.deleteUser(user.id);
        toast.success(`User "${user.name}" deleted successfully`);
        loadData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete user");
      }
    }
  };

  // --- ROLE HANDLERS ---
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    const defaultPerms: Record<SystemModuleKey, ModulePermission> = {} as any;
    MODULE_DEFINITIONS.forEach((m) => {
      defaultPerms[m.key] = { create: false, read: true, update: false, delete: false };
    });
    setRolePermissions(defaultPerms);
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setRolePermissions(JSON.parse(JSON.stringify(role.permissions)));
    setShowRoleModal(true);
  };

  const handleTogglePermission = (
    moduleKey: SystemModuleKey,
    op: "create" | "read" | "update" | "delete"
  ) => {
    setRolePermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [op]: !prev[moduleKey]?.[op],
      },
    }));
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    try {
      if (editingRole) {
        DataStorage.updateRole(editingRole.id, {
          name: roleName.trim(),
          description: roleDescription.trim() || null,
          permissions: rolePermissions,
        });
        toast.success(`Role "${roleName}" updated successfully`);
      } else {
        DataStorage.addRole({
          name: roleName.trim(),
          description: roleDescription.trim() || null,
          is_system: false,
          permissions: rolePermissions,
        });
        toast.success(`New role "${roleName}" created successfully`);
      }
      setShowRoleModal(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    }
  };

  const handleDeleteRole = (role: Role) => {
    if (confirm(`Delete role "${role.name}"? This cannot be undone.`)) {
      try {
        DataStorage.deleteRole(role.id);
        toast.success(`Role "${role.name}" deleted successfully`);
        loadData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete role");
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Admin User Management &amp; Permissions"
        subtitle="Manage administrative accounts, role-based access control (RBAC), and granular CRUD permissions"
        breadcrumbs={[{ label: "Users & Roles" }]}
        actions={
          <div className="toolbar-actions">
            <button
              className="btn btn-outline-primary"
              onClick={handleOpenCreateRole}
            >
              <KeyRound size={16} className="me-1" />
              <span>Create Role</span>
            </button>
            <button
              className="btn btn-primary-custom"
              onClick={handleOpenAddUser}
            >
              <PlusCircle size={16} className="me-1" />
              <span>Add Admin User</span>
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="card-premium mb-4">
        <div className="px-4 pt-3 border-bottom">
          <ul className="nav nav-tabs border-0 gap-3">
            <li className="nav-item">
              <button
                className={`nav-link pb-3 fw-semibold border-0 ${
                  activeTab === "USERS"
                    ? "active border-bottom border-3 border-primary text-primary"
                    : "text-secondary"
                }`}
                onClick={() => setActiveTab("USERS")}
              >
                <div className="d-flex align-items-center gap-2">
                  <Users2 size={16} />
                  <span>Admin Users ({users.length})</span>
                </div>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link pb-3 fw-semibold border-0 ${
                  activeTab === "ROLES"
                    ? "active border-bottom border-3 border-primary text-primary"
                    : "text-secondary"
                }`}
                onClick={() => setActiveTab("ROLES")}
              >
                <div className="d-flex align-items-center gap-2">
                  <Lock size={16} />
                  <span>Roles &amp; CRUD Permissions ({roles.length})</span>
                </div>
              </button>
            </li>
          </ul>
        </div>

        {/* TAB 1: USERS LIST */}
        {activeTab === "USERS" && (
          <div>
            <div className="table-responsive">
              <table className="table table-premium align-middle mb-0">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Assigned Role</th>
                    <th>Account Status</th>
                    <th>Last Active</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="fw-bold text-dark">{u.name}</div>
                        <div className="small text-secondary font-monospace">{u.email}</div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.role_name === "Super Admin"
                              ? "bg-primary-subtle text-primary border"
                              : u.role_name === "Accountant"
                              ? "bg-success-subtle text-success border"
                              : "bg-light text-dark border"
                          }`}
                        >
                          {u.role_name}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.status === "ACTIVE" ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="small text-secondary">{u.last_login}</td>
                      <td className="text-end">
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenEditUser(u)}
                            title="Change Role / Status"
                          >
                            <Edit2 size={13} className="me-1" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger btn-action-icon"
                            onClick={() => handleDeleteUser(u)}
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ROLES & PERMISSIONS */}
        {activeTab === "ROLES" && (
          <div className="p-4">
            <div className="row g-4">
              {/* Left Column: Roles Cards */}
              <div className="col-12 col-lg-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark mb-0">Configured System &amp; Custom Roles</h6>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleOpenCreateRole}
                  >
                    <PlusCircle size={14} className="me-1" />
                    New Role
                  </button>
                </div>

                <div className="d-flex flex-column gap-3">
                  {roles.map((r) => {
                    const assignedUsersCount = users.filter((u) => u.role_id === r.id || u.role_name === r.name).length;
                    return (
                      <div
                        key={r.id}
                        className="p-3 bg-white rounded-3 border shadow-sm"
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <div className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
                              <span>{r.name}</span>
                              {r.is_system && (
                                <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: "0.65rem" }}>
                                  SYSTEM
                                </span>
                              )}
                            </div>
                            <div className="small text-secondary mt-1">
                              {r.description || "Custom operational role"}
                            </div>
                          </div>
                          <span className="badge bg-light text-dark border">
                            {assignedUsersCount} User(s)
                          </span>
                        </div>

                        <div className="action-buttons pt-2 border-top mt-2 w-100">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenEditRole(r)}
                          >
                            <Edit2 size={13} className="me-1" />
                            <span>Edit Permissions</span>
                          </button>
                          {!r.is_system && r.id !== "role-super-admin" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger btn-action-icon"
                              onClick={() => handleDeleteRole(r)}
                              disabled={assignedUsersCount > 0}
                              title={
                                assignedUsersCount > 0
                                  ? "Cannot delete role assigned to users"
                                  : "Delete role"
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Roles Matrix Overview */}
              <div className="col-12 col-lg-7">
                <div className="card-premium h-100 p-3 bg-light">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <ShieldCheck size={18} className="text-primary" />
                    <h6 className="fw-bold text-dark mb-0">Role Permission Matrix (CRUD Operations)</h6>
                  </div>

                  <div className="table-responsive rounded-3 bg-white border">
                    <table className="table table-sm align-middle small mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Module</th>
                          {roles.map((r) => (
                            <th key={r.id} className="text-center">
                              {r.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {MODULE_DEFINITIONS.map((m) => (
                          <tr key={m.key}>
                            <td>
                              <div className="fw-semibold text-dark">{m.label}</div>
                              <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                                {m.description}
                              </div>
                            </td>
                            {roles.map((r) => {
                              const perm = r.permissions?.[m.key];
                              const hasFull = perm?.create && perm?.read && perm?.update && perm?.delete;
                              const hasNone = !perm?.create && !perm?.read && !perm?.update && !perm?.delete;
                              return (
                                <td key={r.id} className="text-center" style={{ whiteSpace: "nowrap" }}>
                                  {hasFull ? (
                                    <span className="badge bg-success-subtle text-success border">Full CRUD</span>
                                  ) : hasNone ? (
                                    <span className="badge bg-light text-muted border">None</span>
                                  ) : (
                                    <div className="d-inline-flex gap-1" style={{ fontSize: "0.7rem" }}>
                                      {perm?.create && <span className="badge bg-primary">C</span>}
                                      {perm?.read && <span className="badge bg-info text-dark">R</span>}
                                      {perm?.update && <span className="badge bg-warning text-dark">U</span>}
                                      {perm?.delete && <span className="badge bg-danger">D</span>}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title fw-bold text-dark">Add Administrative User</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddUserModal(false)} />
              </div>

              <form onSubmit={handleSaveAddUser}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Ramesh Joshi"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Email Address (Login Username)</label>
                    <input
                      type="email"
                      className="form-control"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="e.g. ramesh@parijatsociety.org"
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Login Password <span className="text-muted fw-normal">(optional, default: admin@123)</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control"
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          placeholder="Default: admin@123"
                          minLength={6}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">Confirm Password</label>
                      <div className="input-group">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className="form-control"
                          value={userConfirmPassword}
                          onChange={(e) => setUserConfirmPassword(e.target.value)}
                          placeholder="Re-enter password if custom"
                          minLength={6}
                          disabled={!userPassword.trim()}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                          title={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Assign System Role</label>
                    <select
                      className="form-select"
                      value={userRoleId}
                      onChange={(e) => setUserRoleId(e.target.value)}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.is_system ? "(System Role)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-2.5 rounded-3 bg-light border text-muted small d-flex align-items-center gap-2">
                    <Lock size={15} className="text-primary flex-shrink-0" />
                    <span>The user will be able to log in to the admin panel with this email and password immediately.</span>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowAddUserModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom">
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title fw-bold text-dark">Edit User Role &amp; Status</h5>
                <button type="button" className="btn-close" onClick={() => setEditingUser(null)} />
              </div>

              <form onSubmit={handleSaveEditUser}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">User Account</label>
                    <div className="p-2 bg-light rounded border fw-semibold text-dark">
                      {editingUser.name} ({editingUser.email})
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Change Assigned Role</label>
                    <select
                      className="form-select"
                      value={editUserRoleId}
                      onChange={(e) => setEditUserRoleId(e.target.value)}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Account Status</label>
                    <select
                      className="form-select"
                      value={editUserStatus}
                      onChange={(e) => setEditUserStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Reset Password <span className="text-muted fw-normal">(optional — leave blank to keep unchanged)</span>
                    </label>
                    <div className="input-group">
                      <input
                        type={showEditPassword ? "text" : "password"}
                        className="form-control"
                        value={editUserPassword}
                        onChange={(e) => setEditUserPassword(e.target.value)}
                        placeholder="Enter new password (min. 6 characters)"
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        tabIndex={-1}
                      >
                        {showEditPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Role Modal with Granular CRUD Checkboxes */}
      {showRoleModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title fw-bold text-dark">
                  {editingRole ? `Edit Role: ${editingRole.name}` : "Create New Custom Role"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowRoleModal(false)} />
              </div>

              <form onSubmit={handleSaveRole}>
                <div className="modal-body p-4 overflow-auto" style={{ maxHeight: "70vh" }}>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Role Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="e.g. Society Manager"
                        disabled={editingRole?.is_system || editingRole?.id === "role-super-admin"}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Role Description</label>
                      <input
                        type="text"
                        className="form-control"
                        value={roleDescription}
                        onChange={(e) => setRoleDescription(e.target.value)}
                        placeholder="e.g. Day-to-day operations and member communications"
                      />
                    </div>
                  </div>

                  <div className="small fw-bold text-dark mb-2 text-uppercase" style={{ letterSpacing: "0.5px" }}>
                    Configure Module CRUD Permissions
                  </div>
                  <div className="table-responsive rounded-3 border">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Module</th>
                          <th className="text-center" style={{ width: "90px" }}>Create</th>
                          <th className="text-center" style={{ width: "90px" }}>Read</th>
                          <th className="text-center" style={{ width: "90px" }}>Update</th>
                          <th className="text-center" style={{ width: "90px" }}>Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MODULE_DEFINITIONS.map((m) => {
                          const p = rolePermissions[m.key] || { create: false, read: false, update: false, delete: false };
                          const isSuperAdminSystem = editingRole?.id === "role-super-admin";
                          return (
                            <tr key={m.key}>
                              <td className="fw-semibold text-dark small">
                                {m.label}
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={Boolean(p.create)}
                                  disabled={isSuperAdminSystem}
                                  onChange={() => handleTogglePermission(m.key, "create")}
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={Boolean(p.read)}
                                  disabled={isSuperAdminSystem}
                                  onChange={() => handleTogglePermission(m.key, "read")}
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={Boolean(p.update)}
                                  disabled={isSuperAdminSystem}
                                  onChange={() => handleTogglePermission(m.key, "update")}
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={Boolean(p.delete)}
                                  disabled={isSuperAdminSystem}
                                  onChange={() => handleTogglePermission(m.key, "delete")}
                                />
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
                    className="btn btn-outline-secondary"
                    onClick={() => setShowRoleModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom">
                    <Save size={15} className="me-1" />
                    <span>Save Role Permissions</span>
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

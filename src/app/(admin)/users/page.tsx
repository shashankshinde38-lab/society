"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { ShieldCheck, PlusCircle, UserCheck, Lock, Check, X, Shield, History } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Society Admin" | "Accountant" | "Viewer";
  status: "ACTIVE" | "INACTIVE";
  lastLogin: string;
}

const INITIAL_USERS: AdminUser[] = [
  {
    id: "usr-1",
    name: "Master Administrator",
    email: "admin@gmail.com",
    role: "Super Admin",
    status: "ACTIVE",
    lastLogin: "Active Now",
  },
  {
    id: "usr-2",
    name: "Pratik Mohol",
    email: "pratik.mohol@gmail.com",
    role: "Super Admin",
    status: "ACTIVE",
    lastLogin: "02 May 2026",
  },
  {
    id: "usr-3",
    name: "Society Accountant",
    email: "accountant@parijat.org",
    role: "Accountant",
    status: "ACTIVE",
    lastLogin: "28 Apr 2026",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminUser["role"]>("Society Admin");

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in user name and email");
      return;
    }

    const newUser: AdminUser = {
      id: "usr-" + Date.now(),
      name: name.trim(),
      email: email.trim(),
      role,
      status: "ACTIVE",
      lastLogin: "Never",
    };

    setUsers([...users, newUser]);
    toast.success(`User ${name} added with ${role} permissions`);
    setShowAddModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Admin User Management &amp; Permissions"
        subtitle="Manage administrative accounts, role-based access control (RBAC), and security audit logs"
        breadcrumbs={[{ label: "Users & Roles" }]}
        actions={
          <button className="btn btn-primary-custom" onClick={() => setShowAddModal(true)}>
            <PlusCircle size={16} />
            <span>Add Admin User</span>
          </button>
        }
      />

      <div className="row g-4 mb-4">
        {/* Admin Users Table */}
        <div className="col-12 col-lg-8">
          <div className="card-premium h-100">
            <div className="card-premium-header">
              <div className="d-flex align-items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <h5 className="fw-bold text-dark mb-0">Authorized Society Administrators</h5>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-premium align-middle mb-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="fw-bold text-dark">{u.name}</div>
                        <div className="small text-secondary">{u.email}</div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === "Super Admin"
                              ? "bg-primary-subtle text-primary border"
                              : u.role === "Accountant"
                              ? "bg-success-subtle text-success border"
                              : "bg-light text-dark border"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-success">ACTIVE</span>
                      </td>
                      <td className="small text-secondary">{u.lastLogin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Permissions Matrix Card */}
        <div className="col-12 col-lg-4">
          <div className="card-premium h-100 p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Lock size={18} className="text-primary" />
              <h6 className="fw-bold text-dark mb-0">Role Permission Matrix</h6>
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Module</th>
                    <th>Super</th>
                    <th>Admin</th>
                    <th>Account</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Dashboard</td>
                    <td className="text-success"><Check size={14} /></td>
                    <td className="text-success"><Check size={14} /></td>
                    <td className="text-success"><Check size={14} /></td>
                  </tr>
                  <tr>
                    <td>App Setup</td>
                    <td className="text-success"><Check size={14} /></td>
                    <td className="text-muted"><X size={14} /></td>
                    <td className="text-muted"><X size={14} /></td>
                  </tr>
                  <tr>
                    <td>Masters</td>
                    <td className="text-success"><Check size={14} /></td>
                    <td className="text-success"><Check size={14} /></td>
                    <td className="text-muted"><X size={14} /></td>
                  </tr>
                  <tr>
                    <td>Maintenance</td>
                    <td className="text-success"><Check size={14} /></td>
                    <td className="text-success"><Check size={14} /></td>
                    <td className="text-success"><Check size={14} /></td>
                  </tr>
                  <tr>
                    <td>Expenses</td>
                    <td className="text-success"><Check size={14} /></td>
                    <td className="text-success"><Check size={14} /></td>
                    <td className="text-success"><Check size={14} /></td>
                  </tr>
                  <tr>
                    <td>Wallet</td>
                    <td className="text-success"><Check size={14} /></td>
                    <td className="text-success"><Check size={14} /></td>
                    <td className="text-success"><Check size={14} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title fw-bold text-dark">Add Administrative User</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
              </div>

              <form onSubmit={handleAddUser}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Joshi"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ramesh@parijatsociety.org"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">System Role</label>
                    <select
                      className="form-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value as AdminUser["role"])}
                    >
                      <option value="Super Admin">Super Admin (Full Access)</option>
                      <option value="Society Admin">Society Admin</option>
                      <option value="Accountant">Accountant (Maintenance, Expenses, Wallet)</option>
                      <option value="Viewer">Viewer / Committee Member (Read-Only)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom">
                    Add User
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

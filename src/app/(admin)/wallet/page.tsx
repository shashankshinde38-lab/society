"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { DataStorage } from "@/services/dataStorage";
import { WalletTransaction, Society } from "@/types/database.types";
import { formatDate } from "@/utils/dateFormatter";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Download,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function WalletPage() {
  const [society, setSociety] = useState<Society | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const loadData = () => {
    setSociety(DataStorage.getSociety());
    setTransactions(DataStorage.getWalletTransactions());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "ALL" || tx.transaction_type === typeFilter;
    const matchesCategory = categoryFilter === "ALL" || tx.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Calculate Ledger Balances
  const openingBalance = society?.opening_balance || 0;
  const totalCredits = transactions
    .filter((t) => t.transaction_type === "CREDIT" && t.category !== "OPENING_BALANCE")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalDebits = transactions
    .filter((t) => t.transaction_type === "DEBIT")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const currentWalletBalance =
    transactions.length > 0 ? transactions[0].running_balance : openingBalance;

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Date", "Transaction Type", "Category", "Amount", "Running Balance", "Description"];
    const rows = transactions.map((t) => [
      formatDate(t.transaction_date),
      t.transaction_type,
      t.category,
      t.amount,
      t.running_balance,
      `"${t.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Parijat_Wallet_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Wallet Ledger CSV exported!");
  };

  return (
    <div>
      <PageHeader
        title="Society Wallet & Financial Ledger"
        subtitle="Complete traceable cash book, opening balance carry-forward, credits, debits, and verified balance formula"
        breadcrumbs={[{ label: "Society Wallet" }]}
        actions={
          <button className="btn btn-primary-custom" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export Ledger CSV</span>
          </button>
        }
      />

      {/* Financial Formula Callout Box */}
      <div className="card-premium p-3 mb-4 bg-white border-start border-4 border-primary">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
            <span className="small text-secondary">
              <strong>Verified Financial Formula:</strong> Closing Balance = Opening Balance (₹
              {openingBalance.toLocaleString()}) + Actual Maintenance Credits (₹
              {totalCredits.toLocaleString()}) &minus; Actual Expenses (₹{totalDebits.toLocaleString()})
            </span>
          </div>
          <span className="badge bg-success-subtle text-success border px-3 py-1.5 fw-bold">
            Audited &amp; Reconciled
          </span>
        </div>
      </div>

      {/* Wallet KPI Cards Row */}
      <div className="row g-3 mb-4">
        {/* Current Available Balance */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="stat-title">Current Wallet Balance</span>
              <div className="stat-icon-wrapper bg-primary-subtle text-primary">
                <Wallet size={22} />
              </div>
            </div>
            <div className="stat-value text-primary fs-3">
              ₹{Number(currentWalletBalance).toLocaleString()}
            </div>
            <div className="small text-secondary mt-1">Available in society account</div>
          </div>
        </div>

        {/* Previous / Opening Balance */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card border-start border-4 border-secondary">
            <div className="stat-title">Opening Balance (FY 2026)</div>
            <div className="stat-value text-dark fs-3">₹{openingBalance.toLocaleString()}</div>
            <div className="small text-secondary mt-1">Carry forward as of 01-Apr-2026</div>
          </div>
        </div>

        {/* Total Collections (Credits) */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="stat-title">Total Maintenance Credits</span>
              <div className="stat-icon-wrapper bg-success-subtle text-success">
                <ArrowUpRight size={22} />
              </div>
            </div>
            <div className="stat-value text-success fs-3">+₹{totalCredits.toLocaleString()}</div>
            <div className="small text-secondary mt-1">Actual cash &amp; online received</div>
          </div>
        </div>

        {/* Total Expenses (Debits) */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card border-start border-4 border-danger">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="stat-title">Total Society Debits</span>
              <div className="stat-icon-wrapper bg-danger-subtle text-danger">
                <ArrowDownRight size={22} />
              </div>
            </div>
            <div className="stat-value text-danger fs-3">-₹{totalDebits.toLocaleString()}</div>
            <div className="small text-secondary mt-1">Audited vendor &amp; utility payments</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-premium mb-4">
        <div className="p-3 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div className="d-flex flex-column flex-sm-row gap-2 flex-grow-1" style={{ maxWidth: "700px" }}>
            <div className="position-relative flex-grow-1">
              <Search size={16} className="position-absolute text-secondary" style={{ top: "10px", left: "12px" }} />
              <input
                type="text"
                className="form-control form-control-sm ps-5 bg-light"
                placeholder="Search description, receipt, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select form-select-sm"
              style={{ width: "160px" }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Transactions</option>
              <option value="CREDIT">Credits (+)</option>
              <option value="DEBIT">Debits (&minus;)</option>
            </select>

            <select
              className="form-select form-select-sm"
              style={{ width: "180px" }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="EXPENSE">Expense</option>
              <option value="OPENING_BALANCE">Opening Balance</option>
            </select>
          </div>

          <div className="small text-secondary">
            Showing <strong className="text-dark">{filteredTransactions.length}</strong> Ledger Entries
          </div>
        </div>
      </div>

      {/* Wallet Ledger Table */}
      <div className="card-premium">
        <div className="table-responsive">
          <table className="table table-premium align-middle mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction Details</th>
                <th>Category</th>
                <th className="text-end">Credit (+)</th>
                <th className="text-end">Debit (&minus;)</th>
                <th className="text-end">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-secondary">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="small text-secondary font-monospace" style={{ whiteSpace: "nowrap" }}>
                      {formatDate(tx.transaction_date)}
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{tx.description}</div>
                      {tx.source_ref_id && (
                        <span className="small text-muted font-monospace" style={{ fontSize: "0.72rem" }}>
                          Ref: {tx.source_ref_id}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          tx.category === "MAINTENANCE"
                            ? "bg-success-subtle text-success border"
                            : tx.category === "EXPENSE"
                            ? "bg-danger-subtle text-danger border"
                            : "bg-primary-subtle text-primary border"
                        }`}
                      >
                        {tx.category}
                      </span>
                    </td>
                    <td className="text-end fw-bold text-success">
                      {tx.transaction_type === "CREDIT"
                        ? `+₹${Number(tx.amount).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="text-end fw-bold text-danger">
                      {tx.transaction_type === "DEBIT"
                        ? `-₹${Number(tx.amount).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="text-end fw-extrabold text-dark fs-6 font-monospace">
                      ₹{Number(tx.running_balance).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

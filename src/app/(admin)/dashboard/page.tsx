"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Layers,
  PlusCircle,
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  PieChart as PieIcon,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge/StatusBadge";
import { DataStorage } from "@/services/dataStorage";
import { DashboardMetrics, MaintenancePayment } from "@/types/database.types";
import { formatDate } from "@/utils/dateFormatter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface MonthlyTrendPoint {
  month: string;
  collected: number;
  expenses: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentPayments, setRecentPayments] = useState<MaintenancePayment[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendPoint[]>([]);
  const [currentMonthFull, setCurrentMonthFull] = useState<string>("");
  const [currentMonthShort, setCurrentMonthShort] = useState<string>("");

  useEffect(() => {
    const loadedMetrics = DataStorage.getDashboardMetrics();
    const payments = DataStorage.getPayments();
    const expenses = DataStorage.getExpenses();

    setMetrics(loadedMetrics);
    setRecentPayments(payments.slice(0, 5));

    const now = new Date();
    const shortLabel = now.toLocaleString("en-US", { month: "short", year: "numeric" });
    const fullLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    setCurrentMonthShort(shortLabel);
    setCurrentMonthFull(fullLabel);

    // Dynamic aggregation starting from this month
    const trendMap = new Map<string, MonthlyTrendPoint>();

    // Always seed this month at 0 so it starts from this month
    trendMap.set(shortLabel, {
      month: shortLabel,
      collected: 0,
      expenses: 0,
    });

    // Populate actual payment collections
    payments.forEach((p) => {
      const d = new Date(p.payment_date);
      const mLabel = !isNaN(d.getTime())
        ? d.toLocaleString("en-US", { month: "short", year: "numeric" })
        : shortLabel;
      if (!trendMap.has(mLabel)) {
        trendMap.set(mLabel, { month: mLabel, collected: 0, expenses: 0 });
      }
      trendMap.get(mLabel)!.collected += Number(p.total_amount_received || 0);
    });

    // Populate actual expenses
    expenses.forEach((e) => {
      const d = new Date(e.expense_date);
      const mLabel = !isNaN(d.getTime())
        ? d.toLocaleString("en-US", { month: "short", year: "numeric" })
        : shortLabel;
      if (!trendMap.has(mLabel)) {
        trendMap.set(mLabel, { month: mLabel, collected: 0, expenses: 0 });
      }
      trendMap.get(mLabel)!.expenses += Number(e.amount || 0);
    });

    setMonthlyTrends(Array.from(trendMap.values()));
  }, []);

  if (!metrics) {
    return <div className="p-5 text-center text-secondary">Loading dashboard analytics...</div>;
  }

  const occupancyPieData =
    metrics.totalFlats > 0 && (metrics.ownerOccupied > 0 || metrics.rentedFlats > 0)
      ? [
          { name: "Owner Occupied", value: metrics.ownerOccupied, color: "#2563eb" },
          { name: "Tenant / Rented", value: metrics.rentedFlats, color: "#f59e0b" },
        ]
      : [{ name: "No Flats Added", value: 1, color: "#e2e8f0" }];

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Society Overview & Financial Dashboard"
        subtitle="Real-time financial status, wallet liquidity, occupancy distribution, and billing analytics"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <div className="d-flex align-items-center gap-2 flex-wrap w-100 w-sm-auto">
            <div className="d-flex align-items-center gap-1.5 bg-white px-2.5 py-1.5 border rounded-3 shadow-sm flex-grow-1 flex-sm-grow-0">
              <Calendar size={15} className="text-primary flex-shrink-0" />
              <span className="small fw-semibold text-dark text-nowrap">
                FY 2026–27 ({currentMonthShort})
              </span>
            </div>
            <Link
              href="/maintenance"
              className="btn btn-primary-custom flex-grow-1 flex-sm-grow-0 justify-content-center"
            >
              <PlusCircle size={16} />
              <span>Collect Payment</span>
            </Link>
          </div>
        }
      />

      {/* Row 1: Primary Financial KPIs */}
      <div className="row g-3 mb-4">
        {/* Available Wallet Balance */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card border-start border-4 border-primary">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="stat-title">Current Wallet Balance</span>
              <div className="stat-icon-wrapper bg-primary-subtle text-primary">
                <Wallet size={22} />
              </div>
            </div>
            <div className="stat-value text-dark mb-1">
              ₹{Number(metrics.currentWalletBalance).toLocaleString()}
            </div>
            <div className="d-flex align-items-center gap-2 small">
              <span className="text-success fw-semibold d-flex align-items-center">
                <ArrowUpRight size={14} /> Reconciled
              </span>
              <span className="text-secondary">Liquid society funds</span>
            </div>
          </div>
        </div>

        {/* Maintenance Collected */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card border-start border-4 border-success">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="stat-title">Total Collected</span>
              <div className="stat-icon-wrapper bg-success-subtle text-success">
                <CreditCard size={22} />
              </div>
            </div>
            <div className="stat-value text-dark mb-1">
              ₹{Number(metrics.totalMaintenanceCollected).toLocaleString()}
            </div>
            <div className="d-flex align-items-center gap-2 small">
              <span className="text-success fw-semibold">
                {metrics.totalMaintenanceCollected > 0 ? "Active Collections" : "0 Payments"}
              </span>
              <span className="text-secondary">cleared</span>
            </div>
          </div>
        </div>

        {/* Pending Maintenance */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card border-start border-4 border-danger">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="stat-title">Pending Maintenance</span>
              <div className="stat-icon-wrapper bg-danger-subtle text-danger">
                <AlertCircle size={22} />
              </div>
            </div>
            <div className="stat-value text-danger mb-1">
              ₹{Number(metrics.totalPendingDues).toLocaleString()}
            </div>
            <div className="d-flex align-items-center gap-2 small">
              <span className="text-danger fw-semibold">Reminders active</span>
              <span className="text-secondary">5-day cycle</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card border-start border-4 border-warning">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="stat-title">Society Expenses</span>
              <div className="stat-icon-wrapper bg-warning-subtle text-warning">
                <Receipt size={22} />
              </div>
            </div>
            <div className="stat-value text-dark mb-1">
              ₹{Number(metrics.totalExpenses).toLocaleString()}
            </div>
            <div className="d-flex align-items-center gap-2 small">
              <span className="text-secondary">Electricity, AMC, Staff</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Masters Count Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="p-3 bg-white rounded-3 border d-flex align-items-center gap-3">
            <div className="p-2 bg-light rounded-2 text-primary">
              <Layers size={24} />
            </div>
            <div>
              <div className="text-secondary small fw-medium">Total Floors</div>
              <div className="fs-5 fw-bold text-dark">{metrics.totalFloors} Floors</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3 bg-white rounded-3 border d-flex align-items-center gap-3">
            <div className="p-2 bg-light rounded-2 text-primary">
              <Building2 size={24} />
            </div>
            <div>
              <div className="text-secondary small fw-medium">Total Flats</div>
              <div className="fs-5 fw-bold text-dark">{metrics.totalFlats} Flats</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3 bg-white rounded-3 border d-flex align-items-center gap-3">
            <div className="p-2 bg-light rounded-2 text-success">
              <Users size={24} />
            </div>
            <div>
              <div className="text-secondary small fw-medium">Owner Occupied</div>
              <div className="fs-5 fw-bold text-dark">{metrics.ownerOccupied} Flats</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3 bg-white rounded-3 border d-flex align-items-center gap-3">
            <div className="p-2 bg-light rounded-2 text-warning">
              <Users size={24} />
            </div>
            <div>
              <div className="text-secondary small fw-medium">Tenant / Rented</div>
              <div className="fs-5 fw-bold text-dark">{metrics.rentedFlats} Flats</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recharts Visualizations */}
      <div className="row g-4 mb-4">
        {/* Income vs Expenses Bar Chart */}
        <div className="col-12 col-lg-8">
          <div className="card-premium h-100 p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h5 className="fw-bold text-dark mb-0">Collections vs. Expenses Trends</h5>
                <span className="small text-secondary">
                  Monthly maintenance received versus operating expenditures (Starting {currentMonthFull})
                </span>
              </div>
              <span className="badge bg-light text-primary border">Starting {currentMonthShort}</span>
            </div>

            <div style={{ height: "300px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, ""]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Legend />
                  <Bar dataKey="collected" name="Maintenance Received" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Society Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Payment Methods & Occupancy Pie */}
        <div className="col-12 col-lg-4">
          <div className="card-premium h-100 p-4">
            <h5 className="fw-bold text-dark mb-1">Occupancy Distribution</h5>
            <span className="small text-secondary">Owner occupied vs. tenants</span>

            <div style={{ height: "220px", width: "100%" }} className="my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {occupancyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} Flats`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="d-flex justify-content-center gap-4 pt-2 border-top small">
              <div className="d-flex align-items-center gap-1.5">
                <span style={{ width: 10, height: 10, backgroundColor: "#2563eb", borderRadius: "50%" }} />
                <span>Owner: <strong>{metrics.ownerOccupied}</strong></span>
              </div>
              <div className="d-flex align-items-center gap-1.5">
                <span style={{ width: 10, height: 10, backgroundColor: "#f59e0b", borderRadius: "50%" }} />
                <span>Tenant: <strong>{metrics.rentedFlats}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Payments Table & Quick Actions */}
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card-premium">
            <div className="card-premium-header">
              <div>
                <h5 className="fw-bold text-dark mb-0">Recent Maintenance Payments</h5>
                <p className="text-secondary small mb-0">Latest receipts recorded in system</p>
              </div>
              <Link href="/maintenance" className="btn btn-sm btn-outline-primary fw-semibold">
                View All Payments
              </Link>
            </div>

            <div className="table-responsive">
              <table className="table table-premium align-middle mb-0">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-secondary">
                        No payments recorded yet. Record maintenance payments under Maintenance.
                      </td>
                    </tr>
                  ) : (
                    recentPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="fw-bold text-primary font-monospace">{p.receipt_number}</td>
                        <td className="text-secondary small">{formatDate(p.payment_date)}</td>
                        <td>
                          <span className="badge bg-light text-dark border">{p.payment_method}</span>
                        </td>
                        <td className="fw-extrabold text-success fs-6">
                          +₹{Number(p.total_amount_received).toLocaleString()}
                        </td>
                        <td>
                          <StatusBadge status="PAID" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Operations Column */}
        <div className="col-12 col-lg-4">
          <div className="card-premium p-4">
            <h6 className="fw-bold text-dark mb-3">Quick Navigation</h6>
            <div className="d-flex flex-column gap-2">
              <Link
                href="/maintenance"
                className="btn btn-light border text-start d-flex align-items-center gap-3 p-3 rounded-3"
              >
                <div className="p-2 bg-primary-subtle text-primary rounded-2">
                  <CreditCard size={18} />
                </div>
                <div>
                  <div className="fw-bold text-dark small">Collect Maintenance</div>
                  <div className="text-secondary small" style={{ fontSize: "0.75rem" }}>
                    Record single or multi-month dues
                  </div>
                </div>
              </Link>

              <Link
                href="/expenses"
                className="btn btn-light border text-start d-flex align-items-center gap-3 p-3 rounded-3"
              >
                <div className="p-2 bg-warning-subtle text-warning rounded-2">
                  <Receipt size={18} />
                </div>
                <div>
                  <div className="fw-bold text-dark small">Add Society Expense</div>
                  <div className="text-secondary small" style={{ fontSize: "0.75rem" }}>
                    Vendor bill, electricity, staff salary
                  </div>
                </div>
              </Link>

              <Link
                href="/wallet"
                className="btn btn-light border text-start d-flex align-items-center gap-3 p-3 rounded-3"
              >
                <div className="p-2 bg-success-subtle text-success rounded-2">
                  <Wallet size={18} />
                </div>
                <div>
                  <div className="fw-bold text-dark small">Society Wallet Ledger</div>
                  <div className="text-secondary small" style={{ fontSize: "0.75rem" }}>
                    Opening balance &amp; transaction log
                  </div>
                </div>
              </Link>

              <Link
                href="/reports"
                className="btn btn-light border text-start d-flex align-items-center gap-3 p-3 rounded-3"
              >
                <div className="p-2 bg-info-subtle text-info rounded-2">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <div className="fw-bold text-dark small">Reports &amp; Excel Import</div>
                  <div className="text-secondary small" style={{ fontSize: "0.75rem" }}>
                    Export PDF / Excel financial statements
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

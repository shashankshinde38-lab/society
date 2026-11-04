"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  Layers,
  PlusCircle,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge/StatusBadge";
import { DataStorage } from "@/services/dataStorage";
import { DashboardMetrics, MaintenancePayment } from "@/types/database.types";
import { formatDate } from "@/utils/dateFormatter";

interface MonthlyTrendPoint {
  month: string;
  collected: number;
  expenses: number;
}

const formatCurrency = (value: number | string | null | undefined) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN")}`;

const getFinancialYearLabel = (date: Date) => {
  // Indian financial year runs from April through March.
  const startYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const endYear = String(startYear + 1).slice(-2);
  return `FY ${startYear}–${endYear}`;
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentPayments, setRecentPayments] = useState<MaintenancePayment[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendPoint[]>([]);
  const [currentMonthFull, setCurrentMonthFull] = useState<string>("");
  const [currentMonthShort, setCurrentMonthShort] = useState<string>("");
  const [financialYear, setFinancialYear] = useState<string>("");

  useEffect(() => {
    // Keep the existing DataStorage integration and data sources unchanged.
    const loadedMetrics = DataStorage.getDashboardMetrics();
    const payments = DataStorage.getPayments();
    const expenses = DataStorage.getExpenses();

    setMetrics(loadedMetrics);
    setRecentPayments(payments.slice(0, 5));

    const now = new Date();
    const shortLabel = now.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
    const fullLabel = now.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    setCurrentMonthShort(shortLabel);
    setCurrentMonthFull(fullLabel);
    setFinancialYear(getFinancialYearLabel(now));

    // Aggregate the existing payment and expense records by calendar month.
    const trendMap = new Map<string, MonthlyTrendPoint>();

    trendMap.set(shortLabel, {
      month: shortLabel,
      collected: 0,
      expenses: 0,
    });

    payments.forEach((payment) => {
      const paymentDate = new Date(payment.payment_date);
      const monthLabel = !Number.isNaN(paymentDate.getTime())
        ? paymentDate.toLocaleString("en-US", { month: "short", year: "numeric" })
        : shortLabel;

      if (!trendMap.has(monthLabel)) {
        trendMap.set(monthLabel, {
          month: monthLabel,
          collected: 0,
          expenses: 0,
        });
      }

      trendMap.get(monthLabel)!.collected += Number(payment.total_amount_received || 0);
    });

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.expense_date);
      const monthLabel = !Number.isNaN(expenseDate.getTime())
        ? expenseDate.toLocaleString("en-US", { month: "short", year: "numeric" })
        : shortLabel;

      if (!trendMap.has(monthLabel)) {
        trendMap.set(monthLabel, {
          month: monthLabel,
          collected: 0,
          expenses: 0,
        });
      }

      trendMap.get(monthLabel)!.expenses += Number(expense.amount || 0);
    });

    // Keep the chart in chronological order, including the current month when it is empty.
    const sortedTrends = Array.from(trendMap.values()).sort((first, second) => {
      return new Date(`${first.month} 1`).getTime() - new Date(`${second.month} 1`).getTime();
    });

    setMonthlyTrends(sortedTrends);
  }, []);

  if (!metrics) {
    return (
      <div className="dashboard-loading" role="status" aria-live="polite">
        <span className="spinner-border spinner-border-sm text-primary" aria-hidden="true" />
        <span>Loading dashboard analytics...</span>
      </div>
    );
  }

  const occupancyPieData =
    metrics.totalFlats > 0 && (metrics.ownerOccupied > 0 || metrics.rentedFlats > 0)
      ? [
        { name: "Owner Occupied", value: metrics.ownerOccupied, color: "#2563eb" },
        { name: "Tenant / Rented", value: metrics.rentedFlats, color: "#f59e0b" },
      ]
      : [{ name: "No Flats Added", value: 1, color: "#e2e8f0" }];

  return (
    <main className="dashboard-page">
      <PageHeader
        title="Society Overview & Financial Dashboard"
        subtitle="Real-time financial status, wallet liquidity, occupancy distribution, and billing analytics"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <div className="dashboard-header-actions">
            <div className="dashboard-period">
              <Calendar size={16} className="text-primary flex-shrink-0" aria-hidden="true" />
              <span>
                {financialYear} <span className="dashboard-period-separator">·</span> {currentMonthShort}
              </span>
            </div>
            <Link href="/maintenance" className="btn btn-primary-custom dashboard-collect-button">
              <PlusCircle size={16} aria-hidden="true" />
              <span>Collect Payment</span>
            </Link>
          </div>
        }
      />

      {/* Primary financial KPIs */}
      <section className="row g-3 mb-4 dashboard-financial-grid" aria-label="Financial overview">
        <div className="col-12 col-sm-6 col-xl-3">
          <article className="stat-card dashboard-stat-card border-start border-4 border-primary h-100">
            <div className="dashboard-stat-heading">
              <span className="stat-title">Current Wallet Balance</span>
              <div className="stat-icon-wrapper bg-primary-subtle text-primary">
                <Wallet size={22} aria-hidden="true" />
              </div>
            </div>
            <div className="stat-value text-dark mb-1">
              {formatCurrency(metrics.currentWalletBalance)}
            </div>
            <div className="dashboard-stat-meta">
              <span className="text-success fw-semibold dashboard-inline-status">
                <ArrowUpRight size={14} aria-hidden="true" /> Reconciled
              </span>
              <span className="text-secondary">Liquid society funds</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="stat-card dashboard-stat-card border-start border-4 border-success h-100">
            <div className="dashboard-stat-heading">
              <span className="stat-title">Total Collected</span>
              <div className="stat-icon-wrapper bg-success-subtle text-success">
                <CreditCard size={22} aria-hidden="true" />
              </div>
            </div>
            <div className="stat-value text-dark mb-1">
              {formatCurrency(metrics.totalMaintenanceCollected)}
            </div>
            <div className="dashboard-stat-meta">
              <span className="text-success fw-semibold">
                {metrics.totalMaintenanceCollected > 0 ? "Active Collections" : "0 Payments"}
              </span>
              <span className="text-secondary">Cleared</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="stat-card dashboard-stat-card border-start border-4 border-danger h-100">
            <div className="dashboard-stat-heading">
              <span className="stat-title">Pending Maintenance</span>
              <div className="stat-icon-wrapper bg-danger-subtle text-danger">
                <AlertCircle size={22} aria-hidden="true" />
              </div>
            </div>
            <div className="stat-value text-danger mb-1">
              {formatCurrency(metrics.totalPendingDues)}
            </div>
            <div className="dashboard-stat-meta">
              <span className="text-danger fw-semibold">Reminders active</span>
              <span className="text-secondary">5-day cycle</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="stat-card dashboard-stat-card border-start border-4 border-warning h-100">
            <div className="dashboard-stat-heading">
              <span className="stat-title">Society Expenses</span>
              <div className="stat-icon-wrapper bg-warning-subtle text-warning">
                <Receipt size={22} aria-hidden="true" />
              </div>
            </div>
            <div className="stat-value text-dark mb-1">
              {formatCurrency(metrics.totalExpenses)}
            </div>
            <div className="dashboard-stat-meta">
              <span className="text-secondary">Electricity, AMC, Staff</span>
            </div>
          </article>
        </div>
      </section>

      {/* Society structure overview */}
      <section className="row g-3 mb-4 dashboard-masters-grid" aria-label="Society occupancy summary">
        <div className="col-6 col-md-3">
          <article className="dashboard-master-card">
            <div className="dashboard-master-icon text-primary bg-primary-subtle">
              <Layers size={22} aria-hidden="true" />
            </div>
            <div className="dashboard-master-copy">
              <span>Total Floors</span>
              <strong>{metrics.totalFloors} Floors</strong>
            </div>
          </article>
        </div>

        <div className="col-6 col-md-3">
          <article className="dashboard-master-card">
            <div className="dashboard-master-icon text-primary bg-primary-subtle">
              <Building2 size={22} aria-hidden="true" />
            </div>
            <div className="dashboard-master-copy">
              <span>Total Flats</span>
              <strong>{metrics.totalFlats} Flats</strong>
            </div>
          </article>
        </div>

        <div className="col-6 col-md-3">
          <article className="dashboard-master-card">
            <div className="dashboard-master-icon text-success bg-success-subtle">
              <Users size={22} aria-hidden="true" />
            </div>
            <div className="dashboard-master-copy">
              <span>Owner Occupied</span>
              <strong>{metrics.ownerOccupied} Flats</strong>
            </div>
          </article>
        </div>

        <div className="col-6 col-md-3">
          <article className="dashboard-master-card">
            <div className="dashboard-master-icon text-warning bg-warning-subtle">
              <Users size={22} aria-hidden="true" />
            </div>
            <div className="dashboard-master-copy">
              <span>Tenant / Rented</span>
              <strong>{metrics.rentedFlats} Flats</strong>
            </div>
          </article>
        </div>
      </section>

      {/* Charts */}
      <section className="row g-3 g-xl-4 mb-4 dashboard-charts-grid" aria-label="Financial and occupancy charts">
        <div className="col-12 col-lg-8">
          <article className="card-premium dashboard-chart-card h-100">
            <div className="dashboard-card-heading">
              <div className="dashboard-card-heading-copy">
                <h2>Collections vs. Expenses Trends</h2>
                <p>Monthly maintenance received versus operating expenditures</p>
              </div>
              <span className="dashboard-chart-period">Current: {currentMonthFull}</span>
            </div>

            <div className="dashboard-bar-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyTrends}
                  margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    minTickGap={12}
                  />
                  <YAxis
                    width={66}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`
                    }
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), ""]}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar
                    dataKey="collected"
                    name="Maintenance Received"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={42}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Society Expenses"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>

        <div className="col-12 col-lg-4">
          <article className="card-premium dashboard-chart-card dashboard-occupancy-card h-100">
            <div className="dashboard-card-heading dashboard-card-heading-stacked">
              <div className="dashboard-card-heading-copy">
                <h2>Occupancy Distribution</h2>
                <p>Owner occupied vs. tenants</p>
              </div>
            </div>

            <div className="dashboard-pie-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="78%"
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {occupancyPieData.map((entry, index) => (
                      <Cell key={`occupancy-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Flats`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="dashboard-occupancy-legend">
              <div>
                <span className="dashboard-legend-dot dashboard-legend-owner" />
                <span>Owner: <strong>{metrics.ownerOccupied}</strong></span>
              </div>
              <div>
                <span className="dashboard-legend-dot dashboard-legend-tenant" />
                <span>Tenant: <strong>{metrics.rentedFlats}</strong></span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Recent payments and quick navigation */}
      <section className="row g-3 g-xl-4 dashboard-bottom-grid">
        <div className="col-12 col-lg-8">
          <article className="card-premium dashboard-payment-card h-100">
            <div className="card-premium-header dashboard-table-header">
              <div className="dashboard-card-heading-copy">
                <h2>Recent Maintenance Payments</h2>
                <p>Latest receipts recorded in system</p>
              </div>
              <Link href="/maintenance" className="btn btn-sm btn-outline-primary fw-semibold">
                View All Payments
              </Link>
            </div>

            <div className="table-responsive dashboard-table-wrap">
              <table className="table table-premium align-middle mb-0 dashboard-payments-table">
                <thead>
                  <tr>
                    <th scope="col">Receipt #</th>
                    <th scope="col">Date</th>
                    <th scope="col">Payment Method</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
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
                    recentPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="fw-bold text-primary font-monospace">
                          {payment.receipt_number}
                        </td>
                        <td className="text-secondary small">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {payment.payment_method}
                          </span>
                        </td>
                        <td className="fw-bold text-success">
                          +{formatCurrency(payment.total_amount_received)}
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
          </article>
        </div>

        <div className="col-12 col-lg-4">
          <article className="card-premium dashboard-quick-card h-100">
            <div className="dashboard-quick-card-heading">
              <h2>Quick Navigation</h2>
              <p>Common society operations</p>
            </div>

            <nav className="dashboard-quick-links" aria-label="Quick navigation">
              <Link href="/maintenance" className="dashboard-quick-link">
                <span className="dashboard-quick-icon text-primary bg-primary-subtle">
                  <CreditCard size={18} aria-hidden="true" />
                </span>
                <span className="dashboard-quick-copy">
                  <strong>Collect Maintenance</strong>
                  <small>Record single or multi-month dues</small>
                </span>
              </Link>

              <Link href="/expenses" className="dashboard-quick-link">
                <span className="dashboard-quick-icon text-warning bg-warning-subtle">
                  <Receipt size={18} aria-hidden="true" />
                </span>
                <span className="dashboard-quick-copy">
                  <strong>Add Society Expense</strong>
                  <small>Vendor bill, electricity, staff salary</small>
                </span>
              </Link>

              <Link href="/wallet" className="dashboard-quick-link">
                <span className="dashboard-quick-icon text-success bg-success-subtle">
                  <Wallet size={18} aria-hidden="true" />
                </span>
                <span className="dashboard-quick-copy">
                  <strong>Society Wallet Ledger</strong>
                  <small>Opening balance and transaction log</small>
                </span>
              </Link>

              <Link href="/reports" className="dashboard-quick-link">
                <span className="dashboard-quick-icon text-info bg-info-subtle">
                  <FileSpreadsheet size={18} aria-hidden="true" />
                </span>
                <span className="dashboard-quick-copy">
                  <strong>Reports &amp; Excel Import</strong>
                  <small>Export PDF / Excel financial statements</small>
                </span>
              </Link>
            </nav>
          </article>
        </div>
      </section>
    </main>
  );
}

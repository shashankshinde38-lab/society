"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge/StatusBadge";
import { DataStorage } from "@/services/dataStorage";
import { Flat, Floor, MaintenanceInvoice, MaintenancePayment } from "@/types/database.types";
import { AmountInput } from "@/components/common/AmountInput/AmountInput";
import { formatDate, isLeapYear, validateDateInput } from "@/utils/dateFormatter";
import {
  CreditCard,
  Search,
  PlusCircle,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  Download,
  Building,
  Printer,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  Eye,
  X,
  CheckSquare,
  Square,
  Check,
  Mail,
  Edit2,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { openOrDownloadPDF, viewPDFInNewTab } from "@/utils/pdfHelper";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MaintenancePage() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [invoices, setInvoices] = useState<MaintenanceInvoice[]>([]);
  const [payments, setPayments] = useState<MaintenancePayment[]>([]);

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"FLATS" | "PAYMENTS">("FLATS");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [floorFilter, setFloorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const AVAILABLE_YEARS = [2025, 2026, 2027];
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [paymentYearFilter, setPaymentYearFilter] = useState<string>("ALL");

  // Collect Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFlatForPayment, setSelectedFlatForPayment] = useState<Flat | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<MaintenancePayment["payment_method"]>("ONLINE_UPI");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentAttachment, setPaymentAttachment] = useState<string | null>(null);

  // Year Matrix View Modal & Multi-Month Selection
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [selectedFlatForMatrix, setSelectedFlatForMatrix] = useState<Flat | null>(null);
  const [flatYearInvoices, setFlatYearInvoices] = useState<MaintenanceInvoice[]>([]);
  const [selectedMonthIds, setSelectedMonthIds] = useState<string[]>([]);

  // Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<MaintenancePayment | null>(null);
  const [receiptFlat, setReceiptFlat] = useState<Flat | null>(null);
  const [receiptAllocatedMonths, setReceiptAllocatedMonths] = useState<string[]>([]);
  const [sendingReceiptEmail, setSendingReceiptEmail] = useState(false);

  // Full-size Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Set Flat Maintenance Rate Modal
  const [showSetRateModal, setShowSetRateModal] = useState(false);
  const [targetFlatForRate, setTargetFlatForRate] = useState<Flat | null>(null);
  const [rateInputValue, setRateInputValue] = useState<number | "">(1500);

  const loadData = () => {
    setFlats(DataStorage.getFlats());
    setFloors(DataStorage.getFloors());
    setInvoices(DataStorage.getInvoices());
    setPayments(DataStorage.getPayments());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenSetRateModal = (flat: Flat) => {
    const currentRate = DataStorage.getFlatMaintenanceRate(flat);
    setTargetFlatForRate(flat);
    setRateInputValue(currentRate);
    setShowSetRateModal(true);
  };

  const handleSaveFlatRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFlatForRate || !rateInputValue || Number(rateInputValue) <= 0) {
      toast.error("Please enter a valid monthly maintenance rate");
      return;
    }

    try {
      DataStorage.setFlatMaintenanceRate(targetFlatForRate.id, Number(rateInputValue));
      toast.success(
        `Flat ${targetFlatForRate.flat_number} maintenance rate updated to ₹${Number(rateInputValue).toLocaleString()}/month and all invoices synchronized!`
      );
      setShowSetRateModal(false);
      loadData();

      // If matrix modal is open for this flat, reload its 12-month records
      if (selectedFlatForMatrix && selectedFlatForMatrix.id === targetFlatForRate.id) {
        const updatedFlats = DataStorage.getFlats();
        const updatedFlat = updatedFlats.find((f) => f.id === targetFlatForRate.id) || targetFlatForRate;
        setSelectedFlatForMatrix(updatedFlat);
        const invs = DataStorage.getInvoices(updatedFlat.id, selectedYear);
        const unique12 = Array.from(new Map(invs.map((i) => [i.month, i])).values())
          .sort((a, b) => a.month - b.month)
          .slice(0, 12);
        setFlatYearInvoices(unique12);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update maintenance rate");
    }
  };

  // Open Payment Form (Supports single flat or pre-selected multi-month collection)
  const handleOpenCollectPayment = (
    flat: Flat,
    preselectedMonthIds?: string[],
    initialAmount?: number
  ) => {
    setSelectedFlatForPayment(flat);
    setPaymentAmount(initialAmount !== undefined && initialAmount > 0 ? initialAmount : "");
    setSelectedMonthIds(preselectedMonthIds || []);
    setPaymentAttachment(null);
    setPaymentMethod("ONLINE_UPI");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setTransactionRef("");

    if (preselectedMonthIds && preselectedMonthIds.length > 0) {
      const invs = DataStorage.getInvoices(flat.id, selectedYear).filter((i) =>
        preselectedMonthIds.includes(i.id)
      );
      const mNames = invs.map((i) => MONTH_NAMES[i.month - 1]).join(", ");
      setPaymentDescription(`Maintenance payment for Flat ${flat.flat_number} (${mNames})`);
    } else {
      setPaymentDescription(`Maintenance payment for Flat ${flat.flat_number}`);
    }

    setShowPaymentModal(true);
  };

  // Submit Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlatForPayment || paymentAmount === "" || Number(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount (e.g. 1100)");
      return;
    }

    // Strict leap year & date validation
    const dateCheck = validateDateInput(paymentDate);
    if (!dateCheck.isValid) {
      toast.error(dateCheck.message || "Invalid payment date entered");
      return;
    }

    try {
      const result = DataStorage.recordPayment({
        flatId: selectedFlatForPayment.id,
        amountReceived: Number(paymentAmount),
        paymentMethod,
        paymentDate,
        transactionRef,
        description: paymentDescription,
        attachmentUrl: paymentAttachment,
        selectedInvoiceIds: selectedMonthIds.length > 0 ? selectedMonthIds : undefined,
      });

      const allocDesc =
        result.allocatedMonths.length > 0 ? ` Allocated: ${result.allocatedMonths.join(", ")}` : "";
      toast.success(`Payment recorded! Receipt: ${result.receiptNo}.${allocDesc}`);

      if (result.advanceAllocated > 0) {
        toast.info(`₹${result.advanceAllocated.toLocaleString()} added to Advance Maintenance Pool`);
      }

      setShowPaymentModal(false);
      setSelectedMonthIds([]);
      loadData();

      if (selectedFlatForMatrix) {
        // Automatically advance to next year if December was completed
        const nextActiveYear = DataStorage.getFlatActiveMaintenanceYear(selectedFlatForMatrix.id);
        if (nextActiveYear !== selectedYear) {
          setSelectedYear(nextActiveYear);
          toast.success(`December ${selectedYear} completed! Automatically advanced to ${nextActiveYear} calendar cycle.`);
        }
        const invs = DataStorage.getInvoices(selectedFlatForMatrix.id, nextActiveYear);
        const unique12 = Array.from(new Map(invs.map((i) => [i.month, i])).values())
          .sort((a, b) => a.month - b.month)
          .slice(0, 12);
        setFlatYearInvoices(unique12);
      }

      // Open Receipt for immediate preview & print
      setActiveReceipt(result.payment);
      setReceiptFlat(selectedFlatForPayment);
      setReceiptAllocatedMonths(result.allocatedMonths);
      setShowReceiptModal(true);

      // Automatically email invoice receipt to resident if email is registered
      if (selectedFlatForPayment.current_resident?.email) {
        handleSendReceiptEmail(result.payment, selectedFlatForPayment, result.allocatedMonths);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment recording failed");
    }
  };

  // Open Annual Maintenance Collection Matrix (opens requested or selected year)
  const handleOpenMatrix = (flat: Flat, yearToOpen: number = selectedYear) => {
    setSelectedFlatForMatrix(flat);
    setSelectedYear(yearToOpen);
    const flatInvs = DataStorage.getInvoices(flat.id, yearToOpen);
    const unique12 = Array.from(new Map(flatInvs.map((i) => [i.month, i])).values())
      .sort((a, b) => a.month - b.month)
      .slice(0, 12);
    setFlatYearInvoices(unique12);
    setSelectedMonthIds([]);
    setShowMatrixModal(true);
  };

  // Toggle Single Month Selection in 12-Month Calendar
  const handleToggleMonthSelection = (invId: string) => {
    const inv = flatYearInvoices.find((i) => i.id === invId);
    if (inv && (inv.status === "PAID" || inv.status === "ADVANCE_COVERED")) {
      toast.info("This month is already paid and cannot be selected again.");
      return;
    }
    setSelectedMonthIds((prev) =>
      prev.includes(invId) ? prev.filter((id) => id !== invId) : [...prev, invId]
    );
  };

  // Select all unpaid / pending months
  const handleSelectAllUnpaidMonths = () => {
    const unpaidIds = flatYearInvoices
      .slice(0, 12)
      .filter((i) => i.status !== "PAID" && i.status !== "ADVANCE_COVERED")
      .map((i) => i.id);
    if (unpaidIds.length === 0) {
      toast.info("No unpaid months found for this year. All months are settled!");
      return;
    }
    setSelectedMonthIds(unpaidIds);
  };

  // Select all payable months (excludes already-paid months)
  const handleSelectAllPayableMonths = () => {
    const payableIds = flatYearInvoices
      .slice(0, 12)
      .filter((i) => i.status !== "PAID" && i.status !== "ADVANCE_COVERED")
      .map((i) => i.id);
    if (payableIds.length === 0) {
      toast.info("All months are already paid for this flat.");
      return;
    }
    setSelectedMonthIds(payableIds);
  };

  // Deselect all
  const handleDeselectAllMonths = () => {
    setSelectedMonthIds([]);
  };

  // Generate Dues for selected months if in NO_DUES status
  const handleGenerateDuesForSelected = () => {
    if (!selectedFlatForMatrix || selectedMonthIds.length === 0) {
      toast.error("Please select at least one month");
      return;
    }
    const selectedInvs = flatYearInvoices.filter((i) => selectedMonthIds.includes(i.id));
    const monthNums = selectedInvs.map((i) => i.month);
    DataStorage.generateMonthlyDues(selectedFlatForMatrix.id, selectedYear, monthNums);
    toast.success(`Maintenance dues generated for ${monthNums.length} month(s)`);
    loadData();
    const updated = DataStorage.getInvoices(selectedFlatForMatrix.id, selectedYear);
    const unique12 = Array.from(new Map(updated.map((i) => [i.month, i])).values())
      .sort((a, b) => a.month - b.month)
      .slice(0, 12);
    setFlatYearInvoices(unique12);
  };

  // Proceed to Multi-Month Payment Collection
  const handleProceedToCollectSelected = () => {
    if (!selectedFlatForMatrix || selectedMonthIds.length === 0) {
      toast.error("Please select at least one month to collect payment");
      return;
    }
    const flatRate = DataStorage.getFlatMaintenanceRate(selectedFlatForMatrix);
    const selectedInvs = flatYearInvoices.filter((i) => selectedMonthIds.includes(i.id));
    const totalSelectedAmt = selectedInvs.reduce(
      (sum, i) => sum + (i.due_amount > 0 ? i.due_amount : (i.invoice_amount || flatRate)),
      0
    );
    setShowMatrixModal(false);
    handleOpenCollectPayment(selectedFlatForMatrix, selectedMonthIds, totalSelectedAmt);
  };

  // Helper to create official PDF Invoice Receipt Document
  const createReceiptPDFDocument = (receipt: MaintenancePayment, flat: Flat, allocatedMonths?: string[]) => {
    const doc = new jsPDF();

    // Society Header Banner
    doc.setFillColor(15, 23, 42); // Navy
    doc.rect(0, 0, 210, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PARIJAT COOPERATIVE HOUSING SOCIETY - A WING", 14, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Survey No. 42/1, Parijat Enclave, Kothrud, Pune - 411038 | Reg. No: PNE/HSG/2018/8910", 14, 24);
    doc.text("Email: parijatsociety@gmail.com | Official Maintenance Invoice Receipt", 14, 30);

    // Receipt Meta
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`RECEIPT #: ${receipt.receipt_number}`, 14, 48);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Payment Date: ${receipt.payment_date}`, 145, 48);

    const paidPeriods = allocatedMonths && allocatedMonths.length > 0 ? allocatedMonths.join(", ") : "Maintenance Cleared";

    // Bill Details Table
    autoTable(doc, {
      startY: 55,
      head: [["Description", "Details"]],
      body: [
        ["Flat Number", `${flat.flat_number} (${flat.floor?.floor_name || "Floor"})`],
        ["Resident Name", flat.current_resident?.full_name || "Owner/Occupant"],
        ["Occupancy Type", flat.current_resident?.resident_type || "OWNER"],
        ["Maintenance Cleared For", paidPeriods],
        ["Payment Method", receipt.payment_method],
        ["Transaction / Cheque Ref", receipt.transaction_ref || "N/A (Direct Clearance)"],
        ["Narration / Remarks", receipt.description || "Regular Maintenance Dues Cleared"],
        ["Total Amount Received", `INR ${Number(receipt.total_amount_received).toLocaleString("en-IN")}.00`],
      ],
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 4 },
    });

    // Footer Signatures
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30;
    doc.setFontSize(9);
    doc.text("Authorised Signature / Treasurer", 14, finalY);
    doc.text("Society Stamp (Verified)", 150, finalY);

    return doc;
  };

  // Generate & Download / Open PDF Receipt
  const handleDownloadPDFReceipt = () => {
    if (!activeReceipt || !receiptFlat) return;
    const doc = createReceiptPDFDocument(activeReceipt, receiptFlat, receiptAllocatedMonths);
    openOrDownloadPDF(doc, `${activeReceipt.receipt_number}_${receiptFlat.flat_number}.pdf`);
    toast.success("Receipt PDF downloaded / opened successfully!");
  };

  // Directly view PDF in new tab (or auto-download on mobile for native viewer)
  const handleViewPDFReceipt = () => {
    if (!activeReceipt || !receiptFlat) return;
    const doc = createReceiptPDFDocument(activeReceipt, receiptFlat, receiptAllocatedMonths);
    viewPDFInNewTab(doc, `${activeReceipt.receipt_number}_${receiptFlat.flat_number}.pdf`);
    toast.info("Opening PDF receipt...");
  };

  // Dispatch Email with attached PDF Invoice Receipt to Resident
  const handleSendReceiptEmail = async (receipt: MaintenancePayment, flat: Flat, allocatedMonths?: string[]) => {
    if (!flat.current_resident?.email) {
      toast.error(`Flat ${flat.flat_number} has no email address. Please update resident contact in Masters.`);
      return;
    }

    setSendingReceiptEmail(true);
    try {
      const doc = createReceiptPDFDocument(receipt, flat, allocatedMonths);
      const pdfBase64 = doc.output("datauristring");
      const currentSoc = DataStorage.getSociety();

      const res = await fetch("/api/mailer/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PAYMENT_RECEIPT",
          society: currentSoc,
          recipients: [
            {
              name: flat.current_resident.full_name,
              email: flat.current_resident.email,
              flatNumber: flat.flat_number,
              receiptNumber: receipt.receipt_number,
              paymentDate: receipt.payment_date,
              amountPaid: Number(receipt.total_amount_received),
              paymentMethod: receipt.payment_method,
              transactionRef: receipt.transaction_ref,
              paidMonths: allocatedMonths && allocatedMonths.length > 0 ? allocatedMonths : ["Current Month (Cleared)"],
              description: receipt.description,
              invoicePdfBase64: pdfBase64,
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success && data.results && data.results.length > 0) {
        const item = data.results[0];
        const isSent = item.status === "SENT";

        DataStorage.addEmailLog({
          recipient_email: flat.current_resident.email,
          recipient_name: flat.current_resident.full_name,
          flat_number: flat.flat_number,
          subject: item.subject || `Maintenance Payment Receipt – ${receipt.receipt_number} – Flat ${flat.flat_number}`,
          email_type: "PAYMENT_RECEIPT",
          amount_due: Number(receipt.total_amount_received),
          status: isSent ? "SENT" : "FAILED",
          error_message: item.error_message || null,
        });

        if (isSent) {
          toast.success(`Maintenance payment receipt & PDF invoice emailed to ${flat.current_resident.email}!`);
        } else {
          toast.error(`Receipt email delivery failed: ${item.error_message}`);
        }
      } else {
        toast.error(`Failed to send receipt email: ${data.message || "Unknown error"}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error dispatching receipt email");
    } finally {
      setSendingReceiptEmail(false);
    }
  };

  // Filtered flats for selectedYear
  const filteredFlats = flats.filter((flat) => {
    const matchesSearch =
      flat.flat_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flat.current_resident && flat.current_resident.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFloor = floorFilter === "ALL" || flat.floor_id === floorFilter;
    const matchesType =
      typeFilter === "ALL" || (flat.current_resident && flat.current_resident.resident_type === typeFilter);

    const flatYearInvs = invoices.filter((i) => i.flat_id === flat.id && i.year === selectedYear);
    const flatYearDue = flatYearInvs.reduce((sum, i) => sum + Number(i.due_amount || 0), 0);
    const flatYearPaid = flatYearInvs.reduce((sum, i) => sum + Number(i.paid_amount || 0), 0);

    let matchesStatus = true;
    if (statusFilter === "PAID") {
      if (selectedYear === 2026) {
        const curM = new Date().getMonth() + 1;
        const curInv = flatYearInvs.find((i) => i.month === curM);
        matchesStatus = curInv ? (curInv.status === "PAID" || curInv.status === "ADVANCE_COVERED") : flatYearDue === 0 && flatYearPaid > 0;
      } else {
        matchesStatus = flatYearPaid > 0 && flatYearDue === 0;
      }
    }
    if (statusFilter === "UNPAID") {
      if (selectedYear === 2026) {
        const curM = new Date().getMonth() + 1;
        const curInv = flatYearInvs.find((i) => i.month === curM);
        matchesStatus = curInv ? (curInv.status === "UNPAID" || curInv.status === "PARTIAL") : flatYearDue > 0;
      } else {
        matchesStatus = flatYearDue > 0;
      }
    }

    return matchesSearch && matchesFloor && matchesType && matchesStatus;
  });

  // Calculate Overview Stats for selectedYear
  const yearInvoices = invoices.filter((i) => i.year === selectedYear);
  const yearPayments = payments.filter((p) => {
    const pYear = p.payment_date ? new Date(p.payment_date).getFullYear() : 2026;
    return pYear === selectedYear;
  });

  const totalFlatsCount = flats.length;
  const paidFlatsCount = flats.filter((f) => {
    const fInvs = yearInvoices.filter((i) => i.flat_id === f.id);
    const dues = fInvs.reduce((sum, i) => sum + Number(i.due_amount || 0), 0);
    const paid = fInvs.reduce((sum, i) => sum + Number(i.paid_amount || 0), 0);
    return paid > 0 && dues === 0;
  }).length;
  const unpaidFlatsCount = flats.filter((f) => {
    const dues = yearInvoices
      .filter((i) => i.flat_id === f.id)
      .reduce((sum, i) => sum + Number(i.due_amount || 0), 0);
    return dues > 0;
  }).length;
  const totalPendingSum = yearInvoices.reduce((sum, i) => sum + Number(i.due_amount || 0), 0);
  const totalCollectedSum = yearPayments.reduce((sum, p) => sum + Number(p.total_amount_received || 0), 0);
  const advancePoolSum = flats.reduce((sum, f) => sum + Number(f.advance_balance || 0), 0);

  return (
    <div className="maintenance-page">
      <PageHeader
        title="Maintenance Management & Invoicing"
        subtitle="Manage flat-wise maintenance collections, 12-month calendar tracking, multiple-month payments, and receipts"
        breadcrumbs={[{ label: "Maintenance" }]}
        actions={
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="bg-white border rounded-3 p-1 d-inline-flex align-items-center shadow-sm">
              <span className="small text-secondary px-2 fw-semibold d-inline-flex align-items-center gap-1">
                <Calendar size={14} className="text-primary" />
                Cycle:
              </span>
              <div className="btn-group btn-group-sm" role="group">
                {AVAILABLE_YEARS.map((yr) => {
                  const tag = yr < 2026 ? "History" : yr === 2026 ? "Active" : "Upcoming";
                  return (
                    <button
                      key={yr}
                      type="button"
                      className={`btn btn-sm ${
                        selectedYear === yr
                          ? "btn-primary-custom fw-bold shadow-sm"
                          : "btn-light text-secondary"
                      } px-3 py-1`}
                      onClick={() => setSelectedYear(yr)}
                    >
                      {yr} <span className="small opacity-75 fw-normal">({tag})</span>
                    </button>
                  );
                })}
              </div>
              {isLeapYear(selectedYear) && (
                <span className="badge bg-primary-subtle text-primary border ms-2 me-1 py-1 px-2 small">
                  Leap Year (29 Feb)
                </span>
              )}
            </div>
          </div>
        }
      />

      {/* Top Financial KPI Metric Row */}
      <div className="row g-3 mb-4 maintenance-kpi-grid">
        <div className="col-6 col-lg-3">
          <div className="stat-card border-start border-4 border-success">
            <div className="stat-title">Total Collected ({selectedYear})</div>
            <div className="stat-value text-success">₹{totalCollectedSum.toLocaleString()}</div>
            <div className="small text-secondary mt-1">
              {selectedYear > 2026 && totalCollectedSum === 0 ? (
                <span className="text-muted">Upcoming Cycle &bull; ₹0 Collected</span>
              ) : (
                <>
                  <span className="fw-bold text-dark">{paidFlatsCount}</span> of {totalFlatsCount} Flats Paid
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="stat-card border-start border-4 border-danger">
            <div className="stat-title">Total Pending Dues ({selectedYear})</div>
            <div className="stat-value text-danger">₹{totalPendingSum.toLocaleString()}</div>
            <div className="small text-secondary mt-1">
              {selectedYear > 2026 && totalPendingSum === 0 ? (
                <span className="text-muted">Billing not started yet</span>
              ) : (
                <>
                  <span className="fw-bold text-danger">{unpaidFlatsCount}</span> Flats with Dues
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="stat-card border-start border-4 border-primary">
            <div className="stat-title">Advance Maintenance Pool</div>
            <div className="stat-value text-primary">₹{advancePoolSum.toLocaleString()}</div>
            <div className="small text-secondary mt-1">Auto-allocates month by month</div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="stat-card border-start border-4 border-info">
            <div className="stat-title">Monthly Rate Base</div>
            <div className="stat-value text-dark">₹1,100</div>
            <div className="small text-secondary mt-1">Due on 10th of each month</div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="d-flex align-items-center gap-2 mb-3 maintenance-tabs">
        <button
          className={`btn btn-sm btn-tab ${activeTab === "FLATS" ? "active btn-primary-custom" : ""
            } px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5`}
          onClick={() => setActiveTab("FLATS")}
        >
          <Building size={15} />
          <span>Flats &amp; Invoices Calendar</span>
        </button>
        <button
          className={`btn btn-sm btn-tab ${activeTab === "PAYMENTS" ? "active btn-primary-custom" : ""
            } px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5`}
          onClick={() => setActiveTab("PAYMENTS")}
        >
          <CreditCard size={15} />
          <span>Payment Records ({payments.length})</span>
        </button>
      </div>

      {activeTab === "FLATS" ? (
        <>
          {/* Filter and Search Bar */}
          <div className="card-premium mb-4 maintenance-filter-card">
            <div className="p-3 maintenance-filter-layout d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div className="maintenance-filter-controls d-flex flex-column flex-sm-row gap-2 flex-grow-1">
                <div className="position-relative flex-grow-1">
                  <Search size={16} className="position-absolute text-secondary" style={{ top: "10px", left: "12px" }} />
                  <input
                    type="text"
                    className="form-control form-control-sm ps-5 bg-light"
                    placeholder="Search by flat, resident, or owner name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select
                  className="form-select form-select-sm maintenance-filter-select"
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                >
                  <option value="ALL">All Floors</option>
                  {floors.map((fl) => (
                    <option key={fl.id} value={fl.id}>
                      {fl.floor_name}
                    </option>
                  ))}
                </select>

                <select
                  className="form-select form-select-sm maintenance-filter-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="OWNER">Owner</option>
                  <option value="TENANT">Tenant</option>
                </select>

                <select
                  className="form-select form-select-sm maintenance-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Dues Status</option>
                  <option value="PAID">All Clear (Paid)</option>
                  <option value="UNPAID">Pending Dues</option>
                </select>

                <select
                  className="form-select form-select-sm maintenance-filter-select fw-semibold border-primary text-primary bg-primary-subtle"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  title="Filter by Year Cycle"
                >
                  {AVAILABLE_YEARS.map((yr) => {
                    const tag = yr < 2026 ? "Historical" : yr === 2026 ? "Active" : "Upcoming";
                    return (
                      <option key={yr} value={yr}>
                        Year {yr} ({tag}) {yr === 2026 && isLeapYear(yr) ? "• Leap Year" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="small text-secondary">
                Showing <strong className="text-dark">{filteredFlats.length}</strong> Flats
              </div>
            </div>
          </div>

          {/* Flat-wise Maintenance Master Table */}
          <div className="card-premium maintenance-table-card">
            <div className="table-responsive maintenance-table-scroll">
              <table className="table table-premium align-middle mb-0 maintenance-data-table">
                <thead>
                  <tr>
                    <th>Flat #</th>
                    <th>Floor</th>
                    <th>Current Resident</th>
                    <th>Type</th>
                    <th>Monthly Rate</th>
                    <th>Outstanding Dues</th>
                    <th>{selectedYear === 2026 ? "Current Month" : `${selectedYear} Status`}</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFlats.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-secondary">
                        {searchTerm ? `No flats matching "${searchTerm}"` : "No flats added yet. Add flats in Masters > Flats."}
                      </td>
                    </tr>
                  ) : (
                    filteredFlats.map((flat) => {
                      const flatYearInvs = invoices.filter(
                        (i) => i.flat_id === flat.id && i.year === selectedYear
                      );
                      const flatYearDue = flatYearInvs.reduce(
                        (sum, i) => sum + Number(i.due_amount || 0),
                        0
                      );
                      const flatYearPaid = flatYearInvs.reduce(
                        (sum, i) => sum + Number(i.paid_amount || 0),
                        0
                      );

                      const currentMonthNum = new Date().getMonth() + 1;
                      const currentMonthInv = invoices.find(
                        (i) => i.flat_id === flat.id && i.month === currentMonthNum && i.year === selectedYear
                      );

                      return (
                        <tr key={flat.id}>
                          <td className="fw-bold text-dark fs-6">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <Building size={16} className="text-primary" />
                              <span>{flat.flat_number}</span>
                            </div>
                          </td>
                          <td className="text-secondary small">{flat.floor?.floor_name || "—"}</td>
                          <td>
                            {flat.current_resident ? (
                              <div className="fw-semibold text-dark">{flat.current_resident.full_name}</div>
                            ) : (
                              <span className="text-muted small">Vacant</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${flat.current_resident?.resident_type === "OWNER"
                                ? "bg-primary-subtle text-primary border"
                                : "bg-warning-subtle text-warning border"
                                }`}
                            >
                              {flat.current_resident?.resident_type || "N/A"}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1.5">
                              <span className="fw-semibold text-dark">
                                ₹{DataStorage.getFlatMaintenanceRate(flat).toLocaleString()}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0 px-1.5 rounded-pill"
                                style={{ fontSize: "0.72rem" }}
                                onClick={() => handleOpenSetRateModal(flat)}
                                title="Set / Override Monthly Maintenance Rate for this flat"
                              >
                                <Edit2 size={11} className="me-0.5" />
                                Set Rate
                              </button>
                            </div>
                          </td>
                          <td>
                            {flatYearDue > 0 ? (
                              <span className="fw-bold text-danger">₹{flatYearDue.toLocaleString()}</span>
                            ) : selectedYear > 2026 && flatYearPaid === 0 ? (
                              <span className="text-muted small">₹0 <span className="opacity-75">(Upcoming)</span></span>
                            ) : (
                              <span className="text-success small fw-semibold">₹0</span>
                            )}
                          </td>
                          <td>
                            {selectedYear === 2026 ? (
                              <StatusBadge
                                status={currentMonthInv ? currentMonthInv.status : "NO_DUES"}
                                label={
                                  !currentMonthInv || currentMonthInv.status === "NO_DUES"
                                    ? "NO DUES"
                                    : currentMonthInv.status === "ADVANCE_COVERED"
                                      ? "ADVANCE"
                                      : currentMonthInv.status === "UNPAID"
                                        ? "UNPAID"
                                        : currentMonthInv.status === "PARTIAL"
                                          ? "PARTIAL"
                                          : "PAID"
                                }
                              />
                            ) : selectedYear > 2026 ? (
                              flatYearPaid > 0 && flatYearDue === 0 ? (
                                <StatusBadge
                                  status="PAID"
                                  label={`${selectedYear} ADVANCE PAID`}
                                />
                              ) : flatYearPaid > 0 && flatYearDue > 0 ? (
                                <StatusBadge
                                  status="PARTIAL"
                                  label={`${selectedYear} PARTIAL (₹${flatYearPaid.toLocaleString()})`}
                                />
                              ) : flatYearDue > 0 ? (
                                <StatusBadge
                                  status="UNPAID"
                                  label={`${selectedYear} PENDING (₹${flatYearDue.toLocaleString()})`}
                                />
                              ) : (
                                <span className="badge bg-secondary-subtle text-secondary border fw-normal py-1 px-2">
                                  UPCOMING &bull; NOT BILLED
                                </span>
                              )
                            ) : (
                              /* Historical year e.g. 2025 */
                              <StatusBadge
                                status={flatYearDue > 0 ? "UNPAID" : flatYearPaid > 0 ? "PAID" : "NO_DUES"}
                                label={
                                  flatYearDue > 0
                                    ? `${selectedYear} PENDING (₹${flatYearDue.toLocaleString()})`
                                    : flatYearPaid > 0
                                      ? `${selectedYear} ALL PAID`
                                      : "NO RECORDS"
                                }
                              />
                            )}
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-primary-custom py-1.5 px-3 d-inline-flex align-items-center gap-1.5 fw-semibold"
                              onClick={() => handleOpenMatrix(flat, selectedYear)}
                              title={`Annual Maintenance Collection & 12-Month Ledger for ${selectedYear}`}
                            >
                              <Calendar size={14} />
                              <span>
                                {selectedYear > 2026
                                  ? `Matrix (${selectedYear})`
                                  : `Annual Collection (${selectedYear})`}
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (() => {
        const filteredPayments = payments.filter((p) => {
          if (paymentYearFilter === "ALL") return true;
          const pYear = p.payment_date ? new Date(p.payment_date).getFullYear().toString() : "2026";
          return pYear === paymentYearFilter;
        });

        return (
          <>
            {/* Payment Filter Bar */}
            <div className="card-premium mb-4 maintenance-filter-card">
              <div className="p-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="small text-secondary fw-bold">Filter By Year:</span>
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        paymentYearFilter === "ALL"
                          ? "btn-primary-custom fw-bold shadow-sm"
                          : "btn-light text-secondary border"
                      } px-3 py-1`}
                      onClick={() => setPaymentYearFilter("ALL")}
                    >
                      All Years ({payments.length})
                    </button>
                    {AVAILABLE_YEARS.map((yr) => {
                      const count = payments.filter(
                        (p) => p.payment_date && new Date(p.payment_date).getFullYear() === yr
                      ).length;
                      return (
                        <button
                          key={yr}
                          type="button"
                          className={`btn btn-sm ${
                            paymentYearFilter === String(yr)
                              ? "btn-primary-custom fw-bold shadow-sm"
                              : "btn-light text-secondary border"
                          } px-3 py-1`}
                          onClick={() => setPaymentYearFilter(String(yr))}
                        >
                          {yr} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="small text-secondary">
                  Showing <strong className="text-dark">{filteredPayments.length}</strong> Receipts
                </div>
              </div>
            </div>

            <div className="card-premium maintenance-table-card">
              <div className="table-responsive maintenance-table-scroll">
                <table className="table table-premium align-middle mb-0 maintenance-data-table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Flat #</th>
                      <th>Date</th>
                      <th>Payment Mode &amp; Ref</th>
                      <th>Amount Received</th>
                      <th>Photo Attachment</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5 text-secondary">
                          No maintenance payments recorded for the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p) => {
                        const flat = flats.find((f) => f.id === p.flat_id);
                        return (
                          <tr key={p.id}>
                            <td>
                              <span className="font-monospace fw-bold text-primary">{p.receipt_number}</span>
                            </td>
                            <td>
                              <span className="fw-semibold text-dark">Flat {flat?.flat_number || "—"}</span>
                              <div className="small text-muted">{flat?.current_resident?.full_name || "Owner"}</div>
                            </td>
                            <td className="small text-secondary">{formatDate(p.payment_date)}</td>
                            <td>
                              <span className="badge bg-light text-dark border me-1">{p.payment_method}</span>
                              {p.transaction_ref && (
                                <span className="small text-muted font-monospace d-block">{p.transaction_ref}</span>
                              )}
                            </td>
                            <td>
                              <span className="fw-bold text-success fs-6">
                                ₹{Number(p.total_amount_received).toLocaleString()}
                              </span>
                            </td>
                            <td>
                              {p.attachment_url ? (
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <img
                                    src={p.attachment_url}
                                    alt="Proof"
                                    className="rounded border cursor-pointer"
                                    style={{ width: "36px", height: "36px", objectFit: "cover" }}
                                    onClick={() =>
                                      setPreviewImage({
                                        url: p.attachment_url!,
                                        title: `Receipt ${p.receipt_number} — Flat ${flat?.flat_number}`,
                                      })
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary p-1 small"
                                    onClick={() =>
                                      setPreviewImage({
                                        url: p.attachment_url!,
                                        title: `Receipt ${p.receipt_number} — Flat ${flat?.flat_number}`,
                                      })
                                    }
                                    title="View Photo Attachment"
                                  >
                                    <Eye size={14} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted small">No attachment</span>
                              )}
                            </td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1"
                                onClick={() => {
                                  setActiveReceipt(p);
                                  setReceiptFlat(flat || null);
                                  setShowReceiptModal(true);
                                }}
                              >
                                <FileText size={14} />
                                <span>Receipt</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      })()}

      {/* Collect Payment Professional Modal */}
      {showPaymentModal && selectedFlatForPayment && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060, overflowY: "auto" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg maintenance-modal-dialog">
            <div className="modal-content border-0 shadow-lg rounded-4 maintenance-modal-content">
              <div className="modal-header border-bottom px-4 pt-4 pb-3 flex-shrink-0">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    Record Maintenance Payment &mdash; Flat {selectedFlatForPayment.flat_number}
                  </h5>
                  <span className="small text-muted">
                    Atomic transaction: automatically clears pending dues and updates Society Wallet.
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowPaymentModal(false)} />
              </div>

              <form onSubmit={handleRecordPayment} className="d-flex flex-column flex-grow-1 min-h-0 overflow-hidden">
                <div className="modal-body p-4 overflow-y-auto" style={{ maxHeight: "calc(100dvh - 210px)" }}>
                  {/* Summary Banner without Outstanding Dues */}
                  <div className="row g-2 p-3 bg-light rounded-3 border mb-3">
                    <div className="col-sm-6">
                      <span className="small text-secondary">Flat &amp; Occupant:</span>
                      <div className="fw-bold text-dark fs-6">
                        Flat {selectedFlatForPayment.flat_number} &mdash;{" "}
                        {selectedFlatForPayment.current_resident?.full_name || "Owner"}
                      </div>
                      <span className="small text-muted">{selectedFlatForPayment.floor?.floor_name || "Floor"}</span>
                    </div>
                    <div className="col-sm-6 text-sm-end">
                      <span className="small text-secondary">Society Maintenance Rate:</span>
                      <div className="fw-bold text-primary fs-6">
                        ₹{DataStorage.getFlatMaintenanceRate(selectedFlatForPayment).toLocaleString()} / month
                      </div>
                      <div className="small text-muted">
                        Category: <span className="fw-semibold text-dark">{selectedFlatForPayment.current_resident?.resident_type || "OWNER"}</span>
                      </div>
                      {Number(selectedFlatForPayment.advance_balance || 0) > 0 && (
                        <span className="badge bg-purple-subtle text-primary border mt-1">
                          Advance Pool: ₹{Number(selectedFlatForPayment.advance_balance).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Multi-Month Allocation Banner if opened from Calendar */}
                  {selectedMonthIds.length > 0 && (
                    <div className="p-3 mb-3 bg-primary-subtle border border-primary-subtle rounded-3">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold text-primary small d-flex align-items-center gap-1.5">
                          <Sparkles size={14} />
                          <span>Multi-Month Payment Allocation ({selectedMonthIds.length} Selected)</span>
                        </span>
                        <span className="badge bg-primary text-white">
                          Auto Earliest-Month-First
                        </span>
                      </div>
                      <div className="small text-secondary">
                        Payment will be credited across the selected months chronologically. Any partial amount covers months in order, and excess payment automatically rolls into the <strong>Advance Maintenance Pool</strong>.
                      </div>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Amount Received (₹) <span className="text-danger">*</span>
                      </label>
                      <AmountInput
                        value={paymentAmount}
                        onChange={(val) => setPaymentAmount(val)}
                        placeholder="e.g. 1100"
                        className="form-control font-monospace fs-5 fw-bold text-dark"
                        min={1}
                        required
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Payment Method <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as MaintenancePayment["payment_method"])
                        }
                      >
                        <option value="ONLINE_UPI">Online UPI (GPay / PhonePe / Paytm)</option>
                        <option value="ONLINE_NEFT">Online NEFT / RTGS</option>
                        <option value="ONLINE_BANK">Direct Bank Transfer</option>
                        <option value="CASH">Cash</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Payment Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Transaction Ref / UTR / Cheque Number
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. UPI/98102910482"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary">
                        Description / Remarks
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={paymentDescription}
                        onChange={(e) => setPaymentDescription(e.target.value)}
                        placeholder="e.g. Maintenance payment for Flat A-101"
                      />
                    </div>

                    {/* Photo Attachment Option */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary d-flex align-items-center gap-1">
                        <Paperclip size={14} className="text-primary" />
                        <span>Add Photo Attachment (Receipt / Cheque / Bank Transfer Screenshot)</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("Photo size should be less than 5MB");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setPaymentAttachment(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {paymentAttachment && (
                        <div className="mt-2 d-flex align-items-center gap-3 p-2 bg-light border rounded-3">
                          <img
                            src={paymentAttachment}
                            alt="Preview"
                            className="rounded border"
                            style={{ width: "64px", height: "64px", objectFit: "cover" }}
                          />
                          <div className="flex-grow-1">
                            <span className="small fw-bold text-success d-block">Photo attached</span>
                            <span className="small text-muted">Will be saved and displayed permanently with this record</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setPaymentAttachment(null)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Automated Email Invoice Notice */}
                    {selectedFlatForPayment.current_resident?.email ? (
                      <div className="col-12">
                        <div className="p-3 bg-success-subtle border border-success-subtle rounded-3 d-flex align-items-center gap-2">
                          <Check size={16} className="text-success flex-shrink-0" />
                          <div className="small text-success-emphasis">
                            <strong>Automated Email Invoice Dispatch:</strong> Upon saving, an official payment receipt email with the generated invoice PDF attached will be dispatched to <strong>{selectedFlatForPayment.current_resident.email}</strong>.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="col-12">
                        <div className="p-2.5 bg-light border rounded-3 small text-muted">
                          ℹ️ No email address registered for this flat. You can download or print the PDF receipt directly after saving.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4 maintenance-modal-footer flex-shrink-0">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom">
                    <Sparkles size={16} />
                    <span>Confirm &amp; Issue Receipt</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Annual Maintenance Collection Modal */}
      {showMatrixModal && selectedFlatForMatrix && (() => {
        const displayedInvoices = flatYearInvoices.slice(0, 12);
        const flatRate = DataStorage.getFlatMaintenanceRate(selectedFlatForMatrix);
        const residentType = selectedFlatForMatrix.current_resident?.resident_type || "OWNER";
        const isTenant = residentType === "TENANT";

        const payableInvoices = displayedInvoices.filter(
          (i) => i.status !== "PAID" && i.status !== "ADVANCE_COVERED"
        );
        const selectedInvs = displayedInvoices.filter((i) => selectedMonthIds.includes(i.id));
        const selectedTotalAmt = selectedInvs.reduce(
          (sum, i) => sum + (i.due_amount > 0 ? i.due_amount : (i.invoice_amount || flatRate)),
          0
        );
        const totalPaidYear = displayedInvoices.reduce((sum, i) => sum + Number(i.paid_amount || 0), 0);
        const totalDueYear = displayedInvoices.reduce((sum, i) => sum + Number(i.due_amount || 0), 0);
        const annualRateTotal = flatRate * 12;
        const unbilledSelectedCount = selectedInvs.filter((i) => i.status === "NO_DUES").length;
        const allPayableSelected =
          payableInvoices.length > 0 &&
          payableInvoices.every((i) => selectedMonthIds.includes(i.id));

        return (
          <div
            className="modal d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060, overflowY: "auto" }}
          >
            <div className="modal-dialog modal-dialog-centered modal-xl maintenance-modal-dialog maintenance-matrix-dialog">
              <div className="modal-content border-0 shadow-lg rounded-4 maintenance-modal-content">
                <div className="modal-header border-bottom px-4 pt-4 pb-3 flex-shrink-0">
                  <div>
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <h5 className="modal-title fw-bold text-dark mb-0">
                        Annual Maintenance Collection &mdash; Flat {selectedFlatForMatrix.flat_number} ({selectedYear})
                      </h5>
                      <div className="btn-group btn-group-sm shadow-sm" role="group">
                        {AVAILABLE_YEARS.map((yr) => {
                          const tag = yr < 2026 ? "History" : yr === 2026 ? "Active" : "Upcoming";
                          return (
                            <button
                              key={yr}
                              type="button"
                              className={`btn btn-sm ${
                                selectedYear === yr
                                  ? "btn-primary text-white fw-bold shadow-sm"
                                  : "btn-light text-secondary border"
                              } px-2.5 py-0.5`}
                              onClick={() => {
                                setSelectedYear(yr);
                                const invs = DataStorage.getInvoices(selectedFlatForMatrix.id, yr);
                                const unique12 = Array.from(new Map(invs.map((i) => [i.month, i])).values())
                                  .sort((a, b) => a.month - b.month)
                                  .slice(0, 12);
                                setFlatYearInvoices(unique12);
                                setSelectedMonthIds([]);
                              }}
                            >
                              {yr} ({tag})
                            </button>
                          );
                        })}
                      </div>
                      {isLeapYear(selectedYear) ? (
                        <span className="badge bg-info text-dark border fw-bold">
                          Leap Year ({selectedYear}) &bull; Feb 29 Days
                        </span>
                      ) : (
                        <span className="badge bg-light text-secondary border">
                          {selectedYear} &bull; Feb 28 Days
                        </span>
                      )}
                      {isTenant ? (
                        <span className="badge bg-warning text-dark border fw-bold">
                          TENANT OCCUPIED (Rate: ₹{flatRate.toLocaleString()} / mo)
                        </span>
                      ) : (
                        <span className="badge bg-primary text-white border fw-bold">
                          OWNER OCCUPIED (Rate: ₹{flatRate.toLocaleString()} / mo)
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-0.5 px-2 small fw-semibold"
                        onClick={() => handleOpenSetRateModal(selectedFlatForMatrix)}
                        title="Set or Override Monthly Maintenance Rate"
                      >
                        <Edit2 size={12} className="me-1" />
                        Set Rate
                      </button>
                    </div>
                    <div className="small text-muted">
                      Resident: <strong className="text-dark">{selectedFlatForMatrix.current_resident?.full_name || "Owner"}</strong> | Floor:{" "}
                      {selectedFlatForMatrix.floor?.floor_name || "Floor"} | Annual Maintenance:{" "}
                      <strong className="text-dark">₹{annualRateTotal.toLocaleString()}</strong> | Paid:{" "}
                      <strong className="text-success">₹{totalPaidYear.toLocaleString()}</strong> | Pending Due:{" "}
                      <strong className={totalDueYear > 0 ? "text-danger" : "text-muted"}>₹{totalDueYear.toLocaleString()}</strong>
                      {selectedYear > 2026 && totalPaidYear === 0 && (
                        <span className="ms-2 badge bg-secondary-subtle text-secondary border">
                          Upcoming Cycle (Unbilled)
                        </span>
                      )}
                      {Number(selectedFlatForMatrix.advance_balance || 0) > 0 && (
                        <span className="ms-2 badge bg-purple-subtle text-primary border">
                          Advance Pool: ₹{Number(selectedFlatForMatrix.advance_balance).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setShowMatrixModal(false)} />
                </div>

                <div className="modal-body p-4 overflow-y-auto" style={{ maxHeight: "calc(100dvh - 210px)" }}>
                  {/* Calendar Action & Selection Controls Toolbar */}
                  <div className="p-3 bg-light rounded-3 border mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2 maintenance-matrix-toolbar">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary btn-tab px-2.5 py-1"
                        onClick={handleSelectAllUnpaidMonths}
                      >
                        <CheckSquare size={14} className="me-1 text-primary" />
                        Select All Pending Months ({payableInvoices.length})
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary btn-tab px-2.5 py-1"
                        onClick={handleSelectAllPayableMonths}
                        disabled={payableInvoices.length === 0}
                      >
                        Select All Payable Months
                      </button>
                      {selectedMonthIds.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger btn-tab px-2.5 py-1"
                          onClick={handleDeselectAllMonths}
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="small text-secondary">
                        <strong className="text-dark">{selectedMonthIds.length}</strong> month(s) selected
                      </span>
                      {selectedMonthIds.length > 0 && (
                        <span className="badge bg-primary fs-6 px-3 py-1">
                          Payable Total: ₹{selectedTotalAmt.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 12-Month Calendar Table */}
                  <div className="table-responsive maintenance-matrix-table-scroll">
                    <table className="table table-bordered table-premium align-middle mb-0 maintenance-matrix-table">
                      <thead>
                        <tr>
                          <th className="text-center" style={{ width: "90px" }}>
                            {payableInvoices.length > 0 ? (
                              <input
                                type="checkbox"
                                className="form-check-input cursor-pointer"
                                checked={allPayableSelected}
                                onChange={() =>
                                  allPayableSelected ? handleDeselectAllMonths() : handleSelectAllPayableMonths()
                                }
                                title="Toggle Select All Payable Months"
                              />
                            ) : (
                              <span className="small text-muted">Status</span>
                            )}
                          </th>
                          <th>Month</th>
                          <th>Maintenance Rate</th>
                          <th>Payment Status</th>
                          <th>Amount Paid</th>
                          <th>Pending Due</th>
                          <th>Due / Bill Date</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedInvoices.map((inv) => {
                          const isSelected = selectedMonthIds.includes(inv.id);
                          const isPaid = inv.status === "PAID" || inv.status === "ADVANCE_COVERED";

                          return (
                            <tr key={inv.id} className={isSelected ? "table-primary bg-primary-subtle" : ""}>
                              <td className="text-center">
                                {isPaid ? (
                                  <span
                                    className="badge bg-success-subtle text-success border py-1 px-1.5"
                                    title="Already paid - excluded from duplicate collection"
                                  >
                                    <Check size={14} className="text-success" />
                                  </span>
                                ) : (
                                  <input
                                    type="checkbox"
                                    className="form-check-input cursor-pointer"
                                    checked={isSelected}
                                    onChange={() => handleToggleMonthSelection(inv.id)}
                                  />
                                )}
                              </td>
                              <td className="fw-bold text-dark">
                                <div className="d-flex align-items-center gap-2">
                                  <span>{MONTH_NAMES[inv.month - 1]}</span>
                                  {inv.month === 2 && (
                                    isLeapYear(inv.year) ? (
                                      <span className="badge bg-primary-subtle text-primary border py-0 px-1.5 small fw-normal">
                                        Leap Year (29 days)
                                      </span>
                                    ) : (
                                      <span className="badge bg-light text-muted border py-0 px-1.5 small fw-normal">
                                        28 days
                                      </span>
                                    )
                                  )}
                                </div>
                              </td>
                              <td className="fw-semibold">₹{(inv.invoice_amount || flatRate).toLocaleString()}</td>
                              <td>
                                <StatusBadge
                                  status={inv.status}
                                  label={
                                    inv.status === "NO_DUES"
                                      ? "PENDING BILL"
                                      : inv.status === "UNPAID"
                                        ? "UNPAID"
                                        : inv.status === "PARTIAL"
                                          ? "PARTIALLY PAID"
                                          : inv.status === "PAID"
                                            ? "PAID"
                                            : "ADVANCE"
                                  }
                                />
                              </td>
                              <td className="text-success fw-semibold">₹{Number(inv.paid_amount || 0).toLocaleString()}</td>
                              <td className={Number(inv.due_amount || 0) > 0 ? "text-danger fw-bold" : "text-muted"}>
                                ₹{Number(inv.due_amount || (inv.status === "NO_DUES" ? flatRate : 0)).toLocaleString()}
                              </td>
                              <td className="small text-secondary">{formatDate(inv.due_date)}</td>
                              <td className="text-end">
                                {!isPaid ? (
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline-primary"} py-0 px-2 small`}
                                    onClick={() => handleToggleMonthSelection(inv.id)}
                                  >
                                    {isSelected ? "Selected" : "Select"}
                                  </button>
                                ) : (
                                  <span className="text-success small fw-semibold d-inline-flex align-items-center gap-1">
                                    <Check size={13} /> Paid
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4 d-flex flex-wrap justify-content-between align-items-center maintenance-matrix-footer flex-shrink-0">
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-secondary">
                      Selected: <strong className="text-dark">{selectedMonthIds.length}</strong> month(s)
                    </span>
                    {selectedMonthIds.length > 0 && (
                      <span className="badge bg-primary fs-6 px-3 py-1">
                        Total Amount: ₹{selectedTotalAmt.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="d-flex align-items-center gap-2 maintenance-matrix-footer-actions">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-tab"
                      onClick={() => setShowMatrixModal(false)}
                    >
                      Close
                    </button>

                    {unbilledSelectedCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-outline-warning text-dark fw-semibold"
                        onClick={handleGenerateDuesForSelected}
                      >
                        Generate Dues ({unbilledSelectedCount})
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary-custom"
                      disabled={selectedMonthIds.length === 0}
                      onClick={handleProceedToCollectSelected}
                    >
                      <CreditCard size={15} />
                      <span>
                        {selectedMonthIds.length > 0
                          ? `Collect Payment (₹${selectedTotalAmt.toLocaleString()})`
                          : "Select Months to Collect"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Instant Receipt Preview & PDF Download Modal */}
      {showReceiptModal && activeReceipt && receiptFlat && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1070, overflowY: "auto" }}
        >
          <div className="modal-dialog modal-dialog-centered maintenance-modal-dialog">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden maintenance-modal-content">
              {/* Receipt Header Banner */}
              <div className="p-4 text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #0f172a, #2563eb)" }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-success-subtle text-success border">Payment Confirmed</span>
                  <span className="small text-light opacity-75">{formatDate(activeReceipt.payment_date)}</span>
                </div>
                <h4 className="fw-bold mb-0">Maintenance Receipt</h4>
                <div className="small font-monospace opacity-75">{activeReceipt.receipt_number}</div>
              </div>

              <div className="modal-body p-4 bg-white overflow-y-auto" style={{ maxHeight: "calc(100dvh - 210px)" }}>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-secondary small">Flat:</span>
                  <span className="fw-bold text-dark">{receiptFlat.flat_number}</span>
                </div>

                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-secondary small">Resident:</span>
                  <span className="fw-semibold text-dark">
                    {receiptFlat.current_resident?.full_name || "Owner"}
                  </span>
                </div>

                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-secondary small">Payment Mode:</span>
                  <span className="fw-medium text-dark">{activeReceipt.payment_method}</span>
                </div>

                {activeReceipt.transaction_ref && (
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-secondary small">Reference:</span>
                    <span className="font-monospace small text-primary">{activeReceipt.transaction_ref}</span>
                  </div>
                )}

                <div className="d-flex justify-content-between py-3 my-2 bg-light rounded-3 px-3">
                  <span className="fw-bold text-dark fs-6">Amount Received:</span>
                  <span className="fw-extrabold text-success fs-5">
                    ₹{Number(activeReceipt.total_amount_received).toLocaleString()}
                  </span>
                </div>

                {/* Display Attachment if available */}
                {activeReceipt.attachment_url && (
                  <div className="pt-2">
                    <span className="text-secondary small d-block mb-1">Attached Payment Proof:</span>
                    <img
                      src={activeReceipt.attachment_url}
                      alt="Payment attachment"
                      className="img-fluid rounded border cursor-pointer"
                      style={{ maxHeight: "140px", objectFit: "contain", cursor: "pointer" }}
                      onClick={() =>
                        setPreviewImage({
                          url: activeReceipt.attachment_url!,
                          title: `Attached Proof for Receipt ${activeReceipt.receipt_number}`,
                        })
                      }
                    />
                    <div className="small text-muted mt-1 fst-italic">Click image to enlarge</div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-light border-top d-flex justify-content-between align-items-center flex-wrap gap-2 maintenance-receipt-footer flex-shrink-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Close
                </button>
                <div className="action-buttons maintenance-receipt-actions">
                  {receiptFlat.current_resident?.email && (
                    <button
                      type="button"
                      className="btn btn-outline-primary d-inline-flex align-items-center gap-1.5"
                      onClick={() => handleSendReceiptEmail(activeReceipt, receiptFlat, receiptAllocatedMonths)}
                      disabled={sendingReceiptEmail}
                    >
                      {sendingReceiptEmail ? (
                        <>
                          <span className="spinner-border spinner-border-sm" />
                          <span>Sending Invoice...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={15} />
                          <span>Email Invoice to Resident</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline-secondary d-inline-flex align-items-center gap-1.5"
                    onClick={handleViewPDFReceipt}
                    title="View PDF directly in browser (ideal for mobile)"
                  >
                    <Eye size={15} />
                    <span>View PDF</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary-custom d-inline-flex align-items-center gap-1.5"
                    onClick={handleDownloadPDFReceipt}
                  >
                    <Download size={15} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.8)", zIndex: 1090 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg maintenance-modal-dialog">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-dark text-white">
              <div className="modal-header border-bottom border-secondary px-4 py-3 d-flex justify-content-between align-items-center">
                <h6 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                  <ImageIcon size={18} className="text-primary" />
                  <span>{previewImage.title}</span>
                </h6>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light"
                  onClick={() => setPreviewImage(null)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body p-3 text-center bg-black d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
                <img
                  src={previewImage.url}
                  alt="Attachment Preview"
                  className="img-fluid rounded"
                  style={{ maxHeight: "75vh", maxWidth: "100%", objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Flat Maintenance Rate Modal */}
      {showSetRateModal && targetFlatForRate && (() => {
        const settings = DataStorage.getSettings();
        const ownerRate = settings.owner_monthly_amount || 1100;
        const tenantRate = settings.tenant_monthly_amount || 1500;
        const resident = targetFlatForRate.current_resident;
        const isTenant = resident?.resident_type === "TENANT";

        return (
          <div
            className="modal d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1070, overflowY: "auto" }}
          >
            <div className="modal-dialog modal-dialog-centered maintenance-modal-dialog">
              <div className="modal-content border-0 shadow-lg rounded-4 maintenance-modal-content">
                <div className="modal-header border-bottom px-4 pt-4 pb-3 flex-shrink-0">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 bg-primary-subtle text-primary rounded-circle">
                      <Settings2 size={20} />
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold text-dark mb-0">
                        Set Maintenance Rate &mdash; Flat {targetFlatForRate.flat_number}
                      </h5>
                      <span className="small text-muted">
                        Configure custom or standard monthly maintenance for this flat
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowSetRateModal(false)}
                  />
                </div>

                <form onSubmit={handleSaveFlatRate} className="d-flex flex-column flex-grow-1 min-h-0 overflow-hidden">
                  <div className="modal-body p-4 overflow-y-auto" style={{ maxHeight: "calc(100dvh - 210px)" }}>
                    <div className="p-3 bg-light rounded-3 border mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold text-dark fs-6">
                          Flat {targetFlatForRate.flat_number} ({targetFlatForRate.floor?.floor_name || "Floor"})
                        </span>
                        {resident ? (
                          <span
                            className={`badge ${isTenant
                              ? "bg-warning text-dark border"
                              : "bg-primary text-white"
                              }`}
                          >
                            {resident.resident_type}
                          </span>
                        ) : (
                          <span className="badge bg-secondary">VACANT</span>
                        )}
                      </div>
                      <div className="small text-secondary">
                        Occupant:{" "}
                        <strong className="text-dark">
                          {resident?.full_name || "No active resident (Vacant)"}
                        </strong>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-secondary d-block">
                        Quick Rate Presets
                      </label>
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className={`btn btn-sm ${Number(rateInputValue) === tenantRate
                            ? "btn-warning text-dark fw-bold"
                            : "btn-outline-secondary"
                            }`}
                          onClick={() => setRateInputValue(tenantRate)}
                        >
                          Tenant Rate (₹{tenantRate.toLocaleString()})
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${Number(rateInputValue) === ownerRate
                            ? "btn-primary fw-bold"
                            : "btn-outline-secondary"
                            }`}
                          onClick={() => setRateInputValue(ownerRate)}
                        >
                          Owner Rate (₹{ownerRate.toLocaleString()})
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-bold text-dark">
                        Monthly Maintenance Amount (₹) <span className="text-danger">*</span>
                      </label>
                      <AmountInput
                        value={rateInputValue}
                        onChange={(val) => setRateInputValue(val)}
                        placeholder="e.g. 1500"
                        className="form-control fs-5 font-monospace fw-bold"
                        min={100}
                        required
                      />
                      <small className="text-muted">
                        Applied to this flat&apos;s monthly billing cycles.
                      </small>
                    </div>

                    <div className="alert alert-info small d-flex align-items-start gap-2 mb-0">
                      <AlertCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Automatic Synchronization:</strong> Updating this rate automatically
                        re-calculates all unbilled and pending dues for Flat {targetFlatForRate.flat_number}.
                        Historical paid receipts remain permanently locked.
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4 maintenance-modal-footer flex-shrink-0">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowSetRateModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary-custom">
                      Save &amp; Update Flat Maintenance
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

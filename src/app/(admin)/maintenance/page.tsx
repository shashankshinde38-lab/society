"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge/StatusBadge";
import { DataStorage } from "@/services/dataStorage";
import { Flat, Floor, MaintenanceInvoice, MaintenancePayment } from "@/types/database.types";
import { formatDate } from "@/utils/dateFormatter";
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
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [selectedYear, setSelectedYear] = useState<number>(2026);

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

  // Full-size Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const loadData = () => {
    setFlats(DataStorage.getFlats());
    setFloors(DataStorage.getFloors());
    setInvoices(DataStorage.getInvoices());
    setPayments(DataStorage.getPayments());
  };

  useEffect(() => {
    loadData();
  }, []);

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
        setFlatYearInvoices(DataStorage.getInvoices(selectedFlatForMatrix.id, selectedYear));
      }

      // Open Receipt for immediate preview & print
      setActiveReceipt(result.payment);
      setReceiptFlat(selectedFlatForPayment);
      setShowReceiptModal(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment recording failed");
    }
  };

  // Open 12-Month Matrix
  const handleOpenMatrix = (flat: Flat) => {
    setSelectedFlatForMatrix(flat);
    const flatInvs = DataStorage.getInvoices(flat.id, selectedYear);
    setFlatYearInvoices(flatInvs);
    setSelectedMonthIds([]);
    setShowMatrixModal(true);
  };

  // Toggle Single Month Selection in 12-Month Calendar
  const handleToggleMonthSelection = (invId: string) => {
    setSelectedMonthIds((prev) =>
      prev.includes(invId) ? prev.filter((id) => id !== invId) : [...prev, invId]
    );
  };

  // Select all unpaid / pending months
  const handleSelectAllUnpaidMonths = () => {
    const unpaidIds = flatYearInvoices
      .filter((i) => i.status === "UNPAID" || i.status === "PARTIAL")
      .map((i) => i.id);
    if (unpaidIds.length === 0) {
      toast.info("No unpaid months found for this year");
      return;
    }
    setSelectedMonthIds(unpaidIds);
  };

  // Select all 12 months
  const handleSelectAllMonths = () => {
    setSelectedMonthIds(flatYearInvoices.map((i) => i.id));
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
    setFlatYearInvoices(updated);
  };

  // Proceed to Multi-Month Payment Collection
  const handleProceedToCollectSelected = () => {
    if (!selectedFlatForMatrix || selectedMonthIds.length === 0) {
      toast.error("Please select at least one month to collect payment");
      return;
    }
    const selectedInvs = flatYearInvoices.filter((i) => selectedMonthIds.includes(i.id));
    const totalSelectedAmt = selectedInvs.reduce(
      (sum, i) => sum + (i.due_amount > 0 ? i.due_amount : i.invoice_amount),
      0
    );
    setShowMatrixModal(false);
    handleOpenCollectPayment(selectedFlatForMatrix, selectedMonthIds, totalSelectedAmt);
  };

  // Generate PDF Receipt
  const handleDownloadPDFReceipt = () => {
    if (!activeReceipt || !receiptFlat) return;
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
    doc.text("Email: parijatsociety@gmail.com | Official Maintenance Receipt", 14, 30);

    // Receipt Meta
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`RECEIPT #: ${activeReceipt.receipt_number}`, 14, 48);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Payment Date: ${activeReceipt.payment_date}`, 145, 48);

    // Bill Details Table
    autoTable(doc, {
      startY: 55,
      head: [["Description", "Details"]],
      body: [
        ["Flat Number", `${receiptFlat.flat_number} (${receiptFlat.floor?.floor_name || "Floor"})`],
        ["Resident Name", receiptFlat.current_resident?.full_name || "Owner/Occupant"],
        ["Occupancy Type", receiptFlat.current_resident?.resident_type || "OWNER"],
        ["Payment Method", activeReceipt.payment_method],
        ["Transaction / Cheque Ref", activeReceipt.transaction_ref || "N/A (Cash Received)"],
        ["Narration / Remarks", activeReceipt.description || "Regular Maintenance Dues"],
        ["Total Amount Received", `INR ${Number(activeReceipt.total_amount_received).toLocaleString("en-IN")}.00`],
      ],
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 4 },
    });

    // Footer Signatures
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30;
    doc.setFontSize(9);
    doc.text("Authorised Signature / Treasurer", 14, finalY);
    doc.text("Society Stamp", 150, finalY);

    doc.save(`${activeReceipt.receipt_number}_${receiptFlat.flat_number}.pdf`);
    toast.success("Receipt PDF downloaded successfully!");
  };

  // Filtered flats
  const filteredFlats = flats.filter((flat) => {
    const matchesSearch =
      flat.flat_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flat.current_resident && flat.current_resident.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFloor = floorFilter === "ALL" || flat.floor_id === floorFilter;
    const matchesType =
      typeFilter === "ALL" || (flat.current_resident && flat.current_resident.resident_type === typeFilter);

    let matchesStatus = true;
    if (statusFilter === "PAID") matchesStatus = (flat.outstanding_dues || 0) === 0;
    if (statusFilter === "UNPAID") matchesStatus = (flat.outstanding_dues || 0) > 0;

    return matchesSearch && matchesFloor && matchesType && matchesStatus;
  });

  // Calculate Overview Stats
  const totalFlatsCount = flats.length;
  const paidFlatsCount = flats.filter((f) => (f.outstanding_dues || 0) === 0).length;
  const unpaidFlatsCount = flats.filter((f) => (f.outstanding_dues || 0) > 0).length;
  const totalPendingSum = flats.reduce((sum, f) => sum + (f.outstanding_dues || 0), 0);
  const totalCollectedSum = payments.reduce((sum, p) => sum + Number(p.total_amount_received || 0), 0);
  const advancePoolSum = flats.reduce((sum, f) => sum + Number(f.advance_balance || 0), 0);

  return (
    <div>
      <PageHeader
        title="Maintenance Management & Invoicing"
        subtitle="Manage flat-wise maintenance collections, 12-month calendar tracking, multiple-month payments, and receipts"
        breadcrumbs={[{ label: "Maintenance" }]}
        actions={
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm bg-white"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                if (selectedFlatForMatrix) {
                  setFlatYearInvoices(DataStorage.getInvoices(selectedFlatForMatrix.id, Number(e.target.value)));
                }
              }}
            >
              <option value={2025}>FY 2025</option>
              <option value={2026}>FY 2026</option>
              <option value={2027}>FY 2027</option>
            </select>
          </div>
        }
      />

      {/* Top Financial KPI Metric Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="stat-card border-start border-4 border-success">
            <div className="stat-title">Total Collected</div>
            <div className="stat-value text-success">₹{totalCollectedSum.toLocaleString()}</div>
            <div className="small text-secondary mt-1">
              <span className="fw-bold text-dark">{paidFlatsCount}</span> of {totalFlatsCount} Flats Paid
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="stat-card border-start border-4 border-danger">
            <div className="stat-title">Total Pending Dues</div>
            <div className="stat-value text-danger">₹{totalPendingSum.toLocaleString()}</div>
            <div className="small text-secondary mt-1">
              <span className="fw-bold text-danger">{unpaidFlatsCount}</span> Flats with Dues
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
      <div className="d-flex align-items-center gap-2 mb-3">
        <button
          className={`btn btn-sm btn-tab ${
            activeTab === "FLATS" ? "active btn-primary-custom" : ""
          } px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5`}
          onClick={() => setActiveTab("FLATS")}
        >
          <Building size={15} />
          <span>Flats &amp; Invoices Calendar</span>
        </button>
        <button
          className={`btn btn-sm btn-tab ${
            activeTab === "PAYMENTS" ? "active btn-primary-custom" : ""
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
          <div className="card-premium mb-4">
            <div className="p-3 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div className="d-flex flex-column flex-sm-row gap-2 flex-grow-1" style={{ maxWidth: "750px" }}>
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
                  className="form-select form-select-sm"
                  style={{ width: "160px" }}
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
                  className="form-select form-select-sm"
                  style={{ width: "160px" }}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="OWNER">Owner</option>
                  <option value="TENANT">Tenant</option>
                </select>

                <select
                  className="form-select form-select-sm"
                  style={{ width: "160px" }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Dues Status</option>
                  <option value="PAID">All Clear (Paid)</option>
                  <option value="UNPAID">Pending Dues</option>
                </select>
              </div>

              <div className="small text-secondary">
                Showing <strong className="text-dark">{filteredFlats.length}</strong> Flats
              </div>
            </div>
          </div>

          {/* Flat-wise Maintenance Master Table */}
          <div className="card-premium">
            <div className="table-responsive">
              <table className="table table-premium align-middle mb-0">
                <thead>
                  <tr>
                    <th>Flat #</th>
                    <th>Floor</th>
                    <th>Current Resident</th>
                    <th>Type</th>
                    <th>Monthly Rate</th>
                    <th>Outstanding Dues</th>
                    <th>Current Month</th>
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
                      const currentMonthNum = new Date().getMonth() + 1;
                      const currentMonthInv = invoices.find(
                        (i) => i.flat_id === flat.id && i.month === currentMonthNum && i.year === selectedYear
                      );
                      const isClear = (flat.outstanding_dues || 0) === 0;

                      return (
                        <tr key={flat.id}>
                          <td className="fw-bold text-dark fs-6">
                            <div className="d-flex align-items-center gap-2">
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
                              className={`badge ${
                                flat.current_resident?.resident_type === "OWNER"
                                  ? "bg-primary-subtle text-primary border"
                                  : "bg-warning-subtle text-warning border"
                              }`}
                            >
                              {flat.current_resident?.resident_type || "N/A"}
                            </span>
                          </td>
                          <td className="fw-semibold text-dark">
                            ₹{(flat.maintenance_override || 1100).toLocaleString()}
                          </td>
                          <td>
                            {!isClear ? (
                              <span className="fw-bold text-danger">₹{flat.outstanding_dues?.toLocaleString()}</span>
                            ) : (
                              <span className="text-success small fw-semibold">₹0</span>
                            )}
                          </td>
                          <td>
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
                          </td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1"
                                onClick={() => handleOpenMatrix(flat)}
                                title="View 12-Month Calendar"
                              >
                                <Calendar size={14} />
                                <span className="small">12 Months</span>
                              </button>

                              <button
                                className="btn btn-sm btn-primary-custom py-1 px-2.5"
                                onClick={() => handleOpenCollectPayment(flat)}
                              >
                                <DollarSign size={14} />
                                <span className="small">Collect</span>
                              </button>
                            </div>
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
      ) : (
        /* Payment Records Tab */
        <div className="card-premium">
          <div className="table-responsive">
            <table className="table table-premium align-middle mb-0">
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
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-secondary">
                      No maintenance payments recorded yet. Click &quot;Collect&quot; next to any flat to record a payment.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
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
                            <div className="d-flex align-items-center gap-2">
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
      )}

      {/* Collect Payment Professional Modal */}
      {showPaymentModal && selectedFlatForPayment && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
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

              <form onSubmit={handleRecordPayment}>
                <div className="modal-body p-4">
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
                        ₹{(selectedFlatForPayment.maintenance_override || 1100).toLocaleString()} / month
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
                      <input
                        type="number"
                        className="form-control font-monospace fs-5 fw-bold text-dark no-spinner"
                        value={paymentAmount}
                        onChange={(e) =>
                          setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        placeholder="e.g. 1100"
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
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
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

      {/* 12-Month Calendar Matrix Modal */}
      {showMatrixModal && selectedFlatForMatrix && (() => {
        const selectedInvs = flatYearInvoices.filter((i) => selectedMonthIds.includes(i.id));
        const selectedTotalAmt = selectedInvs.reduce(
          (sum, i) => sum + (i.due_amount > 0 ? i.due_amount : i.invoice_amount),
          0
        );
        const unbilledSelectedCount = selectedInvs.filter((i) => i.status === "NO_DUES").length;
        const allSelected =
          flatYearInvoices.length > 0 && selectedMonthIds.length === flatYearInvoices.length;

        return (
          <div
            className="modal d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-xl">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-bottom px-4 pt-4 pb-3">
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">
                      12-Month Maintenance Calendar &mdash; Flat {selectedFlatForMatrix.flat_number} ({selectedYear})
                    </h5>
                    <div className="small text-muted mt-0.5">
                      Resident: <strong className="text-dark">{selectedFlatForMatrix.current_resident?.full_name || "Owner"}</strong> | Floor:{" "}
                      {selectedFlatForMatrix.floor?.floor_name || "1st Floor"} | Base Rate:{" "}
                      <strong className="text-primary">₹{(selectedFlatForMatrix.maintenance_override || 1100).toLocaleString()} / month</strong>
                      {Number(selectedFlatForMatrix.advance_balance || 0) > 0 && (
                        <span className="ms-2 badge bg-success-subtle text-success border">
                          Advance Pool: ₹{Number(selectedFlatForMatrix.advance_balance).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setShowMatrixModal(false)} />
                </div>

                <div className="modal-body p-4">
                  {/* Calendar Action & Selection Controls Toolbar */}
                  <div className="p-3 bg-light rounded-3 border mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary btn-tab px-2.5 py-1"
                        onClick={handleSelectAllUnpaidMonths}
                      >
                        <CheckSquare size={14} className="me-1 text-primary" />
                        Select All Unpaid Months
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary btn-tab px-2.5 py-1"
                        onClick={handleSelectAllMonths}
                      >
                        Select All (12 Months)
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

                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-secondary">
                        <strong className="text-dark">{selectedMonthIds.length}</strong> of 12 Months Selected
                      </span>
                      {selectedMonthIds.length > 0 && (
                        <span className="badge bg-primary fs-6 px-3 py-1">
                          Total: ₹{selectedTotalAmt.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 12-Month Calendar Table */}
                  <div className="table-responsive">
                    <table className="table table-bordered table-premium align-middle mb-0">
                      <thead>
                        <tr>
                          <th className="text-center" style={{ width: "44px" }}>
                            <input
                              type="checkbox"
                              className="form-check-input cursor-pointer"
                              checked={allSelected}
                              onChange={() => (allSelected ? handleDeselectAllMonths() : handleSelectAllMonths())}
                              title="Toggle Select All"
                            />
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
                        {flatYearInvoices.map((inv) => {
                          const isSelected = selectedMonthIds.includes(inv.id);
                          const isPaid = inv.status === "PAID";

                          return (
                            <tr key={inv.id} className={isSelected ? "table-primary bg-primary-subtle" : ""}>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input cursor-pointer"
                                  checked={isSelected}
                                  onChange={() => handleToggleMonthSelection(inv.id)}
                                />
                              </td>
                              <td className="fw-bold text-dark">{MONTH_NAMES[inv.month - 1]}</td>
                              <td className="fw-semibold">₹{inv.invoice_amount.toLocaleString()}</td>
                              <td>
                                <StatusBadge
                                  status={inv.status}
                                  label={
                                    inv.status === "NO_DUES"
                                      ? "NO DUES"
                                      : inv.status === "UNPAID"
                                      ? "PENDING"
                                      : inv.status === "PARTIAL"
                                      ? "PARTIALLY PAID"
                                      : inv.status === "PAID"
                                      ? "PAID"
                                      : "ADVANCE"
                                  }
                                />
                              </td>
                              <td className="text-success fw-semibold">₹{inv.paid_amount.toLocaleString()}</td>
                              <td className={inv.due_amount > 0 ? "text-danger fw-bold" : "text-muted"}>
                                ₹{inv.due_amount.toLocaleString()}
                              </td>
                              <td className="small text-secondary">{formatDate(inv.due_date)}</td>
                              <td className="text-end">
                                {!isPaid ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary py-0 px-2 small"
                                    onClick={() => {
                                      setShowMatrixModal(false);
                                      handleOpenCollectPayment(
                                        selectedFlatForMatrix,
                                        [inv.id],
                                        inv.due_amount > 0 ? inv.due_amount : inv.invoice_amount
                                      );
                                    }}
                                  >
                                    Pay Month
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

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4 d-flex flex-wrap justify-content-between align-items-center">
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

                  <div className="d-flex align-items-center gap-2">
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
          style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1070 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              {/* Receipt Header Banner */}
              <div className="p-4 text-white" style={{ background: "linear-gradient(135deg, #0f172a, #2563eb)" }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-success-subtle text-success border">Payment Confirmed</span>
                  <span className="small text-light opacity-75">{formatDate(activeReceipt.payment_date)}</span>
                </div>
                <h4 className="fw-bold mb-0">Maintenance Receipt</h4>
                <div className="small font-monospace opacity-75">{activeReceipt.receipt_number}</div>
              </div>

              <div className="p-4 bg-white">
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

              <div className="p-3 bg-light border-top d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowReceiptModal(false)}
                >
                  Close
                </button>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary-custom"
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
          <div className="modal-dialog modal-dialog-centered modal-lg">
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
    </div>
  );
}

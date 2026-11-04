"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge/StatusBadge";
import { DataStorage } from "@/services/dataStorage";
import { Resident, Flat, FlatResidentHistory } from "@/types/database.types";
import { formatDate } from "@/utils/dateFormatter";
import { sanitizeMobileInput, validateMobile, validateEmail } from "@/utils/validation";
import { PlusCircle, Search, UserCheck, History, Phone, Mail, UserPlus, Trash2, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Add / Edit Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [flatId, setFlatId] = useState("");
  const [residentType, setResidentType] = useState<"OWNER" | "TENANT">("OWNER");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [emailError, setEmailError] = useState("");

  // Change Occupant Modal
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [currentResident, setCurrentResident] = useState<Resident | null>(null);
  const [newOccupantName, setNewOccupantName] = useState("");
  const [newOccupantType, setNewOccupantType] = useState<"OWNER" | "TENANT">("TENANT");
  const [newEmail, setNewEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newMobileError, setNewMobileError] = useState("");
  const [newEmailError, setNewEmailError] = useState("");
  const [newMoveInDate, setNewMoveInDate] = useState(new Date().toISOString().split("T")[0]);
  const [changeNotes, setChangeNotes] = useState("");

  // Delete Resident State
  const [deleteConfirmResident, setDeleteConfirmResident] = useState<Resident | null>(null);

  // History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<FlatResidentHistory[]>([]);
  const [historyFlatNumber, setHistoryFlatNumber] = useState("");

  const loadData = () => {
    setResidents(DataStorage.getResidents().filter((r) => r.is_active));
    setFlats(DataStorage.getFlats());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    if (flats.length === 0) {
      toast.error("Please add at least one Flat first in Masters > Flats!");
      return;
    }
    setFullName("");
    setFlatId(flats[0].id);
    setResidentType("OWNER");
    setEmail("");
    setMobile("");
    setMobileError("");
    setEmailError("");
    setShowAddModal(true);
  };

  const handleMobileChange = (val: string) => {
    const cleaned = sanitizeMobileInput(val);
    setMobile(cleaned);
    const res = validateMobile(cleaned, true);
    setMobileError(res.isValid ? "" : res.message || "");
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!val.trim()) {
      setEmailError("");
    } else {
      const res = validateEmail(val, false);
      setEmailError(res.isValid ? "" : res.message || "");
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobile.trim()) {
      toast.error("Please enter resident name and mobile number");
      return;
    }

    const mobileCheck = validateMobile(mobile, true);
    if (!mobileCheck.isValid) {
      toast.error(mobileCheck.message || "Invalid mobile number. Must be exactly 10 digits.");
      setMobileError(mobileCheck.message || "");
      return;
    }

    if (email.trim()) {
      const emailCheck = validateEmail(email, false);
      if (!emailCheck.isValid) {
        toast.error(emailCheck.message || "Invalid email address format.");
        setEmailError(emailCheck.message || "");
        return;
      }
    }

    try {
      DataStorage.addResident({
        flat_id: flatId,
        full_name: fullName.trim(),
        resident_type: residentType,
        email: email.trim() || null,
        mobile: mobile.trim(),
        alternate_mobile: null,
        move_in_date: new Date().toISOString().split("T")[0],
        move_out_date: null,
      });
      toast.success(`Resident ${fullName} registered with payment status NO DUES`);
      setShowAddModal(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add resident");
    }
  };

  const handleOpenChangeOccupant = (resident: Resident) => {
    const flat = flats.find((f) => f.id === resident.flat_id);
    setSelectedFlat(flat || null);
    setCurrentResident(resident);
    setNewOccupantName("");
    setNewOccupantType(resident.resident_type === "OWNER" ? "TENANT" : "OWNER");
    setNewEmail("");
    setNewMobile("");
    setNewMobileError("");
    setNewEmailError("");
    setNewMoveInDate(new Date().toISOString().split("T")[0]);
    setChangeNotes("");
    setShowChangeModal(true);
  };

  const handleNewMobileChange = (val: string) => {
    const cleaned = sanitizeMobileInput(val);
    setNewMobile(cleaned);
    const res = validateMobile(cleaned, true);
    setNewMobileError(res.isValid ? "" : res.message || "");
  };

  const handleNewEmailChange = (val: string) => {
    setNewEmail(val);
    if (!val.trim()) {
      setNewEmailError("");
    } else {
      const res = validateEmail(val, false);
      setNewEmailError(res.isValid ? "" : res.message || "");
    }
  };

  const handleSaveChangeOccupant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlat || !newOccupantName.trim() || !newMobile.trim()) {
      toast.error("Please enter new occupant name and mobile number");
      return;
    }

    const mobileCheck = validateMobile(newMobile, true);
    if (!mobileCheck.isValid) {
      toast.error(mobileCheck.message || "Invalid mobile number. Must be exactly 10 digits.");
      setNewMobileError(mobileCheck.message || "");
      return;
    }

    if (newEmail.trim()) {
      const emailCheck = validateEmail(newEmail, false);
      if (!emailCheck.isValid) {
        toast.error(emailCheck.message || "Invalid email address format.");
        setNewEmailError(emailCheck.message || "");
        return;
      }
    }

    try {
      DataStorage.changeResidentOccupant(selectedFlat.id, {
        full_name: newOccupantName.trim(),
        resident_type: newOccupantType,
        email: newEmail.trim() || undefined,
        mobile: newMobile.trim(),
        move_in_date: newMoveInDate,
        notes: changeNotes,
      });
      toast.success(`Occupant changed. Prior history preserved in archive.`);
      setShowChangeModal(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change occupant");
    }
  };

  const handleConfirmDeleteResident = () => {
    if (!deleteConfirmResident) return;
    try {
      DataStorage.deleteResident(deleteConfirmResident.id);
      toast.success(
        `Resident ${deleteConfirmResident.full_name} deleted. All payment transactions and historical records are permanently preserved.`
      );
      setDeleteConfirmResident(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete resident");
    }
  };

  const handleOpenHistory = (flatIdParam: string, flatNum: string) => {
    const hist = DataStorage.getResidentHistory(flatIdParam);
    setHistoryRecords(hist);
    setHistoryFlatNumber(flatNum);
    setShowHistoryModal(true);
  };

  const filteredResidents = residents.filter((res) => {
    const flat = flats.find((f) => f.id === res.flat_id);
    const matchesSearch =
      res.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flat && flat.flat_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      res.mobile.includes(searchTerm) ||
      (res.email && res.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "ALL" || res.resident_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <PageHeader
        title="Resident Master Management"
        subtitle="Manage flat residents, owner/tenant assignments, and historical occupancy tracking"
        breadcrumbs={[{ label: "Masters", href: "/masters/floors" }, { label: "Residents" }]}
        actions={
          <button className="btn btn-primary-custom" onClick={handleOpenAdd}>
            <PlusCircle size={16} />
            <span>Add Resident</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="card-premium mb-4">
        <div className="p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div className="d-flex flex-column flex-sm-row gap-2 flex-grow-1" style={{ maxWidth: "550px" }}>
            <div className="position-relative flex-grow-1">
              <Search size={16} className="position-absolute text-secondary" style={{ top: "10px", left: "12px" }} />
              <input
                type="text"
                className="form-control form-control-sm ps-5 bg-light"
                placeholder="Search by resident name, flat, mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select form-select-sm"
              style={{ width: "170px" }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Resident Types</option>
              <option value="OWNER">Owner Occupied</option>
              <option value="TENANT">Tenant / Rented</option>
            </select>
          </div>

          <div className="small text-secondary">
            Showing <strong className="text-dark">{filteredResidents.length}</strong> Active Residents
          </div>
        </div>
      </div>

      {/* Residents Table */}
      <div className="card-premium">
        <div className="table-responsive">
          <table className="table table-premium align-middle mb-0">
            <thead>
              <tr>
                <th>Resident Name</th>
                <th>Flat &amp; Floor</th>
                <th>Type</th>
                <th>Contact Details</th>
                <th>Payment Status</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-secondary">
                    {searchTerm ? `No residents matching "${searchTerm}"` : "No residents added yet. Click 'Add Resident' to register occupants."}
                  </td>
                </tr>
              ) : (
                filteredResidents.map((res) => {
                  const flat = flats.find((f) => f.id === res.flat_id);
                  const hasDues = (flat?.outstanding_dues || 0) > 0;
                  return (
                    <tr key={res.id}>
                      <td className="fw-bold text-dark">
                        <div className="d-flex align-items-center gap-2">
                          <UserCheck size={18} className="text-primary" />
                          <span>{res.full_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border fw-bold me-1">
                          {flat?.flat_number || "—"}
                        </span>
                        <span className="small text-secondary">{flat?.floor?.floor_name}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            res.resident_type === "OWNER"
                              ? "bg-primary-subtle text-primary border border-primary-subtle"
                              : "bg-warning-subtle text-warning border border-warning-subtle"
                          }`}
                        >
                          {res.resident_type}
                        </span>
                      </td>
                      <td>
                        <div className="small d-flex flex-column gap-0.5">
                          <div className="text-dark d-flex align-items-center gap-1">
                            <Phone size={12} className="text-secondary" />
                            <span>{res.mobile}</span>
                          </div>
                          {res.email && (
                            <div className="text-secondary d-flex align-items-center gap-1">
                              <Mail size={12} />
                              <span>{res.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {hasDues ? (
                          <span className="badge bg-warning-subtle text-warning border px-2 py-1">
                            PENDING (Due ₹{flat?.outstanding_dues?.toLocaleString()})
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border px-2 py-1">
                            NO DUES (Due ₹0)
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status="ACTIVE" />
                      </td>
                      <td className="text-end">
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-outline-warning btn-action-icon"
                            onClick={() => handleOpenChangeOccupant(res)}
                            title="Change Occupant / Tenant (Preserves History)"
                          >
                            <UserPlus size={15} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary btn-action-icon"
                            onClick={() => handleOpenHistory(res.flat_id, flat?.flat_number || "")}
                            title="View Occupancy History"
                          >
                            <History size={15} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger btn-action-icon"
                            onClick={() => setDeleteConfirmResident(res)}
                            title="Delete Resident (Preserves Payment Ledger)"
                          >
                            <Trash2 size={15} />
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

      {/* Add Resident Modal */}
      {showAddModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title fw-bold text-dark">Register New Resident</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
              </div>

              <form onSubmit={handleSaveAdd}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-bold text-dark">
                        Assign to Flat <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={flatId}
                        onChange={(e) => setFlatId(e.target.value)}
                        required
                      >
                        {flats.map((fl) => (
                          <option key={fl.id} value={fl.id}>
                            Flat {fl.flat_number} ({fl.floor?.floor_name || "Floor"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-bold text-dark">
                        Resident Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={residentType}
                        onChange={(e) => setResidentType(e.target.value as "OWNER" | "TENANT")}
                      >
                        <option value="OWNER">OWNER (Self-Occupied)</option>
                        <option value="TENANT">TENANT (Rented)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Kulkarni"
                        required
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-bold text-dark">
                        Mobile Number (10 Digits) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className={`form-control ${mobileError ? "is-invalid" : mobile.length === 10 ? "is-valid" : ""}`}
                        value={mobile}
                        onChange={(e) => handleMobileChange(e.target.value)}
                        placeholder="e.g. 9822012345"
                        maxLength={10}
                        required
                      />
                      {mobileError && <div className="invalid-feedback d-block small">{mobileError}</div>}
                      {!mobileError && mobile.length === 10 && (
                        <div className="valid-feedback d-block small text-success">✓ Valid 10-digit mobile number</div>
                      )}
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-bold text-dark">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        className={`form-control ${emailError ? "is-invalid" : email && !emailError ? "is-valid" : ""}`}
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="e.g. resident@gmail.com"
                      />
                      {emailError && <div className="invalid-feedback d-block small">{emailError}</div>}
                    </div>

                    <div className="col-12">
                      <div className="p-2.5 bg-light rounded-3 border small text-secondary d-flex align-items-center justify-content-between">
                        <span>Initial Maintenance Payment Status:</span>
                        <span className="badge bg-success-subtle text-success border fw-bold">NO DUES (Due ₹0)</span>
                      </div>
                    </div>
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
                    Register Resident
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Occupant / Tenant Modal (Historical Preservation) */}
      {showChangeModal && selectedFlat && currentResident && (
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
                    Change Occupant for Flat {selectedFlat.flat_number}
                  </h5>
                  <span className="small text-muted">
                    Past occupant details will be safely preserved in the audit history.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowChangeModal(false)}
                />
              </div>

              <form onSubmit={handleSaveChangeOccupant}>
                <div className="modal-body p-4">
                  {/* Current Resident Summary Box */}
                  <div className="p-3 bg-light rounded-3 border mb-4">
                    <div className="text-secondary small fw-semibold mb-1">CURRENT OCCUPANT (TO BE ARCHIVED):</div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-bold text-dark fs-6">{currentResident.full_name}</span>{" "}
                        <span className="badge bg-secondary ms-1">{currentResident.resident_type}</span>
                        <div className="small text-muted">
                          Mobile: {currentResident.mobile} | Email: {currentResident.email || "—"} | Move-in:{" "}
                          {currentResident.move_in_date}
                        </div>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold text-dark mb-3">NEW RESIDENT DETAILS</h6>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        New Resident Full Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={newOccupantName}
                        onChange={(e) => setNewOccupantName(e.target.value)}
                        placeholder="e.g. Anand Joshi"
                        required
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        New Resident Type
                      </label>
                      <select
                        className="form-select"
                        value={newOccupantType}
                        onChange={(e) => setNewOccupantType(e.target.value as "OWNER" | "TENANT")}
                      >
                        <option value="TENANT">TENANT / RENTED</option>
                        <option value="OWNER">NEW OWNER</option>
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Mobile Number (10 Digits) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className={`form-control ${newMobileError ? "is-invalid" : newMobile.length === 10 ? "is-valid" : ""}`}
                        value={newMobile}
                        onChange={(e) => handleNewMobileChange(e.target.value)}
                        placeholder="e.g. 9822012345"
                        maxLength={10}
                        required
                      />
                      {newMobileError && <div className="invalid-feedback d-block small">{newMobileError}</div>}
                      {!newMobileError && newMobile.length === 10 && (
                        <div className="valid-feedback d-block small text-success">✓ Valid 10-digit mobile number</div>
                      )}
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        className={`form-control ${newEmailError ? "is-invalid" : newEmail && !newEmailError ? "is-valid" : ""}`}
                        value={newEmail}
                        onChange={(e) => handleNewEmailChange(e.target.value)}
                        placeholder="e.g. newresident@gmail.com"
                      />
                      {newEmailError && <div className="invalid-feedback d-block small">{newEmailError}</div>}
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Move-in Date
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={newMoveInDate}
                        onChange={(e) => setNewMoveInDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Change Reason / Remarks
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={changeNotes}
                        onChange={(e) => setChangeNotes(e.target.value)}
                        placeholder="e.g. Rental agreement renewal, owner shifted"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowChangeModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-warning fw-bold text-dark">
                    Confirm Occupant Change
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Historical Occupancy Modal */}
      {showHistoryModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title fw-bold text-dark">
                  Occupancy &amp; Ownership History &mdash; Flat {historyFlatNumber}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowHistoryModal(false)}
                />
              </div>

              <div className="modal-body p-4">
                {historyRecords.length === 0 ? (
                  <div className="text-center py-4 text-secondary">
                    No previous occupants archived for this flat yet.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th>Previous Resident</th>
                          <th>Type</th>
                          <th>Mobile</th>
                          <th>Tenure</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyRecords.map((rec) => (
                          <tr key={rec.id}>
                            <td className="fw-semibold text-dark">{rec.resident_name}</td>
                            <td>
                              <span className="badge bg-secondary-subtle text-secondary border">
                                {rec.resident_type}
                              </span>
                            </td>
                            <td>{rec.mobile || "—"}</td>
                            <td className="small text-secondary">
                              {formatDate(rec.move_in_date)} &rarr;{" "}
                              {rec.move_out_date ? formatDate(rec.move_out_date) : "Present"}
                            </td>
                            <td className="small text-muted">{rec.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resident Delete Confirmation Modal */}
      {deleteConfirmResident && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 bg-danger-subtle text-danger rounded-circle">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">Delete Resident</h5>
                    <span className="small text-muted">Confirm deletion of active resident</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteConfirmResident(null)}
                />
              </div>

              <div className="modal-body p-4">
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="fw-bold text-dark fs-6">{deleteConfirmResident.full_name}</div>
                  <div className="small text-secondary mt-1">
                    Category: <span className="badge bg-secondary ms-1 me-2">{deleteConfirmResident.resident_type}</span>
                    Mobile: <span className="fw-semibold text-dark">{deleteConfirmResident.mobile}</span>
                  </div>
                </div>

                <div className="alert alert-warning d-flex align-items-start gap-2 mb-3">
                  <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
                  <div className="small">
                    <strong>Operational Change:</strong> This resident will be removed from active status and the assigned flat will be set to <strong>VACANT</strong>.
                  </div>
                </div>

                <div className="alert alert-success d-flex align-items-start gap-2 mb-0">
                  <ShieldCheck size={18} className="text-success flex-shrink-0 mt-0.5" />
                  <div className="small">
                    <strong>Financial History Protected:</strong> All past maintenance receipts, payment ledger entries, and audit transactions associated with this resident and flat are <strong>permanently preserved</strong> in society accounts.
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setDeleteConfirmResident(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-semibold"
                  onClick={handleConfirmDeleteResident}
                >
                  Confirm &amp; Delete Resident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

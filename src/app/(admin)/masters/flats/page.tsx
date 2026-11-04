"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge/StatusBadge";
import { DataStorage } from "@/services/dataStorage";
import { Flat, Floor, Resident } from "@/types/database.types";
import { AmountInput } from "@/components/common/AmountInput/AmountInput";
import { PlusCircle, Search, Edit2, Trash2, Home, CreditCard, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function FlatsPage() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [floorFilter, setFloorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingFlat, setEditingFlat] = useState<Flat | null>(null);

  // Form State
  const [flatNumber, setFlatNumber] = useState("");
  const [floorId, setFloorId] = useState("");
  const [flatType, setFlatType] = useState("2BHK");
  const [status, setStatus] = useState<"OCCUPIED" | "VACANT" | "INACTIVE">("OCCUPIED");
  const [maintenanceOverride, setMaintenanceOverride] = useState<number | "">("");
  const [description, setDescription] = useState("");

  // Dependency & Delete Confirmation Modal State
  const [deleteTargetFlat, setDeleteTargetFlat] = useState<Flat | null>(null);
  const [flatDependencies, setFlatDependencies] = useState<ReturnType<
    typeof DataStorage.checkFlatDependencies
  > | null>(null);

  const loadData = () => {
    setFlats(DataStorage.getFlats());
    setFloors(DataStorage.getFloors());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    if (floors.length === 0) {
      toast.error("Please create at least one Floor first in Masters > Floors!");
      return;
    }
    setEditingFlat(null);
    setFlatNumber("");
    setFloorId(floors[0].id);
    setFlatType("2BHK");
    setStatus("OCCUPIED");
    setMaintenanceOverride("");
    setDescription("");
    setShowModal(true);
  };

  const handleOpenEdit = (flat: Flat) => {
    setEditingFlat(flat);
    setFlatNumber(flat.flat_number);
    setFloorId(flat.floor_id);
    setFlatType(flat.flat_type || "2BHK");
    setStatus(flat.status);
    setMaintenanceOverride(flat.maintenance_override || DataStorage.getFlatMaintenanceRate(flat));
    setDescription(flat.description || "");
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNumber.trim()) {
      toast.error("Please enter a flat number (e.g. A-101)");
      return;
    }
    if (!floorId) {
      toast.error("Please select a floor");
      return;
    }

    try {
      const overrideVal =
        maintenanceOverride && Number(maintenanceOverride) > 0 ? Number(maintenanceOverride) : null;

      if (editingFlat) {
        DataStorage.updateFlat(editingFlat.id, {
          flat_number: flatNumber.toUpperCase().trim(),
          floor_id: floorId,
          flat_type: flatType,
          status,
          maintenance_override: overrideVal,
          description,
        });
        toast.success(`Flat ${flatNumber} updated successfully with maintenance rate ₹${overrideVal || "Standard"}`);
      } else {
        DataStorage.addFlat({
          flat_number: flatNumber.toUpperCase().trim(),
          floor_id: floorId,
          flat_type: flatType,
          area_sqft: 0,
          maintenance_override: overrideVal,
          status,
          description,
        });
        toast.success(`Flat ${flatNumber} created successfully`);
      }
      setShowModal(false);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save flat");
    }
  };

  const handleInitiateDelete = (flat: Flat) => {
    try {
      const deps = DataStorage.checkFlatDependencies(flat.id);
      setDeleteTargetFlat(flat);
      setFlatDependencies(deps);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to check flat dependencies");
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetFlat) return;
    try {
      DataStorage.deleteFlat(deleteTargetFlat.id);
      toast.success(
        `Flat ${deleteTargetFlat.flat_number} deleted. All historical payment records permanently preserved.`
      );
      setDeleteTargetFlat(null);
      setFlatDependencies(null);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Cannot delete flat");
    }
  };

  const filteredFlats = flats.filter((flat) => {
    const matchesSearch =
      flat.flat_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flat.current_resident && flat.current_resident.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFloor = floorFilter === "ALL" || flat.floor_id === floorFilter;
    const matchesStatus = statusFilter === "ALL" || flat.status === statusFilter;

    return matchesSearch && matchesFloor && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Flat Master Management"
        subtitle="Manage flat registry, floor allocations, occupancy, and specific maintenance rates"
        breadcrumbs={[{ label: "Masters", href: "/masters/floors" }, { label: "Flats" }]}
        actions={
          <button className="btn btn-primary-custom" onClick={handleOpenAdd}>
            <PlusCircle size={16} />
            <span>Add New Flat</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="card-premium mb-4">
        <div className="p-3 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div className="d-flex flex-column flex-sm-row gap-2 flex-grow-1" style={{ maxWidth: "700px" }}>
            <div className="position-relative flex-grow-1">
              <Search size={16} className="position-absolute text-secondary" style={{ top: "10px", left: "12px" }} />
              <input
                type="text"
                className="form-control form-control-sm ps-5 bg-light"
                placeholder="Search flat number or resident name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select form-select-sm"
              style={{ width: "180px" }}
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="OCCUPIED">OCCUPIED</option>
              <option value="VACANT">VACANT</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="small text-secondary text-end">
            Showing <strong className="text-dark">{filteredFlats.length}</strong> of{" "}
            <strong className="text-dark">{flats.length}</strong> Flats
          </div>
        </div>
      </div>

      {/* Flats Table */}
      <div className="card-premium">
        <div className="table-responsive">
          <table className="table table-premium align-middle mb-0">
            <thead>
              <tr>
                <th>Flat #</th>
                <th>Floor</th>
                <th>Flat Type</th>
                <th>Current Resident</th>
                <th>Maintenance</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-secondary">
                    No flats found matching criteria
                  </td>
                </tr>
              ) : (
                filteredFlats.map((flat) => (
                  <tr key={flat.id}>
                    <td className="fw-bold text-dark fs-6">
                      <div className="d-flex align-items-center gap-2">
                        <Home size={17} className="text-primary" />
                        <span>{flat.flat_number}</span>
                      </div>
                    </td>
                    <td className="text-secondary small fw-medium">{flat.floor?.floor_name || "—"}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{flat.flat_type}</span>
                    </td>
                    <td>
                      {flat.current_resident ? (
                        <div>
                          <div className="fw-semibold text-dark">{flat.current_resident.full_name}</div>
                          <span
                            className={`badge ${
                              flat.current_resident.resident_type === "OWNER"
                                ? "bg-primary-subtle text-primary"
                                : "bg-warning-subtle text-warning border"
                            }`}
                            style={{ fontSize: "0.68rem" }}
                          >
                            {flat.current_resident.resident_type}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted small fst-italic">Vacant / Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className="text-dark fw-semibold">₹{DataStorage.getFlatMaintenanceRate(flat).toLocaleString()}</span>
                      <span className="small text-muted"> / mo</span>
                    </td>
                    <td>
                      {(flat.outstanding_dues || 0) > 0 ? (
                        <span className="fw-bold text-danger">₹{flat.outstanding_dues?.toLocaleString()} Due</span>
                      ) : (
                        <span className="text-success small fw-semibold">₹0 (No Dues)</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={flat.status} />
                    </td>
                    <td className="text-end">
                      <div className="action-buttons">
                        <Link
                          href={`/maintenance`}
                          className="btn btn-sm btn-outline-primary btn-action-icon"
                          title="View Invoices & Collect Payment"
                        >
                          <CreditCard size={15} />
                        </Link>
                        <button
                          className="btn btn-sm btn-outline-secondary btn-action-icon"
                          onClick={() => handleOpenEdit(flat)}
                          title="Edit Flat"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger btn-action-icon"
                          onClick={() => handleInitiateDelete(flat)}
                          title="Delete Flat"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Flat Modal */}
      {showModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <h5 className="modal-title fw-bold text-dark">
                  {editingFlat ? `Edit Flat ${editingFlat.flat_number}` : "Add New Flat"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Flat Number
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={flatNumber}
                        onChange={(e) => setFlatNumber(e.target.value)}
                        placeholder="e.g. A-101"
                        required
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Floor
                      </label>
                      <select
                        className="form-select"
                        value={floorId}
                        onChange={(e) => setFloorId(e.target.value)}
                        required
                      >
                        {floors.map((fl) => (
                          <option key={fl.id} value={fl.id}>
                            {fl.floor_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Flat Type
                      </label>
                      <select
                        className="form-select"
                        value={flatType}
                        onChange={(e) => setFlatType(e.target.value)}
                      >
                        <option value="1BHK">1 BHK</option>
                        <option value="2BHK">2 BHK</option>
                        <option value="3BHK">3 BHK</option>
                        <option value="PENTHOUSE">Penthouse</option>
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Occupancy Status
                      </label>
                      <select
                        className="form-select"
                        value={status}
                        onChange={(e) =>
                          setStatus(e.target.value as "OCCUPIED" | "VACANT" | "INACTIVE")
                        }
                      >
                        <option value="OCCUPIED">OCCUPIED</option>
                        <option value="VACANT">VACANT</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-secondary">
                        Monthly Maintenance Rate (₹)
                      </label>
                      <AmountInput
                        value={maintenanceOverride}
                        onChange={(val) => setMaintenanceOverride(val)}
                        placeholder="Standard rate applied if empty"
                        className="form-control"
                        min={100}
                      />
                      <small className="text-muted">
                        Custom override for this flat (e.g. ₹1,500 for tenant)
                      </small>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary">
                        Description / Notes
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Corner flat with terrace access"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom">
                    {editingFlat ? "Save Changes" : "Create Flat"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Flat Deletion Dependency & Protection Modal */}
      {deleteTargetFlat && flatDependencies && (
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
                    <h5 className="modal-title fw-bold text-dark mb-0">
                      Delete Flat: {deleteTargetFlat.flat_number}
                    </h5>
                    <span className="small text-muted">Data dependency &amp; historical ledger check</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setDeleteTargetFlat(null);
                    setFlatDependencies(null);
                  }}
                />
              </div>

              <div className="modal-body p-4">
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold text-dark fs-6">Flat {deleteTargetFlat.flat_number}</span>
                    <span className="badge bg-secondary">{deleteTargetFlat.flat_type}</span>
                  </div>
                  <div className="small text-secondary">
                    Floor: <span className="fw-semibold text-dark">{deleteTargetFlat.floor?.floor_name || "—"}</span>
                  </div>
                  {flatDependencies.resident ? (
                    <div className="small text-secondary mt-1">
                      Current Resident: <span className="fw-semibold text-dark">{flatDependencies.resident.full_name}</span>{" "}
                      ({flatDependencies.resident.resident_type})
                    </div>
                  ) : (
                    <div className="small text-muted mt-1 fst-italic">Currently Vacant</div>
                  )}
                </div>

                {flatDependencies.resident && (
                  <div className="alert alert-warning d-flex align-items-start gap-2 mb-3">
                    <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
                    <div className="small">
                      <strong>Occupant Notice:</strong> Active resident{" "}
                      <strong>{flatDependencies.resident.full_name}</strong> will be unassigned and safely archived to resident history.
                    </div>
                  </div>
                )}

                <div className="alert alert-success d-flex align-items-start gap-2 mb-3">
                  <ShieldCheck size={18} className="text-success flex-shrink-0 mt-0.5" />
                  <div className="small">
                    <strong>Financial Records Permanently Preserved:</strong> This flat has{" "}
                    <strong>{flatDependencies.paidPaymentsCount} paid payment records</strong> totaling{" "}
                    <strong>₹{flatDependencies.paidPaymentsTotal.toLocaleString()}</strong>.
                    All payment transaction receipts and ledger entries will remain <strong>permanently intact</strong>.
                  </div>
                </div>

                {flatDependencies.unpaidInvoicesCount > 0 && (
                  <div className="small text-muted mb-0">
                    {flatDependencies.unpaidInvoicesCount} unpaid pending invoice(s) will be cleared upon flat deletion.
                  </div>
                )}
              </div>

              <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setDeleteTargetFlat(null);
                    setFlatDependencies(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-semibold"
                  onClick={handleConfirmDelete}
                >
                  Confirm &amp; Delete Flat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

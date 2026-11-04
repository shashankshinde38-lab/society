"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { DataStorage } from "@/services/dataStorage";
import { Floor } from "@/types/database.types";
import { PlusCircle, Search, Edit2, Trash2, Layers, Building, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function FloorsPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  // Form State
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [description, setDescription] = useState("");

  // Dependency & Delete Confirmation Modal State
  const [deleteTargetFloor, setDeleteTargetFloor] = useState<Floor | null>(null);
  const [floorDependencies, setFloorDependencies] = useState<ReturnType<
    typeof DataStorage.checkFloorDependencies
  > | null>(null);

  const loadFloors = () => {
    setFloors(DataStorage.getFloors());
  };

  useEffect(() => {
    loadFloors();
  }, []);

  const getAutoFloorName = (num: number) => {
    if (num === 0) return "Ground Floor";
    const suffix = num === 1 ? "st" : num === 2 ? "nd" : num === 3 ? "rd" : "th";
    return `${num}${suffix} Floor`;
  };

  const handleOpenAdd = () => {
    setEditingFloor(null);
    const nextNum = floors.length > 0 ? Math.max(...floors.map((f) => f.floor_number)) + 1 : 1;
    setFloorNumber(nextNum);
    setDescription("");
    setShowModal(true);
  };

  const handleOpenEdit = (floor: Floor) => {
    setEditingFloor(floor);
    setFloorNumber(floor.floor_number);
    setDescription(floor.description || "");
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const autoName = getAutoFloorName(Number(floorNumber));

    try {
      if (editingFloor) {
        DataStorage.updateFloor(editingFloor.id, {
          floor_number: Number(floorNumber),
          floor_name: autoName,
          description,
          status: "ACTIVE",
        });
        toast.success("Floor updated successfully");
      } else {
        DataStorage.addFloor({
          floor_number: Number(floorNumber),
          floor_name: autoName,
          description,
          status: "ACTIVE",
          is_archived: false,
        });
        toast.success("New floor added successfully");
      }
      setShowModal(false);
      loadFloors();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save floor");
    }
  };

  const handleInitiateDelete = (floor: Floor) => {
    const deps = DataStorage.checkFloorDependencies(floor.id);
    setDeleteTargetFloor(floor);
    setFloorDependencies(deps);
  };

  const handleConfirmDelete = (cascade: boolean) => {
    if (!deleteTargetFloor) return;
    try {
      DataStorage.deleteFloor(deleteTargetFloor.id, cascade);
      toast.success(
        `${deleteTargetFloor.floor_name} deleted successfully. All financial records permanently preserved.`
      );
      setDeleteTargetFloor(null);
      setFloorDependencies(null);
      loadFloors();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Cannot delete floor");
    }
  };

  const filteredFloors = floors.filter(
    (f) =>
      f.floor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <PageHeader
        title="Floor Master Management"
        subtitle="Configure society floors, wing levels, and monitor flat distribution"
        breadcrumbs={[{ label: "Masters", href: "/masters/floors" }, { label: "Floors" }]}
        actions={
          <button className="btn btn-primary-custom" onClick={handleOpenAdd}>
            <PlusCircle size={16} />
            <span>Add New Floor</span>
          </button>
        }
      />

      {/* Top Filter and Search Bar */}
      <div className="card-premium mb-4">
        <div className="p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div className="position-relative" style={{ maxWidth: "340px", width: "100%" }}>
            <Search size={16} className="position-absolute text-secondary" style={{ top: "10px", left: "12px" }} />
            <input
              type="text"
              className="form-control form-control-sm ps-5 bg-light"
              placeholder="Search floors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center gap-2 small text-secondary">
            <span>Total Floors: <strong className="text-dark">{floors.length}</strong></span>
            <span>&bull;</span>
            <span>Total Flats: <strong className="text-dark">{floors.reduce((sum, f) => sum + (f.total_flats || 0), 0)}</strong></span>
          </div>
        </div>
      </div>

      {/* Floor Table */}
      <div className="card-premium">
        <div className="table-responsive">
          <table className="table table-premium align-middle mb-0">
            <thead>
              <tr>
                <th>Floor #</th>
                <th>Floor Name</th>
                <th>Description / Range</th>
                <th>Total Flats</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFloors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-secondary">
                    {searchTerm ? `No floors matching "${searchTerm}"` : "No floors added yet. Click 'Add New Floor' to get started."}
                  </td>
                </tr>
              ) : (
                filteredFloors.map((floor) => (
                  <tr key={floor.id}>
                    <td className="fw-bold text-primary">#{floor.floor_number}</td>
                    <td className="fw-semibold text-dark">
                      <div className="d-flex align-items-center gap-2">
                        <Layers size={16} className="text-secondary" />
                        <span>{floor.floor_name}</span>
                      </div>
                    </td>
                    <td className="text-secondary small">{floor.description || "—"}</td>
                    <td>
                      <span className="badge bg-light text-dark border px-2 py-1">
                        <Building size={13} className="me-1 text-primary" />
                        {floor.total_flats || 0} Flats
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-outline-secondary btn-action-icon"
                          onClick={() => handleOpenEdit(floor)}
                          title="Edit Floor"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger btn-action-icon"
                          onClick={() => handleInitiateDelete(floor)}
                          title="Delete Floor"
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

      {/* Add / Edit Modal */}
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
                  {editingFloor ? "Edit Floor" : "Add New Floor"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Floor Number (Order)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={floorNumber}
                      onChange={(e) => setFloorNumber(Number(e.target.value))}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      required
                      min={0}
                    />
                    <div className="form-text small">
                      Will be registered as: <strong>{getAutoFloorName(Number(floorNumber))}</strong>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-secondary">
                      Description / Range (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Flats 101 to 104"
                    />
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
                    {editingFloor ? "Save Changes" : "Create Floor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floor Deletion Dependency & Protection Modal */}
      {deleteTargetFloor && floorDependencies && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom px-4 pt-4 pb-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 bg-danger-subtle text-danger rounded-circle">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">
                      Delete Floor: {deleteTargetFloor.floor_name}
                    </h5>
                    <span className="small text-muted">Data dependency &amp; historical record check</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setDeleteTargetFloor(null);
                    setFloorDependencies(null);
                  }}
                />
              </div>

              <div className="modal-body p-4">
                {floorDependencies.flatCount > 0 ? (
                  <div>
                    <div className="alert alert-warning d-flex align-items-start gap-2 mb-3">
                      <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Associated Data Detected:</strong> This floor currently contains{" "}
                        <strong>{floorDependencies.flatCount} flat(s)</strong> and{" "}
                        <strong>{floorDependencies.residentCount} active resident(s)</strong>.
                      </div>
                    </div>

                    <div className="p-3 bg-light rounded-3 border mb-3">
                      <div className="small fw-semibold text-secondary mb-1">ASSOCIATED FLATS ON THIS FLOOR:</div>
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        {floorDependencies.flatNumbers.map((num) => (
                          <span key={num} className="badge bg-white text-dark border">
                            Flat {num}
                          </span>
                        ))}
                      </div>

                      {floorDependencies.residentNames.length > 0 && (
                        <div>
                          <div className="small fw-semibold text-secondary mb-1">ACTIVE RESIDENTS:</div>
                          <div className="small text-dark fw-medium">
                            {floorDependencies.residentNames.join(", ")}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="alert alert-success d-flex align-items-start gap-2 mb-3">
                      <ShieldCheck size={20} className="text-success flex-shrink-0 mt-0.5" />
                      <div className="small">
                        <strong>Financial History 100% Protected:</strong> This floor has{" "}
                        <strong>{floorDependencies.paidPaymentCount} paid payment transactions</strong>{" "}
                        totaling <strong>₹{floorDependencies.paidPaymentTotal.toLocaleString()}</strong>.
                        All receipts and financial records are <strong>permanently locked and preserved</strong>.
                      </div>
                    </div>

                    <p className="small text-muted mb-0">
                      If you proceed with cascading deletion, all {floorDependencies.flatCount} flats will be
                      removed and active residents will be archived. All payment records remain safe in the ledger.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-dark mb-0">
                      Are you sure you want to delete <strong>{deleteTargetFloor.floor_name}</strong>?
                    </p>
                    <p className="small text-muted mb-0">No flats are linked to this floor. This action is safe.</p>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top px-4 py-3 bg-light rounded-bottom-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setDeleteTargetFloor(null);
                    setFloorDependencies(null);
                  }}
                >
                  Cancel
                </button>

                {floorDependencies.flatCount > 0 ? (
                  <button
                    type="button"
                    className="btn btn-danger fw-semibold"
                    onClick={() => handleConfirmDelete(true)}
                  >
                    Confirm Cascading Delete ({floorDependencies.flatCount} Flats)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger fw-semibold"
                    onClick={() => handleConfirmDelete(false)}
                  >
                    Delete Floor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

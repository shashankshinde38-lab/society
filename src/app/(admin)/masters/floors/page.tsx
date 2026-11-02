"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader/PageHeader";
import { DataStorage } from "@/services/dataStorage";
import { Floor } from "@/types/database.types";
import { PlusCircle, Search, Edit2, Trash2, Layers, Building } from "lucide-react";
import { toast } from "sonner";

export default function FloorsPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  // Form State
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [description, setDescription] = useState("");

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

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        DataStorage.deleteFloor(id);
        toast.success(`${name} deleted successfully`);
        loadFloors();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Cannot delete floor");
      }
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
                      <div className="d-inline-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-secondary p-1"
                          onClick={() => handleOpenEdit(floor)}
                          title="Edit Floor"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger p-1"
                          onClick={() => handleDelete(floor.id, floor.floor_name)}
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
    </div>
  );
}

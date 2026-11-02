import React from "react";

export type StatusType =
  | "PAID"
  | "UNPAID"
  | "PARTIAL"
  | "ADVANCE"
  | "OVERDUE"
  | "ACTIVE"
  | "INACTIVE"
  | "OCCUPIED"
  | "VACANT"
  | "PENDING"
  | "NO_DUES";

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const normStatus = status?.toUpperCase();
  const displayLabel = label || (normStatus === "NO_DUES" ? "No Dues" : status);

  let badgeClass = "badge-partial";
  let dotColor = "#f59e0b";

  switch (normStatus) {
    case "PAID":
    case "ACTIVE":
    case "OCCUPIED":
    case "NO_DUES":
    case "CLEARED":
      badgeClass = "badge-paid";
      dotColor = "#10b981";
      break;
    case "UNPAID":
    case "INACTIVE":
    case "OVERDUE":
      badgeClass = "badge-unpaid";
      dotColor = "#ef4444";
      break;
    case "PARTIAL":
    case "PENDING":
      badgeClass = "badge-partial";
      dotColor = "#f59e0b";
      break;
    case "ADVANCE":
    case "VACANT":
      badgeClass = "badge-advance";
      dotColor = "#8b5cf6";
      break;
    default:
      badgeClass = "badge-partial";
      dotColor = "#64748b";
  }

  return (
    <span className={`badge-status ${badgeClass}`}>
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: dotColor,
        }}
      />
      {displayLabel}
    </span>
  );
};

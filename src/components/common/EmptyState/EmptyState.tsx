import React from "react";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center my-4">
      <div
        className="d-flex align-items-center justify-content-center bg-light rounded-circle text-secondary mb-3"
        style={{ width: "64px", height: "64px" }}
      >
        {icon || <FolderOpen size={30} />}
      </div>
      <h5 className="fw-bold text-dark mb-1">{title}</h5>
      {description && (
        <p className="text-secondary small mb-3" style={{ maxWidth: "420px" }}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

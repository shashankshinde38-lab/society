import React from "react";

interface LoadingProps {
  message?: string;
  fullPage?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = "Loading data...",
  fullPage = false,
}) => {
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
      <div
        className="spinner-border text-primary mb-3"
        role="status"
        style={{ width: "2.5rem", height: "2.5rem" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-secondary small fw-medium mb-0">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="position-fixed inset-0 d-flex align-items-center justify-content-center bg-white bg-opacity-75"
        style={{ top: 0, left: 0, right: 0, bottom: 0, zIndex: 1060 }}
      >
        {content}
      </div>
    );
  }

  return content;
};

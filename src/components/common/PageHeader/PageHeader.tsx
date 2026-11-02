import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
}) => {
  return (
    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
      <div>
        {breadcrumbs.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-1">
            <ol className="breadcrumb mb-0 small">
              <li className="breadcrumb-item">
                <Link href="/dashboard" className="text-secondary text-decoration-none">
                  Home
                </Link>
              </li>
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li
                    key={idx}
                    className={`breadcrumb-item ${isLast ? "active text-dark fw-semibold" : ""}`}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {crumb.href && !isLast ? (
                      <Link href={crumb.href} className="text-secondary text-decoration-none">
                        {crumb.label}
                      </Link>
                    ) : (
                      crumb.label
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        <h1 className="h3 fw-bold text-dark mb-1">{title}</h1>
        {subtitle && <p className="text-secondary small mb-0">{subtitle}</p>}
      </div>

      {actions && <div className="d-flex align-items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};

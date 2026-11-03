"use client";

import React from "react";

interface AmountInputProps {
  value: number | string | undefined | null;
  onChange: (value: number | "") => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: string | number;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  autoFocus?: boolean;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  placeholder = "Enter Amount",
  min = 0,
  max,
  step = "any",
  className = "form-control",
  disabled = false,
  required = false,
  id,
  name,
  autoFocus,
}) => {
  // Display empty string if value is null, undefined, or empty string.
  // If value is 0 and empty was intended, show empty.
  const displayValue =
    value === undefined || value === null || value === ""
      ? ""
      : String(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // If completely empty, propagate empty string so placeholder displays
    if (raw === "") {
      onChange("");
      return;
    }

    // Strip negative sign if min is >= 0
    if (min >= 0 && raw.startsWith("-")) {
      raw = raw.replace("-", "");
    }

    // Fix leading zero bug: If user types '0100', strip leading zeros before digits (allow '0.' for decimals)
    if (raw.length > 1 && raw.startsWith("0") && raw[1] !== ".") {
      raw = raw.replace(/^0+/, "");
      if (raw === "") raw = "0";
    }

    // Only allow valid numeric / decimal patterns
    if (!/^\d*\.?\d*$/.test(raw)) {
      return;
    }

    if (raw === "" || raw === ".") {
      onChange("");
      return;
    }

    const num = parseFloat(raw);
    if (!isNaN(num)) {
      if (max !== undefined && num > max) {
        onChange(max);
        return;
      }
      onChange(num);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      id={id}
      name={name}
      className={className}
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoFocus={autoFocus}
      autoComplete="off"
    />
  );
};


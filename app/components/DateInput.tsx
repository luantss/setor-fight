"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoToDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function displayToIso(display: string): string {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function autoFormat(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DateInputProps {
  /** Name used on the hidden YYYY-MM-DD field submitted in native forms */
  name: string;
  id?: string;
  /** Default value in YYYY-MM-DD format */
  defaultValue?: string;
  required?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component — for use in native HTML forms (no React Hook Form)
// ---------------------------------------------------------------------------

export default function DateInput({
  id,
  name,
  defaultValue,
  required,
  className,
}: DateInputProps) {
  const [display, setDisplay] = useState(isoToDisplay(defaultValue ?? ""));

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        value={display}
        maxLength={10}
        required={required}
        onChange={(e) => setDisplay(autoFormat(e.target.value))}
        className={className}
        autoComplete="bday"
      />
      {/* Hidden field carries YYYY-MM-DD to the server action */}
      <input type="hidden" name={name} value={displayToIso(display)} />
    </>
  );
}

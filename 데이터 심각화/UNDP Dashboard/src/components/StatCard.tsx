"use client";

import React from "react";

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  accentBg?: string;
  accentIcon?: React.ReactNode;
  loading?: boolean;
  /** NEW: override the value color for one-off cases */
  valueColor?: string;
  /** (optional) If you prefer Tailwind classes instead of inline color */
  valueClassName?: string;
};

export function StatCard({
  label,
  value,
  sub,
  accentBg = "#0468B1",
  accentIcon,
  loading,
  valueColor,
  valueClassName,
}: StatCardProps) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col"
      style={{
        backgroundColor: "var(--card-bg-color)",
        borderColor: "var(--card-border-weak)",
        color: "var(--text-primary)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-8 w-8 rounded-md flex items-center justify-center text-white text-[0.7rem] font-semibold shrink-0"
          style={{ backgroundColor: accentBg }}
        >
          {accentIcon}
        </div>

        <div className="flex-1 flex flex-col">
          <span className="type-kpi-label" style={{ color: "var(--text-secondary)" }}>
            {label}
          </span>

          <span
            className={`type-kpi-value ${valueClassName ?? ""}`}
            style={{
              color: valueColor ?? "var(--text-primary)",
            }}
          >
            {loading ? "…" : value}
          </span>

          {sub ? (
            <span className="mt-1 text-[11px] leading-snug" style={{ color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {loading ? "…" : sub}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

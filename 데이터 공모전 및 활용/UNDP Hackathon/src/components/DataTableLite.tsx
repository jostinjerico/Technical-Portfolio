"use client";

import React from "react";

type ColumnDef<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
};

export function DataTableLite<T>({
  columns,
  rows,
  rowKey,
  maxHeight = 220,
}: {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T, idx: number) => string | number;
  maxHeight?: number;
}) {
  return (
    <div
      className="overflow-x-auto overflow-y-auto text-[12px] leading-tight border-y"
      style={{
        maxHeight,
        borderColor: "var(--card-border-weak)",
      }}
    >
      <table className="min-w-full text-left" style={{ color: "var(--text-primary)"}}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="py-2 pr-4 text-left type-table-header sticky top-0 z-20"
                style={{
                  color: "var(--text-primary)",
                  fontWeight: 400,
                  background: "var(--page-bg-color)",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={rowKey(row, idx)}
              className="border-t text-left"
              style={{ borderColor: "var(--card-border-weak)" }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="py-2 pr-4 align-top text-left"
                  style={{
                    color: "var(--text-primary)",
                    fontWeight:
                      col.key === "donor_name" || col.key === "country" ? 500 : 400,
                  }}
                >
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

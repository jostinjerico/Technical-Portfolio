"use client";

import React from "react";
import { highlightInsight } from "@/lib/highlight";

type ChartCardProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  insight?: string | React.ReactNode;
  insightColor?: string;
  loading?: boolean;
  empty?: boolean;
  children?: React.ReactNode;
  /** tighter paddings on header/body */
  dense?: boolean;
  /** override body min-height (px). Defaults: 180 (dense) / 220 (normal) */
  minH?: number;
  /** turn polarity word highlighting on/off when `insight` is a string */
  includePolarity?: boolean;
};

export function ChartCard({
  title,
  subtitle,
  insight,
  insightColor,
  loading,
  empty,
  children,
  dense = false,
  minH,
  includePolarity = true,
}: ChartCardProps) {
  const bodyMinH = typeof minH === "number" ? minH : dense ? 180 : 220;

  // If `insight` is a string, highlight it here. If it’s already nodes, render as-is.
  const insightNode = React.useMemo(() => {
    if (!insight) return null;
    if (typeof insight === "string") {
      return highlightInsight(insight, { includePolarity });
    }
    return insight;
  }, [insight, includePolarity]);

  return (
    <section
      className="rounded-xl border flex flex-col"
      style={{
        backgroundColor: "var(--card-bg-color)",
        borderColor: "var(--card-border-weak)",
        boxShadow: "var(--card-shadow, 0 20px 60px rgba(0,0,0,0.08))",
      }}
    >
      {(title || subtitle) && (
        <div className={dense ? "px-3 pt-3 pb-1 text-center" : "px-4 pt-4 pb-2 text-center"}>
          {title ? (
            <h2
              className="font-bold"
              style={{ fontSize: "1.2rem", fontWeight: 600, lineHeight: 1.3, color: "var(--text-primary)" }}
            >
              {title}
            </h2>
          ) : null}

          {subtitle ? (
            <p
              className={dense ? "mt-1 mx-auto max-w-2xl text-[11px]" : "mt-1 mx-auto max-w-2xl text-[11px]"}
              style={{ color: "var(--text-primary)", lineHeight: 1.3 }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      )}

      <div className={dense ? "px-3 pb-3" : "px-4 pb-4"} style={{ minHeight: bodyMinH }}>
        {loading ? (
          <div
            className="w-full h-full flex items-center justify-center text-[12px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Loading data…
          </div>
        ) : empty ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center text-center text-[12px] leading-snug px-4"
            style={{ color: "var(--text-secondary)" }}
          >
            <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>No data available</div>
            <div className="mt-1 max-w-sm">
              This view didn’t return records with the current filters / slice.
            </div>
          </div>
        ) : (
          <div className="w-full h-full">{children}</div>
        )}
      </div>

      {insightNode ? (
        <div
          className="px-4 pb-4 text-[15px] font-bold leading-relaxed text-center border-t"
          style={{
            // only top border; let child spans control their own colors
            borderTop: "1px solid rgb(var(--sem-integrated) / 0.45)",
            fontWeight: 500,
            ...(insightColor ? { color: insightColor } : {}), // don't set a color unless requested
          }}
        >
          {insightNode}
        </div>
      ) : null}
    </section>
  );
}

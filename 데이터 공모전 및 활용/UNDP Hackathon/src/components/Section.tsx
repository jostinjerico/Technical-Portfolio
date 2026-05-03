"use client";

import React from "react";
import { SectionHeader } from "./SectionHeader";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  /** If true, don't wrap with an inner container — match the parent's width */
  matchParentWidth?: boolean;
};

export function Section({
  title,
  subtitle,
  children,
  className,
  matchParentWidth = false,
}: Props) {
  // Use the same max-width as the parent container when requested
  const wrapperClass = matchParentWidth
    ? "w-full" // no inner container; no extra side padding
    : "container mx-auto px-4 md:px-8 lg:px-16";

  return (
    <section className={`band-surface py-8 ${className ?? ""}`}>
      <div className={wrapperClass}>
        <div
          className="panel px-4 md:px-6 py-6 rounded-xl border"
          style={{
            backgroundColor: "var(--card-bg-color)",
            borderColor: "var(--card-border-weak)",
            boxShadow: "var(--card-shadow-lg)",
          }}
        >
          <SectionHeader title={title} subtitle={subtitle} />
          {children}
        </div>
      </div>
    </section>
  );
}

"use client";

import React from "react";

type Props = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
  level?: 2 | 3 | 4;        // which heading tag to use
  className?: string;
};

export function SectionHeader({
  title,
  subtitle,
  align = "center",
  level = 2,
  className,
}: Props) {
  const Tag = (`h${level}` as React.ElementType);
  return (
    <header className={`${align === "center" ? "text-center" : ""} mb-6 ${className ?? ""}`}>
      <Tag className="type-section-title">{title}</Tag>
      {subtitle ? <p className="type-section-sub mt-1">{subtitle}</p> : null}
    </header>
  );
}
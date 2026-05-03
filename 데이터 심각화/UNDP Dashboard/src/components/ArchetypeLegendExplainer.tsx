"use client";
import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

type Item = { name: string; donors?: number };

function colorForArchetype(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("climate")) return "var(--semantic-climateOnly)";
  if (n.includes("gender"))  return "var(--semantic-genderOnly)";
  if (n.includes("integrat")) return "var(--semantic-integrated)";
  return "var(--text-secondary)"; // sequential/other
}

export function ArchetypeLegendExplainer({
  items,
}: { items: Item[] }) {
  const [openFor, setOpenFor] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpenFor(null);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const explain = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("integrat")) return "Funds projects with both gender and climate tags.";
    if (n.includes("climate"))  return "Climate-tagged projects; no gender tag.";
    if (n.includes("gender"))   return "Gender-tagged projects; no climate tag.";
    return "Both themes exist in portfolio but not in the same project, or general development.";
  };

  return (
    <div
      ref={wrapRef}
      className="rounded-md border px-2 py-2"
      style={{ backgroundColor: "var(--card-bg-color)", borderColor: "var(--card-border-weak)" }}
    >
      <div className="flex items-center flex-wrap gap-2">
        <span style={{ color: "var(--text-secondary)" }}>
            Archetype Explainer - click on each for more information : </span>
        {items.map((it) => {
          const color = colorForArchetype(it.name);
          const isOpen = openFor === it.name;
          return (
            <div key={it.name} className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setOpenFor(isOpen ? null : it.name); }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] border"
                style={{
                  borderColor: "var(--card-border-weak)",
                  backgroundColor: "transparent",
                  color: "var(--text-primary)",
                }}
                title={`What is ${it.name}?`}
              >
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                <span className="font-medium">{it.name}</span>
                {typeof it.donors === "number" && (
                  <span style={{ color: "var(--text-secondary)" }}>({it.donors})</span>
                )}
              </button>

              {isOpen && (
                <div
                  className="absolute z-50 mt-1 w-60 rounded-md border p-2 text-[11px] shadow"
                  style={{
                    backgroundColor: "var(--page-bg-color)",
                    borderColor: "var(--card-border-weak)",
                    boxShadow: "var(--card-shadow-lg)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm mt-[3px]" style={{ backgroundColor: color }} />
                    <div>
                      <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {it.name}
                      </div>
                      <div style={{ color: "var(--text-primary)", fontWeight:300 }}>
                        {explain(it.name)}
                      </div>
                    </div>
                    <button
                      onClick={() => setOpenFor(null)}
                      className="ml-auto"
                      aria-label="Close"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

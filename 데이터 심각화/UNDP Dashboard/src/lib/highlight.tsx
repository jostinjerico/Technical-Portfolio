import React from "react";
import {
  ARCH_COLORS,
  FOCUS_PHRASES,
  KEYWORD_COLORS,
  POLARITY_COLORS,
} from "@/lib/colors";

/* helpers */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function makeRegex(keys: string[], wholeWord = true) {
  const pieces = keys.map(esc).sort((a, b) => b.length - a.length);
  return new RegExp(wholeWord ? `\\b(${pieces.join("|")})\\b` : `(${pieces.join("|")})`, "gi");
}
function lower(obj: Record<string, string>) {
  const o: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) o[k.toLowerCase()] = v;
  return o;
}

/** Core splitter */
function highlightTokens(
  text: string,
  palette: Record<string, string>,
  { wholeWord = true }: { wholeWord?: boolean } = {}
): React.ReactNode[] {
  if (!text) return [];
  const keys = Object.keys(palette);
  if (!keys.length) return [text];

  const rx = makeRegex(keys, wholeWord);
  const parts = text.split(rx);

  return parts.map((part, i) => {
    const key = part?.toLowerCase();
    const color = palette[key];
    if (!color) return <span key={i}>{part}</span>;

    // If this is a polarity color, prefer classes so we can force it via CSS
    const cls =
      color.includes("--semantic-up") ? "polarity-up" :
      color.includes("--semantic-down") ? "polarity-down" :
      undefined;

    return cls
      ? <span key={i} className={cls}>{part}</span>
      : <span key={i} style={{ color }}>{part}</span>;
  });
}

function applyHighlight(
  input: React.ReactNode,
  palette: Record<string, string>,
  opts?: { wholeWord?: boolean }
): React.ReactNode[] {
  const arr = Array.isArray(input) ? (input as React.ReactNode[]) : [input];
  const out: React.ReactNode[] = [];
  for (const node of arr) {
    if (typeof node === "string") out.push(...highlightTokens(node, palette, opts));
    else out.push(node);
  }
  return out;
}

/** Focus phrases (punctuation tolerant) → archetypes/keywords → polarity */
export function highlightInsight(
  text?: string,
  opts: { includePolarity?: boolean } = { includePolarity: true }
) {
  if (!text) return null;

  let nodes: React.ReactNode[] = applyHighlight(text, lower(FOCUS_PHRASES), { wholeWord: true });
  nodes = applyHighlight(nodes, lower({ ...ARCH_COLORS, ...KEYWORD_COLORS }), { wholeWord: true });

  if (opts.includePolarity) {
    // IMPORTANT: punctuation tolerant so 'rose…', 'fell,' still match
    nodes = applyHighlight(nodes, lower(POLARITY_COLORS), { wholeWord: false });
  }
  return <>{nodes}</>;
}

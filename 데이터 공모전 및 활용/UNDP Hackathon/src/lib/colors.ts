// Central palettes used by highlighters and chart accents

export const ARCH_LABELS = [
  "Natural Integrators",
  "Climate Specialists",
  "Gender Specialists",
  "Sequential Builders",
] as const;

/** Archetype chips / badges / legend colours (lookup is case-insensitive). */
export const ARCH_COLORS: Record<string, string> = {
  "natural integrators": "var(--semantic-integrated)",
  "climate specialists": "var(--semantic-climateOnly)",
  "gender specialists": "var(--semantic-genderOnly)",
  "sequential builders": "var(--series-muted-color)",
};

/** Focus phrases you use in insights / legends. */
export const FOCUS_PHRASES: Record<string, string> = {
  "integrated (both)": "var(--semantic-integrated)",
  "Natural integrators": "var(--semantic-integrated)",
  "fully integrated": "var(--semantic-integrated)",
  "gender-climate": "var(--semantic-integrated)",
  "climate only": "var(--semantic-climateOnly)",
  "climate": "var(--semantic-climateOnly)",
  "climate-heavy": "var(--semantic-climateOnly)",
  "gender only": "var(--semantic-genderOnly)",
  "gender": "var(--semantic-genderOnly)",
  "gender-heavy": "var(--semantic-genderOnly)",

  // spell & variants
  "climate & gender together": "var(--semantic-integrated)",
  "climate and gender together": "var(--semantic-integrated)",
};

/** Single-word emphasis used across pages. */
export const KEYWORD_COLORS: Record<string, string> = {
  integrated: "var(--semantic-integrated)",
  integrator: "var(--semantic-integrated)",
  integrators: "var(--semantic-integrated)",

  climate: "var(--semantic-climateOnly)",
  gender: "var(--semantic-genderOnly)",
};

/** Words that imply direction (used in insights). */
export const POLARITY_COLORS: Record<string, string> = {
  rise: "var(--semantic-up)",
  rises: "var(--semantic-up)",
  rose: "var(--semantic-up)",
  increase: "var(--semantic-up)",
  increased: "var(--semantic-up)",
  higher: "var(--semantic-up)",
  growth: "var(--semantic-up)",
  up: "var(--semantic-up)",
  gain: "var(--semantic-up)",
  gains: "var(--semantic-up)",
  Best : "var(--semantic-up)",

  fall: "var(--semantic-down)",
  falls: "var(--semantic-down)",
  fell: "var(--semantic-down)",
  decline: "var(--semantic-down)",
  declined: "var(--semantic-down)",
  lower: "var(--semantic-down)",
  drop: "var(--semantic-down)",
  dropped: "var(--semantic-down)",
  down: "var(--semantic-down)",
  loss: "var(--semantic-down)",
  losses: "var(--semantic-down)",
};

/** Return an accent CSS var for a donor archetype string. */
export function archetypeAccent(archetype?: string): string {
  const key = (archetype || "").toLowerCase().trim();
  return (
    ARCH_COLORS[key] ??
    (key.includes("integrat")
      ? "var(--semantic-integrated)"
      : key.includes("gender")
      ? "var(--semantic-genderOnly)"
      : key.includes("climate")
      ? "var(--semantic-climateOnly)"
      : "var(--series-default-color)")
  );
}

/** Build a palette for insights (merge focus + archetypes + keywords + optional polarity). */
export function buildInsightPalette(opts?: { includePolarity?: boolean }) {
  const base = {
    ...lowerKeyed(FOCUS_PHRASES),
    ...lowerKeyed(ARCH_COLORS),
    ...lowerKeyed(KEYWORD_COLORS),
  };
  if (opts?.includePolarity) {
    return { ...base, ...lowerKeyed(POLARITY_COLORS) };
  }
  return base;
}

/** Helper: lower-case keys for case-insensitive matching. */
function lowerKeyed(obj: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) out[k.toLowerCase()] = v;
  return out;
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Label,
  LabelList,
  CartesianGrid,
} from "recharts";

import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { Section } from "@/components/Section";
import { DataTableLite } from "@/components/DataTableLite";


import {
  fmtUSDCompact,
  safeJson,
  axisTickStyle,
  tooltipWrapperStyle,
  tooltipContentStyle,
  tooltipLabelStyle,
} from "@/lib/format";

import {
  Users,
  Globe2,
  Layers,
  Leaf,
  ArrowUpDown,
} from "lucide-react";

/* =====================
   Types
   ===================== */

type OverviewStats = {
  integrationRatePct: number; // %
  coveredCountries: number;
  totalCountries: number;
  activeDonors: number;
  totalProjects: number;
};

type DonorGroupRow = {
  group: string;
  focus: "gender_only" | "climate_only" | "integrated";
  top_region: string;
  disbursement_usd: number;
  pct_projects?: number;
  pct_disb?: number;
  pct?: number;
};

type UnderservedRow = {
  recipient_name: string;
  project_count: number;
  integrated_pct: number; // 0–100
};

type IntegrationTrendRow = {
  year: number;
  both_pct: number; // 0–100
  gender_only_pct: number; // 0–100
  climate_only_pct: number; // 0–100
};

type DonorOverlapCell = {
  donor_name: string;
  region_name: string;
  total_disb_usd: number;
  proj_count: number;
  pct_integrated: number; // 0–100
};

type DonorOverlapResponse = {
  donors: string[];
  regions: string[];
  matrix: DonorOverlapCell[];
};

/* =====================
   Helpers (chart labels)
   ===================== */
const renderPercentLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (value == null) return null;
  const p = Number(value) * 100;
  if (p < 4) return null;
  if (height < 14) return null;
  return (
    <text
      x={x + width / 2}
      y={y + height / 2 + 3}
      fill={"var(--text-primary)"}
      textAnchor="middle"
      fontSize={10}
      fontWeight={600}
      pointerEvents="none"
    >
      {p.toFixed(1)}%
    </text>
  );
};

/* =====================
   Page
   ===================== */

export default function UndpDashboardPage() {
  const [mounted, setMounted] = useState(false);

  // global year range
  const [allYears, setAllYears] = useState<number[]>([]);

  // UI filter state (what user picks)
  const [uiStartYear, setUiStartYear] = useState<"all" | number>("all");
  const [uiEndYear, setUiEndYear] = useState<"all" | number>("all");
  const [startYear, setStartYear] = useState<"all" | number>("all");
  const [endYear, setEndYear] = useState<"all" | number>("all");

  // data
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [donorGroups, setDonorGroups] = useState<DonorGroupRow[]>([]);
  const [underserved, setUnderserved] = useState<UnderservedRow[]>([]);
  const [integrationTrend, setIntegrationTrend] = useState<IntegrationTrendRow[]>([]);
  const [overlap, setOverlap] = useState<DonorOverlapResponse | null>(null);
  const [regionsList, setRegionsList] = useState<string[]>([]);

  // loading flags
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDonorGroups, setLoadingDonorGroups] = useState(true);
  const [loadingUnderserved, setLoadingUnderserved] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [loadingOverlap, setLoadingOverlap] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // filters / controls
  type FocusKey = "climate_only" | "gender_only" | "integrated";
  const [focusFilter, setFocusFilter] = useState<FocusKey>("integrated");
  const [regionFilter, setRegionFilter] = useState<string>(""); // '' = all (matches Strongest Region only)
  type ShareMode = "projects" | "disb";
  const [shareMode, setShareMode] = useState<ShareMode>("projects");
  type SortKey = "group" | "share"; // restrict to donor name or current share column
  const [sortBy, setSortBy] = useState<SortKey>("share");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const VERY_LOW_BAR = 5; // “very low integration” threshold in %

  useEffect(() => setMounted(true), []);

  /* =====================
     helpers
     ===================== */
  const buildQS = () => {
    let sy = startYear ? Number(startYear) : undefined;
    let ey = endYear ? Number(endYear) : undefined;
    if (sy && ey && ey < sy) {
      const t = sy;
      sy = ey;
      ey = t; // swap invalid range
    }
    const sp = new URLSearchParams();
    if (sy) sp.set("startYear", String(sy));
    if (ey) sp.set("endYear", String(ey));
    return sp.toString() ? `?${sp.toString()}` : "";
  };

  const pct = (n: number) => `${Number(n ?? 0).toFixed(1)}%`;
  const hexToRgba = (hex: string, a: number) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  /* =====================
     Bootstrap years
     ===================== */
  useEffect(() => {
    if (allYears.length) return;
    (async () => {
      const res = await fetch("/api/main_dashboard/analytics/integration_trends");
      const json = await safeJson(res);
      const rows: IntegrationTrendRow[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.trend)
        ? json.trend
        : [];
      const yrs = Array.from(new Set(rows.map((r) => Number(r.year))))
        .filter(Boolean)
        .sort((a, b) => a - b);
      setAllYears(yrs);
    })();
  }, [allYears.length]);

  // Overview KPIs
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoadingOverview(true);
      try {
        const res = await fetch(`/api/main_dashboard/summary${buildQS()}`);
        const raw = await safeJson(res);
        if (ignore) return;
        const mapped: OverviewStats = {
          integrationRatePct: Number((raw as any)?.integratedSharePct ?? (raw as any)?.integrationRatePct ?? 0),
          coveredCountries: Number((raw as any)?.coveredCountries ?? 0),
          totalCountries: Number((raw as any)?.totalCountries ?? 0),
          activeDonors: Number((raw as any)?.activeDonors ?? 0),
          totalProjects: Number((raw as any)?.taggedProjects ?? (raw as any)?.totalProjects ?? 0),
        };
        setOverview(mapped);
      } catch (err) {
        if (!ignore) console.warn("[summary] load failed:", err);
      } finally {
        if (!ignore) setLoadingOverview(false);
      }
    })();
    return () => { ignore = true; };
  }, [startYear, endYear]);

  // Underserved
useEffect(() => {
  let ignore = false;
  (async () => {
    setLoadingUnderserved(true);
    try {
      const res = await fetch(`/api/main_dashboard/analytics/underserved${buildQS()}`);
      const json = await safeJson(res);
      if (ignore) return;
      const rows = Array.isArray(json?.countries) ? (json.countries as UnderservedRow[]) : [];
      setUnderserved(rows);
    } catch (err) {
      if (!ignore) console.warn("[underserved] load failed:", err);
    } finally {
      if (!ignore) setLoadingUnderserved(false);
    }
  })();
  return () => { ignore = true; };
}, [startYear, endYear]);

  // Integration trend
  useEffect(() => {
  let ignore = false;
  (async () => {
    setLoadingTrend(true);
    try {
      const res = await fetch(`/api/main_dashboard/analytics/integration_trends${buildQS()}`);
      const json = await safeJson(res);
      if (ignore) return;
      const rows: IntegrationTrendRow[] = Array.isArray(json) ? json : Array.isArray(json?.trend) ? json.trend : [];
      setIntegrationTrend(rows);
    } catch (err) {
      if (!ignore) console.warn("[trend] load failed:", err);
    } finally {
      if (!ignore) setLoadingTrend(false);
    }
  })();
  return () => { ignore = true; };
}, [startYear, endYear]);

  // Donor × Region overlap
  useEffect(() => {
  let ignore = false;
  (async () => {
    setLoadingOverlap(true);
    try {
      const res = await fetch(`/api/main_dashboard/analytics/donor-overlap${buildQS()}`);
      const json = await safeJson(res);
      if (ignore) return;
      const payload = (json as any)?.error ? null : (json as DonorOverlapResponse);
      setOverlap(payload);
    } catch (err) {
      if (!ignore) console.warn("[overlap] load failed:", err);
    } finally {
      if (!ignore) setLoadingOverlap(false);
    }
  })();
  return () => { ignore = true; };
}, [startYear, endYear]);

  // Donor groups
  useEffect(() => {
  let ignore = false;
  (async () => {
    setLoadingDonorGroups(true);
    try {
      const sp = new URLSearchParams();
      if (Number.isInteger(startYear)) sp.set("startYear", String(startYear));
      if (Number.isInteger(endYear))   sp.set("endYear", String(endYear));
      const qs = sp.toString() ? `?${sp.toString()}` : "";
      const res = await fetch(`/api/main_dashboard/analytics/donor-groups${qs}`);
      const json = await safeJson(res);
      if (ignore) return;
      const rows = Array.isArray(json?.groups) ? (json.groups as DonorGroupRow[]) : [];
      setDonorGroups(rows);
    } catch (err) {
      if (!ignore) console.warn("[donor-groups] load failed:", err);
    } finally {
      if (!ignore) setLoadingDonorGroups(false);
    }
  })();
  return () => { ignore = true; };
}, [startYear, endYear]);

  // Build Regions dropdown from the "Strongest Region" values
  useEffect(() => {
    const list = Array.from(new Set(donorGroups.map((d) => d.top_region).filter(Boolean))).sort();
    setRegionsList(list);
  }, [donorGroups]);

  /* =====================
     Derived KPIs
     ===================== */

  const integratedPctDisplay = overview
    ? pct(overview.integrationRatePct)
    : loadingOverview
    ? "…"
    : "0%";

  const reachDisplay = overview
    ? `${(overview.coveredCountries ?? 0).toLocaleString()} / ${(overview.totalCountries ?? 0).toLocaleString()}`
    : loadingOverview
    ? "…"
    : "—";

  const donorCountDisplay = overview
    ? (overview.activeDonors ?? 0).toLocaleString()
    : loadingOverview
    ? "…"
    : "—";

  const projectCountDisplay = overview
    ? (overview.totalProjects ?? 0).toLocaleString()
    : loadingOverview
    ? "…"
    : "0";

  /* =====================
     Trend + insights
     ===================== */

  const trendData = useMemo(
    () =>
      integrationTrend.map((r) => ({
        year: r.year,
        both: (r.both_pct ?? 0) / 100,
        gender_only: (r.gender_only_pct ?? 0) / 100,
        climate_only: (r.climate_only_pct ?? 0) / 100,
      })),
    [integrationTrend]
  );

  const integrationTrendInsight = useMemo<React.ReactNode>(() => {
    const t = integrationTrend;
    if (!t.length) return null;

    const s = [...t].sort((a, b) => a.year - b.year);
    if (s.length === 1) {
      return (
        <>
          Only <strong>{s[0].year}</strong> available:{" "}
          <strong style={{ color: "var(--semantic-integrated)" }}>{pct(s[0].both_pct)}</strong>.
        </>
      );
    }

    const first = s[0];
    const last = s[s.length - 1];
    const change = Number(last.both_pct) - Number(first.both_pct); // pp
    const avgYoY = change / (s.length - 1); // pp/yr

    let peak = s[0],
      trough = s[0];
    for (const r of s) {
      if (r.both_pct > peak.both_pct) peak = r;
      if (r.both_pct < trough.both_pct) trough = r;
    }

    const dirWord = change > 0 ? "improving" : change < 0 ? "slipping" : "flat";
    const toneColor =
      change > 0
        ? "var(--semantic-integrated)"
        : change < 0
        ? "var(--color-semantic-alert)"
        : "var(--text-secondary)";

    return (
      <>
        The overall Integration rate is <strong style={{ color: toneColor }}>{dirWord}</strong>: {pct(first.both_pct)} →{" "}
        <strong style={{ color: toneColor }}>{pct(last.both_pct)}</strong> (
        {change >= 0 ? "+" : "−"}
        {Math.abs(change).toFixed(1)} pp since {first.year}). The highest rate was{" "}
        <strong style={{ color: "var(--series-default-color)" }}>{pct(peak.both_pct)}</strong> 
        in {peak.year}; 
        the lowest was {" "}
        <span style={{ color: "var(--semantic-alert-color)" }}>{pct(trough.both_pct)} </span>
        in {trough.year}.
      </>
    );
  }, [integrationTrend]);

  /* =====================
     Hotspots + Underserved
     ===================== */
const HOTSPOT_INTEGRATION_MAX = 16; // ≤ this % integrated => “low integration”
const HOTSPOT_ACTIVITY_RULE: "percentile" | "absolute" = "percentile";
// If percentile: use top 25% by project_count within the current filter
const HOTSPOT_ACTIVITY_PCT = 0.75;
// If absolute: require at least this many tagged projects (useful if volumes are stable)
const HOTSPOT_ACTIVITY_MIN_ABS = 50;

const percentile = (arr: number[], p: number) => {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const idx = Math.min(a.length - 1, Math.max(0, Math.floor(p * a.length)));
  return a[idx];
};

const hotspotRows = useMemo(() => {
  if (!underserved.length) return [];

  // Determine the activity floor dynamically (or fallback to absolute)
  const projectCounts = underserved.map(u => Number(u.project_count ?? 0));
  const activityFloor =
    HOTSPOT_ACTIVITY_RULE === "percentile"
      ? Math.max(5, percentile(projectCounts, HOTSPOT_ACTIVITY_PCT))
      : HOTSPOT_ACTIVITY_MIN_ABS;

  // Candidate = high activity AND low integration
  const candidates = underserved.filter(u => {
    const proj = Number(u.project_count ?? 0);
    const integ = Number(u.integrated_pct ?? 0);
    return proj >= activityFloor && integ <= HOTSPOT_INTEGRATION_MAX;
  });

  // Score = projects × (1 − integrated%)
  const scored = candidates
    .map(u => {
      const proj = Number(u.project_count ?? 0);
      const integ = Number(u.integrated_pct ?? 0);
      const score = proj * (1 - integ / 100);
      return {
        country: u.recipient_name,
        project_count: proj,
        integrated_pct: integ,
        hotspot_score: score,
      };
    })
    .sort((a, b) => b.hotspot_score - a.hotspot_score)
    .slice(0, 8);

  return scored;
    }, [underserved]);

  const hotspotInsight = useMemo<React.ReactNode>(() => {
  if (!hotspotRows.length) return null;
  const top = hotspotRows[0];
  return (
    <>
      Among high-activity portfolios (by current filter),{" "}
      <strong style={{ color: "var(--semantic-underserved)" }}>{top.country}</strong>{" "}
      stands out for fragmented integration—{top.project_count.toLocaleString()} projects,
      yet only{" "}
      <strong style={{ color: "var(--semantic-alert-color)" }}>
        {Number(top.integrated_pct ?? 0).toFixed(1)}%
      </strong>{" "}
      integrated (as a fraction of the recipient's portfolio), highlighting the integration niche.
    </>
  );
    }, [hotspotRows]);


  // Underserved table columns
  const underservedColumns = useMemo(
    () => [
      {
        key: "recipient_name",
        header: "Country",
        render: (row: UnderservedRow) => (
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{row.recipient_name}</span>
        ),
      },
      {
        key: "project_count",
        header: "Project count",
        render: (row: UnderservedRow) => <span>{row.project_count.toLocaleString()}</span>,
      },
      {
        key: "integrated_pct",
        header: "% Integrated",
        render: (row: UnderservedRow) => (
          <span >{Number(row.integrated_pct).toFixed(1)}%</span>
        ),
      },
    ],
    []
  );

  const lowActivityRows = useMemo(() => {
    return underserved
      .map((r) => ({
        country: r.recipient_name,
        project_count: Number(r.project_count ?? 0),
        integrated_pct: Number(r.integrated_pct ?? 0), // already 0–100
      }))
      .sort((a, b) => a.integrated_pct - b.integrated_pct);
  }, [underserved]);

  const underservedInsight = useMemo<React.ReactNode>(() => {
  if (!lowActivityRows.length) return null;

  const worst = lowActivityRows[0];
  const veryLow = lowActivityRows.filter((r) => r.integrated_pct < VERY_LOW_BAR);
  const n = veryLow.length;
  const noun = n === 1 ? "country" : "countries";
  const verb = n === 1 ? "sits" : "sit";

  return (
    <>
      Within the low project activity cohort,{" "}
      <strong style={{ color: "var(--semantic-underserved)" }}>{worst.country}</strong>{" "}
      stands out — {worst.project_count.toLocaleString()} tagged projects with {" "}
      <strong style={{ color: "var(--semantic-alert-color)" }}>{worst.integrated_pct.toFixed(1)}% </strong>integrated.
      {n > 0 ? (
        <>
          {" "}Across this list, {n} {noun} {verb} below {VERY_LOW_BAR}%,
          pointing to near-term opportunities for integrated pilots.
        </>
      ) : null}
    </>
  );
}, [lowActivityRows]);


  /* =====================
     Donor × Region overlap
     ===================== */

  const donors = overlap?.donors ?? [];
  const regions = overlap?.regions ?? [];

  const matrixMap = useMemo(() => {
    const m: Record<string, Record<string, DonorOverlapCell>> = {};
    overlap?.matrix?.forEach((c) => {
      (m[c.donor_name] ??= {})[c.region_name] = c;
    });
    return m;
  }, [overlap]);

  const maxUsd = useMemo(() => {
    let m = 0;
    overlap?.matrix?.forEach((c) => {
      if (c.total_disb_usd > m) m = c.total_disb_usd;
    });
    return m;
  }, [overlap]);

  const overlapInsight = useMemo<React.ReactNode>(() => {
  const m = overlap?.matrix ?? [];
  if (!m.length) return null;

  // pick the largest lane by tagged disbursement
  const top = m.reduce(
    (best, cur) =>
      Number(cur.total_disb_usd ?? 0) > Number(best.total_disb_usd ?? 0)
        ? cur
        : best,
    m[0]
  );

  const usd = fmtUSDCompact(Number(top.total_disb_usd ?? 0));
  const pctNum = Number(top.pct_integrated ?? 0);
  const pct = pctNum.toFixed(1);
  const tone = pctNum < 20 ? " signaling" : " suggesting";

  return (
    <>
      Within the selected years, the largest donor→region corridor is{" "}
      <strong style={{ color: "var(--semantic-integrated)" }}>
        {top.donor_name} → {top.region_name}
        , totaling {usd}: {" "}
      </strong>
      however the integration rate along this corridor is only {" "}
      <span style={{ color: "var(--semantic-alert-color)" }} >{pct}%,</span>
      {tone} an opportunity to deepen joint gender–climate work.
    </>
  );
}, [overlap]);


  /* =====================
     Donor Focus & Influence
     ===================== */

  const focusPretty = (f: string) =>
    f === "gender_only"
      ? "Mostly gender"
      : f === "climate_only"
      ? "Mostly climate"
      : f === "integrated"
      ? "Integrated (both)"
      : f;

  const shareForRow = (r: DonorGroupRow) =>
    Number(shareMode === "projects" ? r.pct_projects ?? r.pct ?? 0 : r.pct_disb ?? r.pct ?? 0) || 0;

  // Apply focus filter
  const focusFiltered = useMemo(
    () => donorGroups.filter((g) => g.focus === focusFilter),
    [donorGroups, focusFilter]
  );

  // Apply "Strongest Region" filter
  const regionAndFocusFiltered = useMemo(
    () =>
      focusFiltered.filter((g) =>
        regionFilter ? (g.top_region || "Unspecified") === regionFilter : true
      ),
    [focusFiltered, regionFilter]
  );

  // Sort locally by donor name or by current share column
  const donorTableRows = useMemo(() => {
    const rows = [...regionAndFocusFiltered];
    rows.sort((a, b) => {
      if (sortBy === "group") {
        const cmp = (a.group || "").localeCompare(b.group || "");
        return order === "asc" ? cmp : -cmp;
        }
      const da = shareForRow(a);
      const db = shareForRow(b);
      const cmp = da === db ? (a.group || "").localeCompare(b.group || "") : db - da;
      return order === "asc" ? -cmp : cmp;
    });
    return rows;
  }, [regionAndFocusFiltered, sortBy, order, shareMode]);

  // ------- insight builder -------
  const buildDonorFocusInsight = (
    rows: DonorGroupRow[],
    focus: "integrated" | "gender_only" | "climate_only",
    mode: "projects" | "disb",
    region: string
  ): React.ReactNode => {
    if (!rows?.length) return null;

    const label =
      focus === "integrated" ? "Integrated (both)" : focus === "gender_only" ? "Mostly gender" : "Mostly climate";

    const shares = rows.map((r) =>
      Number(mode === "projects" ? r.pct_projects ?? r.pct ?? 0 : r.pct_disb ?? r.pct ?? 0) || 0
    );
    const top = rows[0]; // already sorted
    const median = (() => {
      const sorted = [...shares].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    })();
    const geog = region ? `${region} — ` : "";

    return (
      <>
        {geog}From the focus area "{label}" perspective, the top donor is  <strong style={{ color: "var(--semantic-integrated)" }}>{top.group}</strong>{" "}
        ({shareForRow(top).toFixed(1)}% {mode === "projects" ? "project" : "disb."} share). The median among listed donors is :{" "}
        {median.toFixed(1)}%.
      </>
    );
  };

  // ---------- handlers ----------
  const handleApply = () => {
    setStartYear(uiStartYear);
    setEndYear(uiEndYear);
  };

  const handleReset = () => {
    setUiStartYear("all");
    setUiEndYear("all");
    setStartYear("all");
    setEndYear("all");
  };

  /* =====================
     Loader
     ===================== */
  const anyLoading =
    loadingOverview || loadingTrend || loadingOverlap || loadingUnderserved || loadingDonorGroups;

  if (errorMsg) {
    return (
      <div
        className="p-6 min-h-screen"
        style={{
          backgroundColor: "var(--page-bg-color)",
          color: "var(--text-primary)",
        }}
      >
        <p className="text-red-500">{errorMsg}</p>
      </div>
    );
  }

  if (!mounted) return null;

  /* =====================
     Render
     ===================== */

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "var(--page-bg-color)",
        color: "var(--text-primary)",
      }}
    >
      {/* full-window loader */}
      {anyLoading && (
        <div
          className="fixed inset-0  flex flex-col items-center justify-center gap-3"
          style={{
            backgroundColor: "var(--overlay-scrim)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent"
            style={{
              borderColor: "var(--semantic-integrated)",
              borderTopColor: "transparent",
            }}
          />
          <div className="text-xs tracking-wide" style={{ color: "var(--text-primary)" }}>
            Loading dashboard. This may take a few seconds…
          </div>
        </div>
      )}

      {/* STICKY HEADER */}
      <div
        className="sticky z-50 border-b backdrop-blur-md"
        style={{
          top: "64px",
          backgroundColor: "var(--overlay-scrim)",
          borderColor: "var(--card-border-weak)",
        }}
      >
        <div className="container mx-auto px-4 md:px-8 lg:px-16 py-4 space-y-4">
          <div className="flex flex-col gap-2">
            <div
              className="font-extrabold text-[30px] text-center"
              style={{
                backgroundImage: "linear-gradient(90deg, var(--semantic-integrated), var(--semantic-climateOnly))",
                WebkitBackgroundClip: "text",
                color: "transparent",
                borderColor: "var(--border-card-shadow)",
              }}
            >
              <strong>UNDP STRATEGIC DASHBOARD</strong>
            </div>
            <div className="max-w-8xl text-[14px] text-center" style={{ color: "var(--text-primary)", lineHeight: 1.5 }}>
              <p>
                Explore the strategic view into gender + climate finance. Through this dashboard, traverse the integration progress, priority risk zones, and
                which donors dominate which regions.
              </p>
            </div>
          </div>

          {/* Global filters */}
          <div
            className="flex flex-wrap items-end gap-4 text-[12px] rounded-xl border bg-muted/60 p-4"
            style={{
              backgroundColor: "var(--card-bg-color)",
              borderColor: "var(--card-border-weak)",
              color: "var(--semantic-alert-color)",
              boxShadow: "var(--card-shadow-lg)",
            }}
          >
            <span>
              <strong>These filters drive all KPIs, tables, and charts in this view.</strong>
            </span>
            {/* start year */}
            <div className="flex flex-col">
              <label className="text-[11px] mb-1" style={{ color: "var(--text-primary)" }}>
                <strong>START YEAR</strong>
              </label>
              <select
                className="border rounded px-2 py-1 text-[11px]"
                style={{
                  borderColor: "var(--card-border-weak)",
                  background: "var(--card-bg-color)",
                  color: "var(--text-primary)",
                }}
                value={uiStartYear === "all" ? "all" : uiStartYear}
                onChange={(e) =>
                  setUiStartYear(e.target.value === "all" ? "all" : Number(e.target.value))
                }
              >
                <option value="">All</option>
                {allYears.map((y) => (
                  <option key={`s-${y}`} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {/* end year */}
            <div className="flex flex-col" style={{ color: "var(--text-secondary)" }}>
              <label className="text-[11px] mb-1" style={{ color: "var(--text-primary)" }}>
                <strong>END YEAR</strong>
              </label>
              <select
                className="border rounded px-2 py-1 text-[11px]"
                style={{
                  borderColor: "var(--card-border-weak)",
                  background: "var(--card-bg-color)",
                  color: "var(--text-primary)",
                }}
                value={uiEndYear === "all" ? "all" : uiEndYear}
                onChange={(e) =>
                  setUiEndYear(e.target.value === "all" ? "all" : Number(e.target.value))
                }
              >
                <option value="">All</option>
                {allYears.map((y) => (
                  <option key={`e-${y}`} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="px-3 py-[6px] rounded-md text-[12px] font-semibold"
              style={{
                backgroundColor: "var(--semantic-integrated)",
                color: "var(--text-primary)",
              }}
              onClick={handleApply}
            >
              Apply
            </button>
            <button
              className="px-3 py-[6px] rounded-md text-[12px] font-semibold border"
              style={{
                borderColor: "var(--card-border-weak)",
                color: "var(--text-secondary)",
              }}
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* SNAPSHOT (KPIs) */}
      <Section 
      title="PORTFOLIO SNAPSHOT" subtitle="High-level indicators from all projects (gender and/or climate).">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <StatCard
            accentIcon={<Leaf className="h-4 w-4" />}
            label="Integrated Gender + Climate"
            sub="Share of projects addressing both"
            accentBg={"var(--semantic-integrated)"}
            value={integratedPctDisplay}
            valueColor="var(--semantic-integrated)" />
          <StatCard
            accentIcon={<Globe2 className="h-4 w-4" />}
            label="Geographic Reach"
            sub="Countries with ≥1 tagged project"
            accentBg={"var(--semantic-climateOnly)"}
            value={reachDisplay} />
          <StatCard
            accentIcon={<Users className="h-4 w-4" />}
            label="# of Donors"
            sub="Distinct funding organizations"
            accentBg={"var(--semantic-genderOnly)"}
            value={donorCountDisplay} />
          <StatCard
            accentIcon={<Layers className="h-4 w-4" />}
            label="# Projects"
            sub="With at least one gender or climate marker"
            accentBg={"var(--semantic-integrated)"}
            value={projectCountDisplay} />
        </div>
      </Section>

      {/* main */}
      <main className="container mx-auto px-4 md:px-8 lg:px-16 py-8 space-y-8">
        
        <Section
          matchParentWidth
          title="PORTFOLIO DEEPDIVE"
          subtitle="This deepdive connects trend to concentration: how integration is changing across years, and which donor–region lanes dominate the portfolio. Read the charts left-to-right to spot momentum, plateaus, and gaps in integration. Adjust the year and region filters to explore different narratives"
        >
          <div className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
            ** Insight callouts use fixed phrasing, but names and figures update with the filters used. Treat them as a live snapshot rather than a static report.
          </div>
          {/* SECTION 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
            <ChartCard
              loading={loadingTrend}
              title="INTEGRATION TREND"
              subtitle="Share of projects that are climate+gender integrated over time (stacked composition)."
              insight={integrationTrendInsight}
            >
              {!trendData.length ? (
                <div className="text-center text-[12px] py-16" style={{ color: "var(--text-secondary)" }}>
                  {loadingTrend ? "Loading…" : "No trend data"}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={trendData} stackOffset="expand" margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid stroke={"var(--grid-weak)"} strokeDasharray="3 3" />
                    <XAxis dataKey="year" tick={axisTickStyle()} />
                    <YAxis
                      tick={axisTickStyle()}
                      tickFormatter={(v: number) => `${Math.round((v as number) * 100)}%`}
                      domain={[0, 1]}
                    />
                    <Tooltip
                      wrapperStyle={tooltipWrapperStyle()}
                      contentStyle={tooltipContentStyle()}
                      labelStyle={tooltipLabelStyle()}
                      formatter={(val: unknown, name: string) => {
                        const p = Number(val) * 100;
                        const label =
                          name === "both"
                            ? "Integrated (both)"
                            : name === "gender_only"
                            ? "Mostly gender"
                            : name === "climate_only"
                            ? "Mostly climate"
                            : name;
                        return [`${p.toFixed(1)}%`, label];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="both" name="Integrated (both)" stackId="p" fill={"var(--semantic-integrated)"}>
                      <LabelList dataKey="both" content={renderPercentLabel} />
                    </Bar>
                    <Bar dataKey="gender_only" name="Mostly gender" stackId="p" fill={"var(--semantic-genderOnly)"}>
                      <LabelList dataKey="gender_only" content={renderPercentLabel} />
                    </Bar>
                    <Bar dataKey="climate_only" name="Mostly climate" stackId="p" fill={"var(--semantic-climateOnly)"}>
                      <LabelList dataKey="climate_only" content={renderPercentLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Overlap heat table */}
            <ChartCard
              loading={loadingOverlap}
              title="DONOR × REGION OVERLAP"
              subtitle="See where top donors concentrate by region. The cell intensity tracks the disbursement volume; hover to compare amounts, project counts, and integration rates."
              insight={overlapInsight}
            >
              {!overlap || !donors.length || !regions.length ? (
                <div className="text-center text-[12px] py-16" style={{ color: "var(--text-secondary)" }}>
                  {loadingOverlap ? "Loading…" : "No overlap data"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table
                    className="text-[11px] leading-tight mx-auto"
                    style={{
                      borderCollapse: "separate",
                      borderSpacing: "4px",
                      color: "var(--text-primary)",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          className="text-left align-bottom pr-2 pb-2"
                          style={{
                            fontWeight: 500,
                            fontSize: "10px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Donor ↓ / Region →
                        </th>
                        {regions.map((region) => (
                          <th
                            key={region}
                            className="text-center px-2 pb-2 whitespace-nowrap"
                            style={{ fontWeight: 500, fontSize: "10px", color: "var(--text-secondary)" }}
                          >
                            {region || "—"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {donors.map((donor) => (
                        <tr key={donor}>
                          <td
                            className="text-left pr-2 py-1 whitespace-nowrap"
                            style={{ fontWeight: 500, color: "var(--text-secondary)", fontSize: "10px" }}
                          >
                            {donor || "—"}
                          </td>
                          {regions.map((region) => {
                            const cell = matrixMap[donor]?.[region];
                            const usd = cell?.total_disb_usd ?? 0;
                            const pct = cell?.pct_integrated ?? 0;
                            const proj = cell?.proj_count ?? 0;
                            const intensity = maxUsd > 0 ? usd / maxUsd : 0;
                            const alpha = Math.min(Math.max(0.09 + intensity * 0.8, 0), 1);
                            const bg = usd > 0 ? `rgb(var(--sem-climate) / ${alpha})` : "transparent";
                            return (
                              <td
                                key={region}
                                className="text-center align-middle px-2 py-2 rounded-sm"
                                style={{
                                  backgroundColor: bg,
                                  minWidth: "72px",
                                  lineHeight: 1.2,
                                  color: "var(--text-primary)",
                                  fontSize: "10px",
                                  border: usd > 0 ? "1px solid var(--card-border-weak)" : "1px solid transparent",
                                }}
                                title={
                                  usd > 0
                                    ? `${donor} → ${region}
                        Disbursed: ${fmtUSDCompact(usd)}
                        Projects: ${proj.toLocaleString()}
                        Integrated: ${pct.toFixed(1)}%`
                                                            : `${donor} → ${region}
                        No spending captured`
                                }
                              >
                                {usd > 0 ? (
                                  <div className="flex flex-col items-center">
                                    <div style={{ fontWeight: 600, fontSize: "11px" }}>{fmtUSDCompact(usd)}</div>
                                    <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                                      {pct.toFixed(1)}% int.
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ChartCard>
          </div>

          {/* ====== SECTION 2: Low-Integration Opportunities ====== */}
          <section
            className="rounded-md border p-4 space-y-4 mb-16 py-6"
            style={{
              backgroundColor: "var(--card-bg-color)",
              borderColor: "var(--card-border-weak)",
            }}
          >
            <div className="type-section-sub font-bold text-center text-[14px]" style={{ color: "var(--text-primary)" }}>
              LOW INTEGRATION AREAS : RECIPIENT COUNTRY VIEW
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Hotspots */}
              <ChartCard
                loading={loadingUnderserved}
                title="HIGH ACTIVITY - LOW INTEGRATION"
                subtitle="Countries with high project activity but low integration (integration score = projects × (1 − integrated%))."
                insight={hotspotInsight}
              >
                {!hotspotRows.length ? (
                  <div className="text-center text-[12px] py-16" style={{ color: "var(--text-secondary)" }}>
                    {loadingUnderserved ? "Loading…" : "No hotspots"}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={hotspotRows} layout="vertical" margin={{ left: 72, right: 16, top: 8, bottom: 8 }}>
                      <CartesianGrid stroke={"var(--grid-weak)"} strokeDasharray="3 3" />
                      <XAxis type="number" tick={axisTickStyle()}>
                        <Label
                            value="Project count"
                            position="bottom"
                            offset={-5}
                            style={{ fill: "var(--axis-color)", fontSize: 10 }}
                          />
                      </XAxis>
                      <YAxis type="category" dataKey="country" tick={axisTickStyle()} width={110}>
                        <Label
                            value="Recipient country"
                            angle={-90}
                            position="insideLeft"
                            style={{
                              fill: "var(--axis-color)",
                              fontSize: 11,
                              textAnchor: "middle",
                            }}
                          />
                        </YAxis>
                      <Tooltip
                        wrapperStyle={tooltipWrapperStyle()}
                        contentStyle={tooltipContentStyle()}
                        labelStyle={tooltipLabelStyle()}
                        cursor={{ fill: "var(--grid-weak)" }}
                        formatter={(_, __, p: any) => {
                          const row = p?.payload;
                          return [
                            `Score: ${row.hotspot_score.toFixed(1)} | ${row.project_count.toLocaleString()} projects | ${row.integrated_pct.toFixed(1)}% integrated`,
                            "",
                          ];
                        }}
                      />
                      <Bar dataKey="hotspot_score" name="Hotspot score" fill={"var(--series-default-color)"} radius={[4, 4, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div className="text-[10px] text-center mt-5" style={{ color: "var(--text-secondary)" }}>
                  The integration score is calculated as high activity (≥ {HOTSPOT_ACTIVITY_RULE === "percentile" ? `top ${(1 - HOTSPOT_ACTIVITY_PCT) * 100}% by projects` : `${HOTSPOT_ACTIVITY_MIN_ABS} projects`})
                  and low integration (≤ {HOTSPOT_INTEGRATION_MAX}%); ranked by projects × (1 − integrated%).
                </div>
              </ChartCard>

              {/* Underserved table */}
              <ChartCard
                loading={loadingUnderserved}
                title="LOW ACTIVITY - LOW INTEGRATION"
                subtitle="Low activity & low integration — places at risk of being left behind."
                insight={underservedInsight}
              >
                {!underserved.length ? (
                  <div className="text-left text-[12px] py-16" style={{ color: "var(--text-secondary)" }}>
                    {loadingUnderserved ? "Loading…" : "No underserved countries"}
                  </div>
                ) : (
                  <DataTableLite<UnderservedRow>
                    columns={underservedColumns}
                    rows={[...underserved]
                      .sort(
                        (a, b) => a.integrated_pct - b.integrated_pct || b.project_count - a.project_count
                      )
                      .slice(0, 10)}
                    rowKey={(row, idx) => `${row.recipient_name}-${idx}`}
                    maxHeight={280}
                  />
                )}
              </ChartCard>
            </div>
          </section>

          {/* ====== SECTION 3: Donor Focus & Influence ====== */}
          <ChartCard
            loading={loadingDonorGroups}
            title="DONOR FOCUS & INFLUENCE"
            subtitle="Explore each donor’s focus mix across regions. Toggle project vs. disbursement share. Use the Region filter to show donors whose Strongest Region matches the selection."
            insight={buildDonorFocusInsight(donorTableRows, focusFilter, shareMode, regionFilter)}
          >
            {/* Left-aligned filter stack (table-only) */}
            <div className="flex flex-col gap-2 mb-3">
              <div className="text-[10px] tracking-wide font-semibold" >
                <strong style={{ color: "var(--semantic-alert-color)" }}>These filters apply to this table only</strong>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                {/* Focus pills */}
                <div className="flex items-center gap-2 border">
                <span className="text-[11px] text-center" style={{ color: "var(--series-default-color)" }}>
                    Select focus perspective:
                  </span>
                  {([
                    { key: "integrated", label: "Integrated", color: "var(--semantic-integrated)" },
                    { key: "gender_only", label: "Gender", color: "var(--semantic-genderOnly)" },
                    { key: "climate_only", label: "Climate", color: "var(--semantic-climateOnly)" },
                  ] as { key: FocusKey; label: string; color: string }[]).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setFocusFilter(t.key)}
                      className="px-2 py-1 rounded border text-[11px] font-semibold"
                      style={{
                        borderColor: focusFilter === t.key ? "transparent" : "var(--card-border-weak)",
                        backgroundColor: focusFilter === t.key ? t.color : "transparent",
                        color: focusFilter === t.key ? "white" : "var(--text-secondary)",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Region (Strongest Region filter) */}
                <div className="flex items-center gap-2 border">
                  <span className="text-[11px]" style={{ color: "var(--series-default-color)" }}>
                    Filter by Strongest Region:
                  </span>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="border rounded px-2 py-1 text-[11px]"
                    style={{
                      borderColor: "var(--card-border-weak)",
                      background: "var(--card-bg-color)",
                      color: "var(--text-primary)",
                    }}
                    aria-label="Filter by donors' Strongest Region"
                    title="Filter by donors' Strongest Region"
                  >
                    <option value="">All regions</option>
                    {regionsList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Share toggle */}
                <div
                  className="flex items-center gap-2 border"
                  style={{ borderColor: "var(--card-border-weak)" }}
                >
                  <span className="text-[11px] text-center" style={{ color: "var(--series-default-color)",
                   }}>
                    Select share perspective : 
                  </span>
                  <button
                    onClick={() => setShareMode("projects")}
                    className="px-2 py-1 text-[11px] font-semibold"
                    style={{
                      background: shareMode === "projects" ? "var(--semantic-integrated)" : "transparent",
                      color: shareMode === "projects" ? "white" : "var(--text-secondary)",
                      borderRight: "1px solid var(--card-border-weak)",
                    }}
                    title="Show share by projects"
                  >
                    Project share
                  </button>
                  <button
                    onClick={() => setShareMode("disb")}
                    className="px-2 py-1 text-[11px] font-semibold"
                    style={{
                      background: shareMode === "disb" ? "var(--semantic-integrated)" : "transparent",
                      color: shareMode === "disb" ? "white" : "var(--text-secondary)",
                    }}
                    title="Show share by disbursement"
                  >
                    Disb. share
                  </button>
                </div>
              </div>
            </div>

            {/* Table (with header sort icons) */}
            {!donorTableRows.length ? (
              <div className="text-center text-[12px] py-12" style={{ color: "var(--text-secondary)" }}>
                {loadingDonorGroups ? "Loading…" : "No data for this filter"}
              </div>
            ) : (
              <DataTableLite<DonorGroupRow>
                columns={[
                  {
                    key: "group",
                    //@ts-ignore
                    header: (
                      <button
                        className="inline-flex items-center gap-1 font-semibold"
                        onClick={() => {
                          setSortBy("group");
                          setOrder((o) => (sortBy === "group" ? (o === "asc" ? "desc" : "asc") : "asc"));
                        }}
                        title="Sort by donor name"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Donor
                        <ArrowUpDown
                          size={14}
                          style={{
                            //opacity: sortBy === "group" ? 1 : 0.4,
                            transform: order === "asc" && sortBy === "group" ? "scaleY(-1)" : "none",
                          }}
                        />
                      </button>
                    ),
                    render: (row: DonorGroupRow) => (
                      <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.8rem" }}>
                        {row.group}
                      </span>
                    ),
                  },
                  // {
                  //   key: "focus",
                  //   header: "Focus",
                  //   render: (row: DonorGroupRow) => (
                  //     <span style={{ color: "var(--text-secondary)" }}>{focusPretty(row.focus)}</span>
                  //   ),
                  // },
                  {
                    key: "top_region",
                    header: regionFilter ? "Strongest Region (filtered)" : "Strongest Region",
                    render: (row: DonorGroupRow) => (
                      <span style={{ color: "var(--text-primary)" }}>{row.top_region}</span>
                    ),
                  },
                  {
                    key: "disb",
                    header: "Donor Disbursement to focus area",
                    render: (row: DonorGroupRow) => (
                      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                        {fmtUSDCompact(Number(row.disbursement_usd ?? 0))}
                      </span>
                    ),
                  },
                  {
                    key: "share",
                    //@ts-ignore
                    header: (
                      <button
                        className="inline-flex items-center gap-1 font-semibold"
                        onClick={() => {
                          setSortBy("share");
                          setOrder((o) => (sortBy === "share" ? (o === "asc" ? "desc" : "asc") : "desc"));
                        }}
                        title={`Sort by ${shareMode === "projects" ? "project" : "disb."} share`}
                        style={{ color: "var(--text-primary)" }}
                      >
                        {shareMode === "projects" ? "Project share (of donor's portfolio)" : "Disb. share (of donor's portfolio)"}
                        <ArrowUpDown
                          size={14}
                          style={{
                            opacity: sortBy === "share" ? 1 : 0.4,
                            transform: order === "asc" && sortBy === "share" ? "scaleY(-1)" : "none",
                          }}
                        />
                      </button>
                    ),
                    render: (row: DonorGroupRow) => (
                      <span className="block text-left" style={{ color: "var(--text-primary)" }}>
                        {shareForRow(row).toFixed(1)}%
                      </span>
                    ),
                  },
                ]}
                rows={donorTableRows}
                rowKey={(row, idx) =>
                  `${row.group}-${row.focus}-${row.top_region}-${regionFilter}-${shareMode}-${idx}`
                }
                maxHeight={300}
              />
            )}
          </ChartCard>
        </Section>
      </main>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Label,
  LabelList,
} from "recharts";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { Section } from "@/components/Section";
import { DataTableLite } from "@/components/DataTableLite";
import { Leaf, Target, Layers3, DollarSign } from "lucide-react";
import {
  tooltipWrapperStyle,
  fmtUSDCompact,
  fmtInt,
  toNumberSafe,
  tooltipContentStyle,
  tooltipLabelStyle,
  axisTickStyle,
} from "@/lib/format";

// ------------------ types ------------------
type SectorRow = {
  sector_name: string;
  project_count: number;
  total_disb_usd: number;
  pct_integrated: number;  // may be 0–1 or 0–100; normalized in chart
  pct_gender_only: number;
  pct_climate_only: number;
};

type AgendaRow = {
  sector_name: string;
  donor_name: string;
  donor_disb_usd: number;
  proj_count: number;
  pct_integrated: number;
  pct_gender_only: number;
  pct_climate_only: number;
};

type PriorityRow = {
  sector_name: string;
  donor_name: string;
  donor_disb_usd: number;
  sector_integrated: number;
};

type SectorsAPI = {
  topSectors: SectorRow[];
  years: string[];
};

// ------------------ helpers ------------------
function describeFiltersText(
  startYear: "all" | number,
  endYear: "all" | number,
) {
  const s = startYear === "all" ? null : String(startYear);
  const e = endYear === "all" ? null : String(endYear);
  if (s && e) return `${s}–${e}`;
  if (s) return `from ${s}`;
  if (e) return `through ${e}`;
  return "all years";
}

// label for stacked bars
const renderPercentLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (value == null) return null;
  if (value < 4) return null; // avoid clutter on tiny segments
  return (
    <text
      x={x + width / 2}
      y={y + height / 2 + 4}
      fill="white"
      textAnchor="middle"
      fontSize={11}
      fontWeight={500}
    >
      {value.toFixed(1)}%
    </text>
  );
};

export default function SectorsPage() {
  const [mounted, setMounted] = useState(false);
  // backend data
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [agenda, setAgenda] = useState<AgendaRow[]>([]);

  // UI filter state (what user picks)
  const [uiStartYear, setUiStartYear] = useState<"all" | number>("all");
  const [uiEndYear, setUiEndYear] = useState<"all" | number>("all");

  // applied filters (used for fetching)
  const [startYear, setStartYear] = useState<"all" | number>("all");
  const [endYear, setEndYear] = useState<"all" | number>("all");

  // loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // view state
  const [gapMode, setGapMode] = useState<"low" | "high">("low");
  const base =
    "px-3 py-1 text-xs rounded-md border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1";

  const isLow = gapMode === "low";
  const isHigh = gapMode === "high";

  const filterDesc = describeFiltersText(startYear, endYear);

  // FETCH from the two routes (summary + agenda leaders)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const first = initialLoading;
      if (!first) setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startYear !== "all") params.set("startYear", String(startYear));
        if (endYear !== "all") params.set("endYear", String(endYear));
        const qs = params.size ? `?${params.toString()}` : "";

        const [secRes, agendaRes] = await Promise.all([
          fetch(`/api/sectors/summary${qs}`),
          fetch(`/api/sectors/agenda-setters${qs}`),
        ]);
        const secJson: SectorsAPI = await secRes.json();
        const agJson: { leaders: AgendaRow[] } = await agendaRes.json();
        if (cancelled) return;

        const normSectors: SectorRow[] = (secJson.topSectors ?? []).map((r) => ({
          sector_name: r.sector_name ?? "Unknown",
          project_count: Number(r.project_count ?? 0),
          total_disb_usd: Number(r.total_disb_usd ?? 0),
          pct_integrated: Number(r.pct_integrated ?? 0),
          pct_gender_only: Number(r.pct_gender_only ?? 0),
          pct_climate_only: Number(r.pct_climate_only ?? 0),
        }));

        const normYears = (secJson.years ?? [])
          .map((y) => Number(y))
          .filter((y) => !Number.isNaN(y))
          .sort((a, b) => a - b);

        const normAgenda: AgendaRow[] = (agJson.leaders ?? []).map((r) => ({
          sector_name: r.sector_name ?? "Unknown",
          donor_name: r.donor_name ?? "—",
          donor_disb_usd: Number(r.donor_disb_usd ?? 0),
          proj_count: Number(r.proj_count ?? 0),
          pct_integrated: Number(r.pct_integrated ?? 0),
          pct_gender_only: Number(r.pct_gender_only ?? 0),
          pct_climate_only: Number(r.pct_climate_only ?? 0),
        }));

        setSectors(normSectors);
        setYears(normYears);
        setAgenda(normAgenda);
      } catch (e) {
        console.error("sectors load error:", e);
        if (!cancelled) {
          setSectors([]);
          setAgenda([]);
        }
      } finally {
        if (!cancelled) {
          if (initialLoading) setInitialLoading(false);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [startYear, endYear, initialLoading]);

  // ---------- KPIs ----------
  const totalDisb = useMemo(() => {
    const sum = (sectors ?? []).reduce(
      (acc, r) => acc + (Number(r.total_disb_usd) || 0),
      0
    );
    return fmtUSDCompact(sum);
  }, [sectors]);

  const mostIntegrated = useMemo(() => {
    if (!sectors.length) return null;
    return sectors.reduce((best, curr) =>
      curr.pct_integrated > best.pct_integrated ? curr : best
    );
  }, [sectors]);

  const lowIntegration = useMemo(() => {
    if (!sectors.length) return null;
    const sortedByUsd = [...sectors].sort(
      (a, b) => a.total_disb_usd - b.total_disb_usd
    );
    const mid = Math.floor(sortedByUsd.length / 2);
    const rich = sortedByUsd.slice(mid);
    const pool = rich.length ? rich : sectors;
    return pool.reduce((worst, curr) =>
      curr.pct_integrated < worst.pct_integrated ? curr : worst
    );
  }, [sectors]);

  // ---------- Chart Data ----------
  const chartData = useMemo(() => {
    return [...sectors]
      .sort((a, b) => b.total_disb_usd - a.total_disb_usd)
      .map((s) => {
        // accept 0–1 or 0–100; normalize to 0–100 and re-scale to sum=100
        const pi = s.pct_integrated > 1 ? s.pct_integrated : s.pct_integrated * 100;
        const pg = s.pct_gender_only > 1 ? s.pct_gender_only : s.pct_gender_only * 100;
        const pc = s.pct_climate_only > 1 ? s.pct_climate_only : s.pct_climate_only * 100;
        const total = pi + pg + pc || 1;
        const climate = (pc / total) * 100;
        const gender = (pg / total) * 100;
        const integrated = (pi / total) * 100;
        return {
          sector: s.sector_name,
          climate_only: Number(climate.toFixed(1)),
          gender_only: Number(gender.toFixed(1)),
          integrated: Number(integrated.toFixed(1)),
          usd: s.total_disb_usd,
        };
      });
  }, [sectors]);

  // -------- insights: sector profile --------
  const sectorInsightNode = useMemo(() => {
    if (!chartData.length) return null;

    const leader = chartData.reduce((a, b) => (b.integrated > a.integrated ? b : a));
    const laggard = chartData.reduce((a, b) => (b.integrated < a.integrated ? b : a));

    const totalUsd = chartData.reduce((s, r) => s + (r.usd || 0), 0);
    const avg =
      totalUsd > 0
        ? chartData.reduce((s, r) => s + (r.integrated * (r.usd || 0)), 0) / totalUsd
        : chartData.reduce((s, r) => s + r.integrated, 0) / chartData.length;

    let priority: typeof chartData[number] | null = null;
    if (totalUsd > 0) {
      const withShare = chartData
        .map(r => ({ ...r, share: (r.usd || 0) / totalUsd }))
        .sort((a, b) => b.share - a.share);
      priority = withShare.find(r => r.share >= 0.12 && r.integrated < 35) || null;
    }
    return (
      <>
        <span>Leader: </span>
        <strong style={{ color: "var(--semantic-integrated)" }}>
          {leader.sector} ({leader.integrated.toFixed(1)}%).
        </strong>

        <span> Laggard: </span>
        <strong style={{ color: "var(--semantic-alert-color)" }}>
          {laggard.sector} ({laggard.integrated.toFixed(1)}%).
        </strong>

        {priority && (
          <>
            <span> Priority: </span>
            <strong style={{ color: "var(--series-default-color)" }}>
              {priority.sector}
            </strong>
            <span>
              {" "}has high volume but only {priority.integrated.toFixed(1)}% integrated.
            </span>
          </>
        )}

        <span> Average integration (weighted): {avg.toFixed(1)}%.</span>
      </>
    );
  }, [chartData]);

  // ---------- Tables ----------
  const sectorsByDisbTop10 = useMemo(
    () =>
      [...sectors]
        .sort((a, b) => b.total_disb_usd - a.total_disb_usd)
        .slice(0, 10),
    [sectors]
  );

  const sectorColumns = [
    {
      key: "sector_name",
      header: "Sector",
      render: (row: SectorRow) => (
        <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
          {row.sector_name}
        </div>
      ),
    },
    {
      key: "total_disbursement",
      header: "Disbursement (USD)",
      render: (row: SectorRow) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {fmtUSDCompact(Number(toNumberSafe(row.total_disb_usd)))}
        </span>
      ),
    },
    {
      key: "project_count",
      header: "Projects",
      render: (row: SectorRow) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {fmtInt(row.project_count as any)}
        </span>
      ),
    },
    {
      key: "integrated_pct",
      header: "Integrated %",
      render: (row: SectorRow) => (
        <span style={{ color: "var(--semantic-integrated)" }}>
          {(
            row.pct_integrated > 1 ? row.pct_integrated : row.pct_integrated * 100
          ).toFixed(1)}
          %
        </span>
      ),
    },
    {
      key: "gender_pct",
      header: "Gender only %",
      render: (row: SectorRow) => (
        <span style={{ color: "var(--semantic-genderOnly)"}}>
          {(
            row.pct_gender_only > 1 ? row.pct_gender_only : row.pct_gender_only * 100
          ).toFixed(1)}
          %
        </span>
      ),
    },
    {
      key: "climate_pct",
      header: "Climate only %",
      render: (row: SectorRow) => (
        <span style={{ color: "var(--semantic-climateOnly)" }}>
          {(
            row.pct_climate_only > 1 ? row.pct_climate_only : row.pct_climate_only * 100
          ).toFixed(1)}
          %
        </span>
      ),
    },
  ];

  const priorityRows = useMemo<PriorityRow[]>(() => {
    if (!sectors.length) return [];
    const byPct = [...sectors].sort((a, b) =>
      gapMode === "low"
        ? a.pct_integrated - b.pct_integrated
        : b.pct_integrated - a.pct_integrated
    );
    return byPct.map((s) => {
      const match = agenda.find((a) => a.sector_name === s.sector_name);
      return {
        sector_name: s.sector_name,
        donor_name: match?.donor_name ?? "—",
        donor_disb_usd: match?.donor_disb_usd ?? 0,
        sector_integrated: s.pct_integrated,
      };
    }).slice(0, 10);
  }, [sectors, agenda, gapMode]);

  const colByKey = Object.fromEntries(
    sectorColumns.map((c) => [c.key, c] as const)
  );

  const priorityColumns = [
    { ...colByKey["sector_name"] },
    {
      key : "integrated_pct",
      header: "Overall Sector integration %",
      render: (r: PriorityRow) => {
        const v = r.sector_integrated > 1 ? r.sector_integrated : r.sector_integrated * 100;
        return <span style={{ color: "var(--semantic-integrated)" }}>{v.toFixed(1)}%</span>;
      },
    },
    {
      key: "donor_name",
      header: "Lead donor",
      render: (r: PriorityRow) => (
        <span className="inline-block max-w-[160px] truncate">{r.donor_name}</span>
      ),
    },
    {
      key : "total_disbursement",
      header: "Lead donor disbursed Amt",
      render: (r: PriorityRow) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {fmtUSDCompact(Number(toNumberSafe(r.donor_disb_usd)))}
        </span>
      ),
    },
  ];

  // ===== insights for bottom cards =====
  const sectorsTableInsightNode = useMemo(() => {
    if (!sectors.length) return null;
    const toPct = (v: number) => (v > 1 ? v : v * 100);

    const sorted = [...sectors].sort((a, b) => b.total_disb_usd - a.total_disb_usd);
    const top10 = sorted.slice(0, 10);
    const top3 = sorted.slice(0, 3);

    const totalUsd =
      sectors.reduce((s, r) => s + (Number(r.total_disb_usd) || 0), 0) || 1;

    const shareTop3 =
      (top3.reduce((s, r) => s + (Number(r.total_disb_usd) || 0), 0) / totalUsd) *
      100;

    const leader = sorted[0];
    const medTop10 = (() => {
      const arr = top10.map(s => toPct(s.pct_integrated)).sort((a, b) => a - b);
      return arr[Math.floor(arr.length / 2)] ?? 0;
    })();

    const quickWin = top10.find(s => toPct(s.pct_integrated) < 35); // tweak threshold anytime

    return (
      <>
        <span> The median integration rate (Top 10) is : {medTop10.toFixed(1)}%.</span>
        <span> The top 3 sectors: </span>
        <strong style={{ color: "var(--text-primary)" }}>
          {top3.map(s => s.sector_name).join(", ")}
        </strong>
        <span> : concentrate {shareTop3.toFixed(1)}% of disbursement. </span>

        <span> The sector with the highest disbursement is </span>
        <strong style={{ color: "var(--series-default-color)" }}>
          {leader.sector_name}
        </strong>
        <span>
          {" "}({fmtUSDCompact(leader.total_disb_usd)})
          but only has{" "}
          <strong style={{ color: "var(--semantic-alert-color)" }}>
            {toPct(leader.pct_integrated).toFixed(1)}% integrated
          </strong>
        </span>
      </>
    );
  }, [sectors]);

  const donorBySectorInsightNode = useMemo(() => {
    if (!priorityRows.length) return null;
    const toPct = (v: number) => (v > 1 ? v : v * 100);

    const rows = priorityRows.map(r => ({
      ...r,
      pct: toPct(r.sector_integrated),
    }));

    const median = (() => {
      const arr = rows.map(r => r.pct).sort((a, b) => a - b);
      return arr[Math.floor(arr.length / 2)] ?? 0;
    })();

    const lowCandidates = rows.filter(r => r.pct < 35);
    const target =
      lowCandidates.sort((a, b) => b.donor_disb_usd - a.donor_disb_usd)[0] ||
      (gapMode === "low" ? rows[0] : rows[rows.length - 1]);

    const modeText = gapMode === "low" ? "Low" : "High";

    return (
      <>
        <span>
          {modeText} mode — median integration across shown sectors:{" "}
          {median.toFixed(1)}%.{" "}
        </span>
        <span style={{ color: "var(--series-default-color)" }}>
          <strong>
          The best coordination target would be : {" "}
          {target.sector_name}
        </strong>
        </span>
        <span>
          {" "} (lead: {target.donor_name}, {fmtUSDCompact(target.donor_disb_usd)},{" "}
          {target.pct.toFixed(1)}% integrated).
        </span>
      </>
    );
  }, [priorityRows, gapMode]);

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

  // ---------- render ----------
  if (errorMsg) {
    return (
      <div
        className="p-6 min-h-screen"
        style={{ backgroundColor: "var(--page-bg-color)", color: "var(--text-primary)" }}
      >
        <p className="text-red-500">{errorMsg}</p>
      </div>
    );
  }

  if (!mounted) return null;
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--page-bg-color)", color: "var(--text-primary)" }}
    >
      {/* full-window loader */}
      {initialLoading && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3"
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
          <div
            className="text-xs tracking-wide"
            style={{ color: "var(--text-primary)" }}
          >
            Loading sector view…This will take a few seconds...
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
              className="font-extrabold tracking-tight type-page-title"
              style={{
                backgroundImage: "linear-gradient(90deg, var(--semantic-integrated), var(--semantic-climateOnly))",
                WebkitBackgroundClip: "text",
                color: "transparent",
                borderColor: "var(--border-card-shadow)",
              }}
            >
              <strong>SECTOR FOCUS</strong>
            </div>
            <div className="max-w-5xl text-[13px]"
              style={{ color: "var(--text-primary)", lineHeight: 1.5 }}>
              <p>Explore which sectors most effectively integrate climate × gender and where the gaps remain. The Integration Profile shows each sector’s split of climate-only, gender-only, and integrated (both) projects, while the tables spotlight big-dollar sectors and the lead donor in each.</p>
            </div>
          </div>

          {/* filters */}
          <div className="flex flex-wrap items-end gap-4 text-[12px] rounded-xl border bg-muted/60 p-4"
            style={{
              backgroundColor: "var(--card-bg-color)",
              borderColor: "var(--card-border-weak)",
              color: "var(--text-primary)",
              boxShadow: "var(--card-shadow-lg)",
            }}>
            <span>
              <strong style={{ color: "var(--semantic-alert-color)" }}>
                These filters drive all KPIs, tables, and charts in this view.
              </strong>
            </span>
            {/*start year*/}
            <div className="flex flex-col">
              <label className="text-[11px] mb-1" style={{ color: "var(--text-primary)" }}>
                <strong>START YEAR</strong>
              </label>
              <select
                className="rounded-md border px-2 py-[6px] bg-transparent"
                style={{
                  borderColor: "var(--card-border-weak)", color: "var(--text-primary)",
                  background: "var(--card-bg-color)"
                }}
                value={uiStartYear === "all" ? "all" : uiStartYear}
                onChange={(e) =>
                  setUiStartYear(e.target.value === "all" ? "all" : Number(e.target.value))
                }
              >
                <option value="all">All</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {/* end year */}
            <div className="flex flex-col">
              <label className="text-[11px] mb-1" style={{ color: "var(--text-primary)" }}>
                END YEAR
              </label>
              <select
                className="rounded-md border px-2 py-[6px] bg-transparent"
                style={{ borderColor: "var(--card-border-weak)", color: "var(--text-primary)",
                  background: "var(--card-bg-color)" }}

                value={uiEndYear === "all" ? "all" : uiEndYear}
                onChange={(e) =>
                  setUiEndYear(e.target.value === "all" ? "all" : Number(e.target.value))
                }
              >
                <option value="all">All</option>
                {years.map((y) => (
                  <option key={y} value={y}>
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
              style={{ borderColor: "var(--card-border-weak)", color: "var(--text-secondary)" }}
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <Section
        title="PORTFOLIO SNAPSHOT"
        subtitle="This provides a high level overview of the sector' data under the current filters.">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            accentIcon={<DollarSign className="h-4 w-4" />}
            label="Total Disbursement (USD)"
            sub="Across visible sectors in this slice"
            accentBg={"var(--semantic-climateOnly)"}
            value={totalDisb}
          />
          <StatCard
            accentIcon={<Leaf className="h-5 w-5" />}
            label="Most Integrated Sector"
            value={mostIntegrated ? `${(mostIntegrated.pct_integrated > 1 ? mostIntegrated.pct_integrated : mostIntegrated.pct_integrated * 100).toFixed(1)}%` : "—"}
            sub={mostIntegrated ? mostIntegrated.sector_name : "—"}
            valueColor="var(--semantic-integrated)"
          />
          <StatCard
            accentIcon={<Target className="h-5 w-5" />}
            label="Low-Integration Sector"
            value={lowIntegration ? `${(lowIntegration.pct_integrated > 1 ? lowIntegration.pct_integrated : lowIntegration.pct_integrated * 100).toFixed(1)}%` : "—"}
            sub={lowIntegration ? lowIntegration.sector_name : "—"}
            valueColor="var(--semantic-alert-color)"
          />
          <StatCard
            accentIcon={<Layers3 className="h-5 w-5" />}
            label="# Focus Areas"
            value={sectors.length ? sectors.length.toString() : "—"}
            sub="Sectors captured in this view"
          />
        </div>
      </Section>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 md:px-8 lg:px-16 py-8 space-y-8">
        <Section
          matchParentWidth
          title="PORTFOLIO DEEPDIVE"
          subtitle="Explore sector integration patterns to identify strategic opportunities."
        >
          <div className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
            ** Insight callouts use fixed phrasing, but names and figures update with the filters used. Treat them as a live snapshot rather than a static report.
          </div>
          {/* chart with inline loader */}
          <ChartCard
            loading={loading}
            title="INTEGRATION PROFILE BY SECTOR"
            subtitle="Bars show how each sector’s tagged projects break down: climate-only, gender-only, or fully integrated (both). Normalized to 100%."
            insight={sectorInsightNode}
          >
            {chartData.length === 0 ? (
              <div className="text-center text-[12px] py-16" style={{ color: "var(--text-secondary)" }}>
                {loading ? "Loading…" : "No data"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 160, right: 20, top: 10, bottom: 10 }}
                  stackOffset="expand"
                >
                  <CartesianGrid stroke={"var(--grid-weak)"} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={axisTickStyle()}
                    allowDecimals={false}
                    tickFormatter={(v) => `${v}%`}
                  >
                    <Label
                      value="% of projects in sector"
                      position="bottom"
                      offset={10}
                      style={{ fill: "var(--axis-color)", fontSize: 11 }}
                    />
                  </XAxis>
                  <YAxis
                    type="category"
                    dataKey="sector"
                    interval={0}
                    tick={axisTickStyle()}
                    width={220}
                  />
                  <Tooltip
                    wrapperStyle={tooltipWrapperStyle()}
                    contentStyle={tooltipContentStyle()}
                    labelStyle={tooltipLabelStyle()}
                    formatter={(v: number, name: string) => {
                      const vv = (typeof v === "number" && (v as any).toFixed) ? (v as any).toFixed(1) : v;
                      if (name === "integrated") return [`${vv}%`, "Integrated (both)"];
                      if (name === "gender_only") return [`${vv}%`, "Gender only"];
                      if (name === "climate_only") return [`${vv}%`, "Climate only"];
                      return v as any;
                    }}
                  />
                  <Legend verticalAlign="bottom" align="left" />
                  <Bar
                    dataKey="climate_only"
                    stackId="a"
                    fill={"var(--semantic-climateOnly)"}
                    name="Climate only"
                    barSize={16}
                    radius={[4, 4, 4, 4]}
                  >
                    <LabelList dataKey="climate_only" content={renderPercentLabel} />
                  </Bar>
                  <Bar
                    dataKey="gender_only"
                    stackId="a"
                    fill={"var(--semantic-genderOnly)"}
                    name="Gender only"
                    barSize={16}
                  >
                    <LabelList dataKey="gender_only" content={renderPercentLabel} />
                  </Bar>
                  <Bar
                    dataKey="integrated"
                    stackId="a"
                    fill={"var(--semantic-integrated)"}
                    name="Integrated (both)"
                  >
                    <LabelList dataKey="integrated" content={renderPercentLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* tables row */}
          <div className="grid gap-4 lg:grid-cols-2 py-8">
            {/* left table */}
            <ChartCard
              title="TOP SECTORS BY DISBURSEMENT"
              subtitle={`Sorted by disbursement.`}
              insight={sectorsTableInsightNode}
            >
              {!sectorsByDisbTop10.length ? (
                <div className="text-center text-[12px] py-16" style={{ color: "var(--text-secondary)" }}>
                  No sector data.
                </div>
              ) : (
                <DataTableLite<SectorRow>
                  columns={sectorColumns}
                  rows={sectorsByDisbTop10}
                  rowKey={(row, idx) => `${row.sector_name}-${idx}`}
                  maxHeight={260}
                />
              )}
            </ChartCard>

            {/* right table */}
            <ChartCard
              loading={loading}
              title="DONOR INTEGRATION BY SECTOR"
              subtitle="This table shows donors that currently dominate that sector and how integrated they are. The data is sorted by overall sector integration %"
              insight={donorBySectorInsightNode}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  If the lead donor is low on integrated %, that’s an immediate coordination target.
                </p>
                <div className="inline-flex rounded-lg bg-muted/40 border border-border/40 overflow-hidden">
                  <button
                    type="button"
                    aria-pressed={isLow}
                    onClick={() => setGapMode("low")}
                    className={base}
                    style={{
                      backgroundColor: isLow ? "var(--semantic-integrated)" : "transparent",
                      borderColor: isLow ? "var(--semantic-alert-color)" : "var(--card-border-weak)",
                      color: isLow ? "var(--semantic-alert-color)" : "var(--text-secondary)",
                      boxShadow: isLow ? "0 0 0 2px color-mix(in oklch, var(--semantic-alert-color) 30%, transparent)" : "none",
                    }}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    aria-pressed={isHigh}
                    onClick={() => setGapMode("high")}
                    className={base}
                    style={{
                      backgroundColor: isHigh ? "var(--semantic-integrated)" : "transparent",
                      borderColor: isHigh ? "var(--semantic-integrated)" : "var(--card-border-weak)",
                      color: isHigh ? "var(--text-primary)" : "var(--text-secondary)",
                      boxShadow: isHigh ? "0 0 0 2px color-mix(in oklch, var(--semantic-integrated) 30%, transparent)" : "none",
                    }}
                  >
                    High
                  </button>
                </div>
              </div>

              {!priorityRows.length ? (
                <div className="text-center text-[12px] py-16" style={{ color: "var(--text-secondary)" }}>
                  No data for this filter.
                </div>
              ) : (
                  <DataTableLite<PriorityRow>
                    //@ts-ignore
                  columns={priorityColumns}
                  rows={priorityRows}
                  rowKey={(row, idx) => `${row.sector_name}-${row.donor_name}-${idx}`}
                  maxHeight={260}
                />
              )}
            </ChartCard>
          </div>
        </Section>
      </div>
    </div>
  );
}

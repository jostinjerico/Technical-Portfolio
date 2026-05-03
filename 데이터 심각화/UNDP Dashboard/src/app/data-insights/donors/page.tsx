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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Label,
  LabelList,
  ReferenceLine,
} from "recharts";

import {
  fmtUSDCompact,
  fmtInt,
  toNumberSafe,
  axisTickStyle,
  tooltipWrapperStyle,
  tooltipContentStyle,
  tooltipLabelStyle,
  safeJson,
} from "@/lib/format";

import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTableLite } from "@/components/DataTableLite";
import {ArchetypeLegendExplainer} from "@/components/ArchetypeLegendExplainer";
import { Section } from "@/components/Section";

import { DollarSign, Layers, Users, Briefcase, Search } from "lucide-react";

/* ====================== types ====================== */

type Overall = {
  total_disbursement_usd: string;
  total_commitment_usd: string;
  num_donors: string;
  num_projects?: string;
};

type DonorRow = {
  donor_name: string;
  archetype: string;
  total_disbursement: string | number;
  total_commitment: string | number;
  project_count: string | number;
  regions_covered: number;
  climate_only_pct?: number;
  gender_only_pct?: number;
  both_pct?: number;
};

type TrendPointRaw = {
  year: string;
  total_disbursement_usd: string;
  project_count: string;
};

type CompareDonor = {
  donor_name: string;
  pct_integrated: number;
  pct_gender_only: number;
  pct_climate_only: number;
};

/* ====================== helpers ====================== */
function describeFiltersText(startYear: string, endYear: string, archetype: string) {
  const yearPart =
    startYear && endYear
      ? `${startYear}–${endYear}`
      : startYear
      ? `from ${startYear}`
      : endYear
      ? `through ${endYear}`
      : "all years";
  const archPart = archetype ? `, archetype: ${archetype}` : "";
  return `${yearPart}${archPart}`;
}

/* ====================== page ====================== */

export default function DonorsPage() {
  const [mounted, setMounted] = useState(false);

  /* ====== global filters ====== */
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [selectedArchetype, setSelectedArchetype] = useState("");

  // draft inputs for sticky header
  const [draftStartYear, setDraftStartYear] = useState("");
  const [draftEndYear, setDraftEndYear] = useState("");
  const [draftArchetype, setDraftArchetype] = useState("");

  /* ====== data state ====== */
  const [overall, setOverall] = useState<Overall | null>(null);
  const [donorsRaw, setDonorsRaw] = useState<DonorRow[]>([]);
  const [trend, setTrend] = useState<
    { year: string; usdTotal: number; projectCount: number }[]
  >([]);
  const [regions, setRegions] = useState<{ region: string; total: number }[]>([]);
  const [thematicRaw, setThematicRaw] = useState<any[]>([]);
  
  const [allArchetypes, setAllArchetypes] = useState<string[]>([]);
  const [allYears, setAllYears] = useState<string[]>([]);

  const accent = selectedArchetype?.toLowerCase().includes("integrat")
  ? "var(--semantic-integrated)"
  : selectedArchetype?.toLowerCase().includes("gender")
  ? "var(--semantic-genderOnly)"
  : selectedArchetype?.toLowerCase().includes("climate")
  ? "var(--semantic-climateOnly)"
  : "var(--series-default-color)";

  const accentStyle = { ["--accent" as any]: accent } as React.CSSProperties;
  

  /* ====== donor comparison picks ====== */
  const [donorA, setDonorA] = useState("");
  const [donorB, setDonorB] = useState("");
  const [donorC, setDonorC] = useState("");
  const [donorD, setDonorD] = useState("");
  const [compareDonors, setCompareDonors] = useState<CompareDonor[]>([]);
  const [globalIntegratedAvg, setGlobalIntegratedAvg] = useState<number | null>(
    null
  );
  const [compareSearch, setCompareSearch] = useState("");

  /* ====== flags ====== */
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  

  useEffect(() => setMounted(true), []);

  /* ====================== fetch summary + analytics ====================== */
  useEffect(() => {
    const sp = new URLSearchParams();
    if (startYear) sp.set("startYear", startYear);
    if (endYear) sp.set("endYear", endYear);
    if (selectedArchetype) sp.set("archetype", selectedArchetype);
    const qs = sp.toString() ? `?${sp.toString()}` : "";

    const spNoArch = new URLSearchParams();
    if (startYear) spNoArch.set("startYear", startYear);
    if (endYear) spNoArch.set("endYear", endYear);
    const qsNoArch = spNoArch.toString() ? `?${spNoArch.toString()}` : "";

    setLoadingSummary(true);
    setLoadingAnalytics(true);
    setInitialLoading(true);
    setErrorMsg(null);

    let cancelled = false;

    Promise.all([
      fetch(`/api/donors/summary${qs}`).then(safeJson),
      fetch(`/api/donors/summary${qsNoArch}`).then(safeJson), // unfiltered by archetype (for options)
      fetch(`/api/donors/analytics${qs}`).then(safeJson),
    ])
      .then(([summaryData,optionsData, analyticsData]) => {
        if (cancelled) return;

        /* -------- summary -------- */
        if (summaryData && !summaryData.error) {
          const totals = summaryData.totals ?? {};
          setOverall({
            total_disbursement_usd: totals.total_disbursement ?? "0",
            total_commitment_usd: totals.total_commitment ?? "0",
            num_donors: totals.donors ?? "0",
            num_projects: totals.projects ?? "0",
          });

          const allOpts = (optionsData?.archetypes ?? []).map((a: any) => a.archetype);
          setAllArchetypes(allOpts);
        }

        /* -------- analytics -------- */
        if (analyticsData && !analyticsData.error) {
          const donors: DonorRow[] = (analyticsData.donors ??
            analyticsData.rows ??
            []).map((d: any) => ({
            donor_name: d.donor_name,
            archetype: d.archetype,
            total_disbursement: d.total_disbursement,
            total_commitment: d.total_commitment,
            project_count: d.project_count,
            regions_covered: d.regions_covered ?? 0,
            climate_only_pct: Number(d.climate_only_pct ?? 0),
            gender_only_pct: Number(d.gender_only_pct ?? 0),
            both_pct: Number(d.integrated_pct ?? 0),
          }));
          setDonorsRaw(donors);

          // trend
          const rawTrend: TrendPointRaw[] =
            analyticsData.disbursementTrend ?? [];
          const cleanedTrend = rawTrend.map((row) => ({
            year: row.year,
            usdTotal: toNumberSafe(row.total_disbursement_usd),
            projectCount: toNumberSafe(row.project_count),
          }));
          setTrend(cleanedTrend);

          // regions
          const rawRegions: any[] =
            analyticsData.regionBreakdown ||
            analyticsData.regions ||
            analyticsData.top_regions ||
            analyticsData.topRegions ||
            [];
          const cleanedRegions = rawRegions
            .map((r: any) => {
              const name =
                r.region_name ||
                r.region ||
                r.location ||
                r.area ||
                "Unspecified";
              const num = toNumberSafe(
                r.total_disbursement ||
                  r.total ||
                  r.amount ||
                  r.usd ||
                  r.value ||
                  r.total_disbursement_usd ||
                  0
              );
              return { region: name, total: num };
            })
            .filter((r) => r.region !== "Unspecified" || r.total > 0)
            .sort((a, b) => b.total - a.total);
          setRegions(cleanedRegions);

          // thematic / sectors
          const thematicCandidate =
            analyticsData.thematicMixStats ||
            analyticsData.sectors ||
            analyticsData.thematic_mix ||
            [];
          setThematicRaw(thematicCandidate);

          // years (only set once, from full response)
          setAllYears((prev) => {
            if (prev.length > 0) return prev;
            const yrs = Array.from(new Set(cleanedTrend.map((t) => t.year)));
            yrs.sort((a, b) => Number(a) - Number(b));
            return yrs;
          });
        } else if (analyticsData?.error) {
          setErrorMsg(analyticsData.error);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setErrorMsg("Failed to load donor data.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSummary(false);
          setLoadingAnalytics(false);
          setInitialLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [startYear, endYear, selectedArchetype]);

  

  /* ====================== derived data ====================== */

  const donorsFiltered = donorsRaw;

  // seed comparison pickers from filtered donors
  useEffect(() => {
    if (!donorsFiltered.length) return;
    // first 2 mandatory
    setDonorA(donorsFiltered[0]?.donor_name ?? "");
    setDonorB(donorsFiltered[1]?.donor_name ?? "");
    // last 2 optional
    setDonorC("");
    setDonorD("");
  }, [donorsFiltered]);

  // archetype counts
const archetypeCounts = useMemo(() => {
  if (!donorsRaw?.length) return [];
  const map = new Map<string, number>();
  donorsRaw.forEach(d => {
    const name = d.archetype || "Unspecified";
    map.set(name, (map.get(name) || 0) + 1);
  });
  return Array.from(map, ([name, donors]) => ({ name, donors }))
    .sort((a, b) => b.donors - a.donors);
}, [donorsRaw]);

  // trend enriched
  const trendEnriched = useMemo(() => {
    return trend.map((t) => {
      const avg = t.projectCount > 0 ? t.usdTotal / t.projectCount : 0;
      return {
        year: Number(t.year),
        project_count: t.projectCount,
        total_disbursement_usd: t.usdTotal,
        avg_project_usd: avg,
      };
    });
  }, [trend]);

  // thematic / sector data
  const thematicMixPctData = useMemo(() => {
    if (!thematicRaw || thematicRaw.length === 0) return [];

    // shape 1: single-row thematic
    if (
      Array.isArray(thematicRaw) &&
      thematicRaw.length === 1 &&
      (thematicRaw[0].both_count != null ||
        thematicRaw[0].climate_only_count != null)
    ) {
      const row = thematicRaw[0];
      const items = [
        {
          key: "both",
          label: "Climate & Gender together",
          value: toNumberSafe(row.both_count),
        },
        {
          key: "climate_only",
          label: "Climate only",
          value: toNumberSafe(row.climate_only_count),
        },
        {
          key: "gender_only",
          label: "Gender only",
          value: toNumberSafe(row.gender_only_count),
        },
        {
          key: "neither",
          label: "Neither focus",
          value: toNumberSafe(row.neither_count),
        },
      ];
      const total = items.reduce((s, r) => s + r.value, 0);
      if (!total) return [];
      return items.map((it) => ({
        theme: it.label,
        pct: (it.value / total) * 100,
      }));
    }

    // shape 2: sectors
    if (
      Array.isArray(thematicRaw) &&
      thematicRaw.length > 0 &&
      (thematicRaw[0].sector || thematicRaw[0].theme)
    ) {
      const items = thematicRaw.map((r: any) => ({
        theme: r.sector || r.theme,
        count: toNumberSafe(r.count || r.total || r.value),
      }));
      const total = items.reduce((s, r) => s + r.count, 0);
      if (!total) return [];
      return items.map((it) => ({
        theme: it.theme,
        pct: (it.count / total) * 100,
      }));
    }

    return [];
  }, [thematicRaw]);

  const filterDesc = describeFiltersText(
    startYear,
    endYear,
    selectedArchetype
  );

  const yearsAvailable = useMemo(() => {
    if (allYears.length > 0) return allYears;
    const ys = Array.from(new Set(trend.map((t) => t.year)));
    ys.sort((a, b) => Number(a) - Number(b));
    return ys;
  }, [allYears, trend]);

  // pie data
  const pieData = useMemo(() => {
    const totalFromSummary = archetypeCounts.reduce(
      (s, r) => s + r.donors,
      0
    );
    if (!totalFromSummary) return [];

    return archetypeCounts.map((row) => ({
      name: row.name,
      donors: row.donors,
      value: (row.donors / totalFromSummary) * 100,
      dim: !!selectedArchetype && row.name !== selectedArchetype,
    }));
  }, [archetypeCounts, selectedArchetype]);



  /* ======== richer insights ======== */

  const fundingVsProjectsInsight = useMemo(() => {
    if (!trendEnriched.length) return "";
    const sorted = [...trendEnriched].sort((a, b) => a.year - b.year);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const projDelta = last.project_count - first.project_count;
    const moneyDelta = last.total_disbursement_usd - first.total_disbursement_usd;
    const projDir = projDelta >= 0 ? "increased" : "fell";
    const moneyDir = moneyDelta >= 0 ? "rose" : "declined";
    return `Project volume ${projDir} from ${fmtInt(
      first.project_count
    )} in ${first.year} to ${fmtInt(
      last.project_count
    )} in ${last.year}, while disbursements ${moneyDir} to ${fmtUSDCompact(
      last.total_disbursement_usd
    )}.`;
  }, [trendEnriched]);

  const avgPerProjectInsight = useMemo(() => {
    if (!trendEnriched.length) return "";
    const sorted = [...trendEnriched].sort((a, b) => a.year - b.year);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const firstAvg = first.avg_project_usd ?? 0;
    const lastAvg = last.avg_project_usd ?? 0;
    if (!firstAvg) {
      return `Average project size in ${last.year} was ${fmtUSDCompact(
        lastAvg
      )}.`;
    }
    const diff = lastAvg - firstAvg;
    const pct = (diff / firstAvg) * 100;
    return `Average project size moved from ${fmtUSDCompact(
      firstAvg
    )} to ${fmtUSDCompact(lastAvg)}; that’s a ${pct >= 0 ? "rise" : "drop"} of ${Math.abs(
      pct
    ).toFixed(1)}% over the period.`;
  }, [trendEnriched]);

  const regionInsight = useMemo(() => {
    if (!regions || regions.length === 0) return "";
    const top = regions[0];
    const second = regions[1];
    if (!second) {
      return `${top.region} is the main destination in this slice with ${fmtUSDCompact(
        top.total
      )} disbursed.`;
    }
    const diff = top.total - second.total;
    return `${top.region} received the most (${fmtUSDCompact(
      top.total
    )}), about ${fmtUSDCompact(diff)} more than ${second.region}.`;
  }, [regions]);

  const thematicInsight = useMemo(() => {
    if (!thematicMixPctData.length) return "";
    const sorted = [...thematicMixPctData].sort((a, b) => b.pct - a.pct);
    const top = sorted[0];
    const rest = sorted.slice(1, 3);
    const restText =
      rest.length > 0
        ? `Other relevant areas: ${rest
            .map((r) => `"${r.theme}" (${r.pct.toFixed(1)}%)`)
            .join(", ")}.`
        : "";
    return `"${top.theme}" is the dominant focus at ${top.pct.toFixed(
      1
    )}%. ${restText}`;
  }, [thematicMixPctData]);

  const archetypeInsight = useMemo(() => {
    if (!pieData.length) return "";
    const top = [...pieData].sort((a, b) => b.value - a.value)[0];
    return `${top.name} are the most common in this view, accounting for ${top.value.toFixed(
      1
    )}% of the donors.`;
  }, [pieData]);

  // regions top 6
  const regionsForChart = useMemo(() => regions.slice(0, 6), [regions]);

  // KPIs
  const totalDisb = fmtUSDCompact(
    Number(overall?.total_disbursement_usd ?? 0)
  );
  const totalCommit = fmtUSDCompact(
    Number(overall?.total_commitment_usd ?? 0)
  );
  const donorCount = overall?.num_donors ?? "—";
  const projectCount = fmtInt(overall?.num_projects ?? undefined);

  // donor table columns
  const donorColumns = [
    {
      key: "donor_name",
      header: "Donor",
      render: (row: DonorRow) => (
        <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
          {row.donor_name}
        </div>
      ),
    },
    {
      key: "archetype",
      header: "Archetype",
      render: (row: DonorRow) => {
        let bg = "var(--text-secondary)";
        const low = (row.archetype || "").toLowerCase();
        if (low.includes("climate")) bg = "var(--semantic-climateOnly)";
        else if (low.includes("gender")) bg = "var(--semantic-genderOnly)";
        else if (low.includes("integrat")) bg = "var(--semantic-integrated)";
        return (
          <span
            className="text-[10px] font-medium rounded-md px-2 py-[2px] text-white inline-block"
            style={{ backgroundColor: bg, lineHeight: 1.2 }}
          >
            {row.archetype}
          </span>
        );
      },
    },
    {
      key: "total_disbursement",
      header: "Disbursement",
      render: (row: DonorRow) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {fmtUSDCompact(Number(toNumberSafe(row.total_disbursement)))}
        </span>
      ),
    },
    {
      key: "total_commitment",
      header: "Commitment",
      render: (row: DonorRow) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {fmtUSDCompact(Number(toNumberSafe(row.total_commitment)))}
        </span>
      ),
    },
    {
      key: "project_count",
      header: "Projects",
      render: (row: DonorRow) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {fmtInt(row.project_count as any)}
        </span>
      ),
    },
    {
      key: "regions_covered",
      header: "Regions",
      render: (row: DonorRow) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {row.regions_covered}
        </span>
      ),
    },
  ];

  /* ====================== comparison fetch ====================== */
  useEffect(() => {
    const picks = [donorA, donorB, donorC, donorD].filter(Boolean);
    if (!picks.length) {
      setCompareDonors([]);
      setGlobalIntegratedAvg(null);
      return;
    }

    const sp = new URLSearchParams();
    picks.forEach((dn, idx) => {
      sp.set(`donor${String.fromCharCode(65 + idx)}`, dn);
    });
    if (startYear) sp.set("startYear", startYear);
    if (endYear) sp.set("endYear", endYear);
    if (selectedArchetype) sp.set("archetype", selectedArchetype);

    setLoadingCompare(true);
    (async () => {
      try {
        const res = await fetch(`/api/donors/compare?${sp.toString()}`);
        const data = await safeJson(res);
        if (!data || data.error) {
          setCompareDonors([]);
          setGlobalIntegratedAvg(null);
          return;
        }
        const avg =
          data.globalBothPct ??
          data.globalIntegratedAvgPct ??
          data.global_avg_integrated_pct ??
          null;
        setGlobalIntegratedAvg(avg != null ? Number(avg) : null);
        const cleaned: CompareDonor[] = (data.donors ?? []).map((d: any) => ({
          donor_name: d.donor_name ?? "",
          pct_integrated: Number(
            d.both_pct ?? d.integrated_pct ?? d.pct_integrated ?? 0
          ),
          pct_gender_only: Number(d.gender_only_pct ?? 0),
          pct_climate_only: Number(d.climate_only_pct ?? 0),
        }));
        // keep only selected donors (in case backend returns more)
        const ordered = picks
          .map((p) => cleaned.find((c) => c.donor_name === p))
          .filter(Boolean) as CompareDonor[];
        setCompareDonors(ordered);
      } catch (err) {
        console.error(err);
        setCompareDonors([]);
        setGlobalIntegratedAvg(null);
      } finally {
        setLoadingCompare(false);
      }
    })();
  }, [donorA, donorB, donorC, donorD, startYear, endYear, selectedArchetype]);

  const currentComparePicks = [donorA, donorB, donorC, donorD].filter(Boolean);

  const benchmarkData = useMemo(
    () =>
      compareDonors.map((d) => ({
        donor_name: d.donor_name,
        pct_integrated: d.pct_integrated,
      })),
    [compareDonors]
  );

  const mixStackData = useMemo(
    () =>
      compareDonors.map((d) => ({
        donor_name: d.donor_name,
        climate_only: d.pct_climate_only,
        gender_only: d.pct_gender_only,
        integrated: d.pct_integrated,
      })),
    [compareDonors]
  );

  const dynamicBarSize = useMemo(() => {
    const n = benchmarkData.length;
    if (n <= 2) return 40;
    if (n === 3) return 32;
    return 24;
  }, [benchmarkData.length]);

  const benchmarkInsight = useMemo(() => {
    if (!compareDonors.length) return "";
    const best = [...compareDonors].sort(
      (a, b) => b.pct_integrated - a.pct_integrated
    )[0];
    const baseline =
      globalIntegratedAvg != null ? globalIntegratedAvg.toFixed(1) + "%" : null;
    if (baseline) {
      return `${best.donor_name} has the strongest gender-climate integration at ${best.pct_integrated.toFixed(
        1
      )}%, compared to a baseline of ${baseline}.`;
    }
    return `${best.donor_name} has the strongest gender-climate integration at ${best.pct_integrated.toFixed(
      1
    )}%.`;
  }, [compareDonors, globalIntegratedAvg]);

  const mixInsight = useMemo(() => {
    if (!compareDonors.length) return "";
    const mostClimate = [...compareDonors].sort(
      (a, b) => b.pct_climate_only - a.pct_climate_only
    )[0];
    const mostGender = [...compareDonors].sort(
      (a, b) => b.pct_gender_only - a.pct_gender_only
    )[0];
    return `${mostClimate.donor_name} is the most climate-heavy, while ${mostGender.donor_name} is the most gender-heavy in this selection.`;
  }, [compareDonors]);

  // unique donors for picker
  const uniqueDonors = useMemo(() => {
    return Array.from(new Map(donorsFiltered.map((d) => [d.donor_name, d])).values());
  }, [donorsFiltered]);

  const searchableDonors = useMemo(() => {
    if (!compareSearch) return uniqueDonors;
    const q = compareSearch.toLowerCase();
    return uniqueDonors.filter((d) =>
      d.donor_name.toLowerCase().includes(q)
    );
  }, [compareSearch, uniqueDonors]);

  /* ====================== apply / reset ====================== */
  function applyFilters() {
    setStartYear(draftStartYear);
    setEndYear(draftEndYear);
    setSelectedArchetype(draftArchetype);
  }
  function resetFilters() {
    setDraftStartYear("");
    setDraftEndYear("");
    setDraftArchetype("");
    setStartYear("");
    setEndYear("");
    setSelectedArchetype("");
  }

  if (errorMsg) {
    return (
      <div
        className="p-6 min-h-screen"
        style={{ backgroundColor: "var(--page-bg-color)", color: "var(--text-primary)",
         }}
      >
        <p className="text-red-500">{errorMsg}</p>
      </div>
    );
  }

  if (!mounted) return null;

  /* ====================== render ====================== */

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--page-bg-color)", color: "var(--text-primary)" }}
    >
      {/* window loader */}
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
            Loading donor view.This may take upto 1 minute...
          </div>
        </div>
      )}

      {/* sticky header */}
      <div
        className="sticky z-50 backdrop-blur-md"
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
              <strong>DONOR FOCUS</strong>
            </div>
            <div
              className="max-w-3xl text-[13px]"
              style={{ color: "var(--text-primary)", lineHeight: 1.5 }}
            >
              <p>Explore who funds climate × gender, where the money flows, and how donor portfolios are balanced. Donors are grouped into archetypes—Natural Integrators, Climate Specialists, Gender Specialists, and Sequential Builders—to compare strategies and spot partners and gaps</p>
            </div>
          </div>

          {/* filters row */}
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
            {/* start year */}
            <div className="flex flex-col">
              <label
                className="text-[11px] mb-1"
                style={{ color:"var(--text-primary)" }}
              >
                <strong>START YEAR</strong>
              </label>
              <select
                className="rounded-md border px-2 py-[6px] bg-transparent"
                style={{
                  borderColor: "var(--card-border-weak)", color: "var(--text-primary)" ,
                background: "var(--card-bg-color)"
                }}
                value={draftStartYear}
                onChange={(e) => setDraftStartYear(e.target.value)}
              >
                <option value="">
                  All
                </option>
                {yearsAvailable.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {/* end year */}
            <div className="flex flex-col">
              <label
                className="text-[11px] mb-1"
                style={{ color: "var(--text-primary)" }}
              >
               <strong>END YEAR</strong>
              </label>
              <select
              className="rounded-md border px-2 py-[6px] bg-transparent"
              style={{ borderColor: "var(--card-border-weak)", color: "var(--text-primary)" ,
                background: "var(--card-bg-color)" }}
              value={draftEndYear}
              onChange={(e) => setDraftEndYear(e.target.value)}
            >
              {/*use empty string, not "all" */}
              <option value="">
                All</option>
              {yearsAvailable.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            </div>

            {/* archetype (GLOBAL) */}
            <div className="flex flex-col">
              <label
                htmlFor="filter-archetype"
                className="text-[11px] mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                <strong>DONOR ARCHETYPE</strong>
              </label>
              <select
               className="rounded-md border px-2 py-[6px] bg-transparent"
              style={{ borderColor: "var(--card-border-weak)", color: "var(--text-primary)" ,
                background: "var(--card-bg-color)"
              }}
              value={draftArchetype}
              onChange={(e) => setDraftArchetype(e.target.value)}
              >
                <option value="">
                  All archetypes
                </option>
                {(allArchetypes.length ? allArchetypes : archetypeCounts.map(a => a.name))
                  .map(name => (
                    <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <button
              className="px-3 py-[6px] rounded-md text-[12px] font-semibold"
              style={{
                backgroundColor: "var(--semantic-integrated)",
                color: "var(--text-primary)",
              }}
              onClick={applyFilters}
            >
              Apply
            </button>
            <button
              className="px-3 py-[6px] rounded-md text-[12px] font-semibold border"
              style={{ borderColor: "var(--card-border-weak)", color: "var(--text-secondary)" }}
              onClick={resetFilters}
            >
              Reset
            </button>

            <div
              className="text-[11px] ml-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              {loadingSummary || loadingAnalytics
                ? "Loading…"
                : `Showing: ${filterDesc}`}
            </div>
          </div>
          <ArchetypeLegendExplainer
               items={(archetypeCounts.length
              ? archetypeCounts
              : allArchetypes.map(n => ({ name: n })))
              .map(x => (typeof x === "string" ? { name: x } : x))}
            />
          </div>
          </div>
          
        
          {/* <main className="container mx-auto px-4 md:px-8 lg:px-16 py-8 space-y-8"> */}
          <Section
                  title="PORTFOLIO SNAPSHOT"
                  subtitle="This provides a high level overview of the donors' data under the current filters."
                >
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ">
            <StatCard
              label="Total Disbursement (USD)"
              value={totalDisb}
              sub="All donors in this slice"
              accentBg={"var(--semantic-climateOnly)"}
              accentIcon={<DollarSign className="h-4 w-4" />}
              loading={loadingSummary}
            />
            <StatCard
              label="Total Commitment (USD)"
              value={totalCommit}
              sub="All donors in this slice"
              accentBg={"var(--semantic-climateOnly)"}
              accentIcon={<DollarSign className="h-4 w-4" />}
              loading={loadingSummary}
            />
            <StatCard
              label="# Unique Donors"
              value={donorCount}
              sub="Contributing Organizations"
              accentBg={"var(--semantic-integrated)"}
              accentIcon={<Users className="h-4 w-4" />}
              loading={loadingSummary}
            />
            <StatCard
              label="# Projects"
              value={projectCount}
              sub="Tagged projects in slice"
              accentBg={"var(--semantic-integrated)"}
              accentIcon={<Briefcase className="h-4 w-4" />}
              loading={loadingSummary}
            />
          </div>
          </Section>
          {/* </main> */}
        
      

      {/* main body */}
      <main className="container mx-auto px-4 md:px-8 lg:px-16 py-8 space-y-8">
        <Section
        matchParentWidth
        title="PORTFOLIO DEEPDIVE"
        subtitle="Explore funding trends, project counts, and integration by donor to identify top contributors and strategic opportunities for collaboration."
                >
          <div className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
        ** Insight callouts use fixed phrasing, but names and figures update with the filters used. Treat them as a live snapshot rather than a static report.
          </div>
        {/* SECTION 1: Who are the donors? */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
          {/* archetypes */}
          <ChartCard
            loading={loadingAnalytics}
            dense minH={240}
            title="Donor Archetypes"
            insight={archetypeInsight}
          >
            {!pieData.length ? (
              <div
                className="text-center text-[12px] py-16"
                style={{ color: "var(--text-secondary)" }}
              >
                No archetype data from API.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart margin={{ top: 30, right: 0, bottom: 0, left: 0 }}>
                    <Tooltip
                      wrapperStyle={tooltipWrapperStyle()}
                      contentStyle={tooltipContentStyle()}
                      labelStyle={tooltipLabelStyle()}
                      formatter={(val: any, _nm: string, info: any) => {
                        const d = info?.payload;
                        return [
                          `${Number(val).toFixed(1)}% (${d?.donors ?? "?"} donors)`,
                          d?.name,
                        ];
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="left"
                      height={32}
                      wrapperStyle={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                      }}
                    />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="56%"
                      innerRadius={45}
                      outerRadius={85}
                      paddingAngle={1}
                      labelLine={true}
                      label={
                        pieData.length <= 5
                          ? (e: any) => `${e.name} (${e.value.toFixed(1)}%)`
                          : false
                      }
                    >
                      {pieData.map((slice, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            slice.name.includes("Climate")
                              ? "var(--semantic-climateOnly)"
                              : slice.name.includes("Gender")
                              ? "var(--semantic-genderOnly)"
                              : slice.name.includes("Integrat")
                              ? "var(--semantic-integrated)"
                              : "#9CA3AF"
                          }
                          fillOpacity={slice.dim ? 0.25 : 1}
                          stroke={"var(--page-bg-color)"}
                          strokeWidth={1}
                        />
                      ))}
                      <Label
                        value={selectedArchetype || "All donors"}
                        position="center"
                        style={{
                          fill: "var(--text-primary)",
                          fontSize: 8,
                          textAnchor: "middle",
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </ChartCard>

          {/* top donors table */}
          <ChartCard
            loading={loadingSummary || loadingAnalytics}
            title="Top Donors by Disbursement (USD)"
            //subtitle={`Sorted by disbursement.`}
            insight={"These donors dominate tagged gender/climate finance. The archetype column hints at whether they behave as climate specialists, gender specialists, or natural integrators."}
          >
            {!donorsFiltered.length ? (
              <div
                className="text-center text-[12px] py-16"
                style={{ color: "var(--text-secondary)" }}
              >
                No donor data.
              </div>
            ) : (
              <DataTableLite
                columns={donorColumns}
                rows={donorsFiltered.slice(0, 10)}
                rowKey={(row: DonorRow, idx) => row.donor_name + "-" + idx}
                maxHeight={250}
              />
            )}
          </ChartCard>
        </div>

        {/* SECTION 2: What are they funding? */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6" style={accentStyle}>
          <ChartCard
            loading={loadingAnalytics}
            title="Project Thematic Mix"
            insight={thematicInsight}
          >
            {!thematicMixPctData.length ? (
              <div
                className="text-center text-[12px] py-16"
                style={{ color: "var(--text-secondary)" }}
              >
                No data from API (sectors/thematic) for this filter.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={thematicMixPctData}
                  margin={{ top: 20, left: 40, right: 20, bottom: 50 }}
                >
                  <CartesianGrid
                    stroke={"var(--grid-weak)"}
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="theme"
                    tick={axisTickStyle()}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  >
                    <Label
                      value="Focus Area"
                      position="bottom"
                      offset={30}
                      style={{ fill: "var(--axis-color)", fontSize: 11 }}
                    />
                  </XAxis>
                  <YAxis
                    tick={axisTickStyle()}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => v.toFixed(0) + "%"}
                    tickMargin={6}
                  >
                    <Label
                      value="% of projects"
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
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="left"
                    height={32}
                    wrapperStyle={{
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                    }}
                  />
                  <Bar
                    dataKey="pct"
                    name="% of projects"
                    fill="var(--accent)"
                    barSize={18}
                  >
                    <LabelList
                      dataKey="pct"
                      position="top"
                      formatter={(v: any) => `${Number(v).toFixed(1)}%`}
                      style={{
                        fill: "var(--text-primary)",
                        fontSize: 10,
                        fontWeight: 500,
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* regions */}
          <ChartCard
            loading={loadingAnalytics}
            title="Top Regions by Disbursement"
            insight={regionInsight}
          >
            {!regionsForChart.length ? (
              <div
                className="text-center text-[12px] py-16"
                style={{ color: "var(--text-secondary)" }}
              >
                No region data from API.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={regionsForChart}
                  layout="vertical"
                  margin={{ top: 20, left: 65, right: 20, bottom: 60 }}
                >
                  <CartesianGrid
                    stroke={"var(--grid-weak)"}
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    tick={axisTickStyle()}
                    tickFormatter={(v: number) => fmtUSDCompact(v)}
                    tickMargin={12}
                  >
                    <Label
                      value="USD Disbursed"
                      position="bottom"
                      offset={40}
                      style={{ fill: "var(--axis-color)", fontSize: 11 }}
                    />
                  </XAxis>
                  <YAxis
                    dataKey="region"
                    type="category"
                    tick={axisTickStyle()}
                    interval={0}
                    width={165}
                  >
                    <Label
                      value="Region"
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
                  />
                  <Legend
                    verticalAlign="top"
                    align="left"
                    height={32}
                    wrapperStyle={{
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                    }}
                  />
                  <Bar
                    dataKey="total"
                    name="USD Disbursed"
                    fill='var(--accent)'
                    barSize={14}
                    radius={[4, 4, 4, 4]}
                  >
                    <LabelList
                      dataKey="total"
                      position="right"
                      formatter={(v: any) => fmtUSDCompact(v)}
                      style={{
                        fill: "var(--text-primary)",
                        fontSize: 10,
                        fontWeight: 500,
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* SECTION 3: How is it evolving? */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6" style={accentStyle}>
          {/* funding vs projects */}
          <ChartCard
            loading={loadingAnalytics}
            title="Funding vs Project Volume Over Time"
            insight={fundingVsProjectsInsight}
          >
            {!trendEnriched.length ? (
              <div
                className="text-center text-[12px] py-16"
                style={{ color: "var(--text-secondary)" }}
              >
                No time-series data for this filter.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={trendEnriched}
                  margin={{ top: 60, left: 40, right: 30, bottom: 40 }}
                >
                  <CartesianGrid
                    stroke={"var(--grid-weak)"}
                    strokeDasharray="3 3"
                  />
                  <XAxis dataKey="year" tick={axisTickStyle()}>
                    <Label
                      value="Year"
                      position="bottom"
                      offset={20}
                      style={{ fill: "var(--axis-color)", fontSize: 11 }}
                    />
                  </XAxis>
                  <YAxis yAxisId="left" tick={axisTickStyle()} tickMargin={6}>
                    <Label
                      value="# projects"
                      angle={-90}
                      position="insideLeft"
                      style={{
                        fill: "var(--axis-color)",
                        fontSize: 11,
                        textAnchor: "middle",
                      }}
                    />
                  </YAxis>
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={axisTickStyle()}
                    tickFormatter={(v: number) => fmtUSDCompact(v)}
                  >
                    <Label
                      value="Total Disbursement"
                      angle={90}
                      offset={0}
                      position="insideRight"
                      style={{
                        fill: "var(--axis-color)",
                        fontSize: 10,
                        textAnchor: "middle",
                      }}
                    />
                  </YAxis>
                  <Tooltip
                    wrapperStyle={tooltipWrapperStyle()}
                    contentStyle={tooltipContentStyle()}
                    labelStyle={tooltipLabelStyle()}
                  />
                  <Legend
                    verticalAlign="top"
                    align="left"
                    height={32}
                    wrapperStyle={{
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="project_count"
                    name="# Projects"
                    fill="var(--accent)"
                    barSize={18}
                  >
                    <LabelList
                      dataKey="project_count"
                      position="top"
                      style={{
                        fill: "var(--text-primary)",
                        fontSize: 10,
                        fontWeight: 500,
                      }}
                    />
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="total_disbursement_usd"
                    name="Total Disbursement (USD)"
                    stroke={"var(--series-contrast-color)"}
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--series-muted-color)" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* avg project size */}
          <ChartCard
            loading={loadingAnalytics}
            title="Average Project Size Over Time"
            //subtitle="Mean USD per tagged project."
            insight={avgPerProjectInsight}
          >
            {!trendEnriched.length ? (
              <div
                className="text-center text-[12px] py-16"
                style={{ color: "var(--text-secondary)" }}
              >
                No time-series data for this filter.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={trendEnriched}
                  margin={{ top: 60, left: 40, right: 20, bottom: 40 }}
                >
                  <CartesianGrid
                    stroke={"var(--grid-weak)"}
                    strokeDasharray="3 3"
                  />
                  <XAxis dataKey="year" tick={axisTickStyle()}>
                    <Label
                      value="Year"
                      position="bottom"
                      offset={20}
                      style={{ fill: "var(--axis-color)", fontSize: 11 }}
                    />
                  </XAxis>
                  <YAxis
                    tick={axisTickStyle()}
                    tickFormatter={(v: number) => fmtUSDCompact(v)}
                    tickMargin={6}
                  >
                    <Label
                      value="Avg per project (USD)"
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
                  />
                  <Legend
                    verticalAlign="top"
                    align="left"
                    height={32}
                    wrapperStyle={{
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_project_usd"
                    name="Avg per project (USD)"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--series-muted-color)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* SECTION 4: Donor comparison */}
        <section
          className="rounded-md border p-4 space-y-4 mb-16 py-6"
          style={{ backgroundColor: "var(--card-bg-color)", borderColor: "var(--card-border-weak)" }}
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div
                className="text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Benchmark Donor Portfolios
              </div>
              <p
                className="text-[12px]"
                style={{ color: "var(--text-primary)" }}
              >
                Compare 2–4 donors and see how much of their portfolio is truly
                integrated.
              </p>
            </div>

            {/* donor pickers */}
            <div className="w-full lg:w-auto sticky top-[72px] z-30 rounded-md border p-3 shadow-sm"
            style={{
              borderColor: "var(--card-border-weak)",
              // soft tint
              background: "color-mix(in oklab, var(--card-bg-color) 92%, var(--semantic-integrated) 8%)",
            }}>
              {/* search box for donors */}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[12px] w-full lg:w-auto">
                {/* Donor A (required) */}
                <div className="flex flex-col">
                  <label
                    className="text-[11px] mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Donor A (required)
                  </label>
                  <select
                    className="rounded-md border px-2 py-[6px] bg-transparent"
                    style={{
                      borderColor: "var(--card-border-weak)",
                      color: "var(--text-primary)",
                    }}
                    value={donorA}
                    onChange={(e) => setDonorA(e.target.value)}
                  >
                    {searchableDonors.map((d) => (
                      <option
                        key={d.donor_name}
                        value={d.donor_name}
                        style={{ color: "#000" }}
                      >
                        {d.donor_name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Donor B (required) */}
                <div className="flex flex-col">
                  <label
                    className="text-[11px] mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Donor B (required)
                  </label>
                  <select
                    className="rounded-md border px-2 py-[6px] bg-transparent"
                    style={{
                      borderColor: "var(--card-border-weak)",
                      color: "var(--text-primary)",
                    }}
                    value={donorB}
                    onChange={(e) => setDonorB(e.target.value)}
                  >
                    {searchableDonors.map((d) => (
                      <option
                        key={d.donor_name}
                        value={d.donor_name}
                        style={{ color: "#000" }}
                      >
                        {d.donor_name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Donor C (optional) */}
                <div className="flex flex-col">
                  <label
                    className="text-[11px] mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Donor C (optional)
                  </label>
                  <select
                    className="rounded-md border px-2 py-[6px] bg-transparent"
                    style={{
                      borderColor: "var(--card-border-weak)",
                      color: "var(--text-primary)",
                    }}
                    value={donorC}
                    onChange={(e) => setDonorC(e.target.value)}
                  >
                    <option value="" style={{ color: "#000" }}>
                      —
                    </option>
                    {searchableDonors.map((d) => (
                      <option
                        key={d.donor_name}
                        value={d.donor_name}
                        style={{ color: "#000" }}
                      >
                        {d.donor_name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Donor D (optional) */}
                <div className="flex flex-col">
                  <label
                    className="text-[11px] mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Donor D (optional)
                  </label>
                  <select
                    className="rounded-md border px-2 py-[6px] bg-transparent"
                    style={{
                      borderColor: "var(--card-border-weak)",
                      color: "var(--text-primary)",
                    }}
                    value={donorD}
                    onChange={(e) => setDonorD(e.target.value)}
                  >
                    <option value="" style={{ color: "#000" }}>
                      —
                    </option>
                    {searchableDonors.map((d) => (
                      <option
                        key={d.donor_name}
                        value={d.donor_name}
                        style={{ color: "#000" }}
                      >
                        {d.donor_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2 charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* benchmark */}
            <ChartCard
              loading={loadingCompare}
              title="Integrated Funding Benchmark"
              insight={benchmarkInsight}
            >
              {!benchmarkData.length ? (
                <div
                  className="text-center text-[12px] py-16"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Pick at least 2 donors to compare.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={benchmarkData}
                    margin={{ top: 60, left: 40, right: 20, bottom: 40 }}
                  >
                    <CartesianGrid
                      stroke={"var(--grid-weak)"}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="donor_name"
                      tick={axisTickStyle()}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    >
                      <Label
                        value="Donor"
                        position="bottom"
                        offset={25}
                        style={{ fill: "var(--axis-color)", fontSize: 11 }}
                      />
                    </XAxis>
                    <YAxis
                      domain={[0, 100]}
                      tick={axisTickStyle()}
                      tickFormatter={(v: number) => v.toFixed(0) + "%"}
                      tickMargin={6}
                    >
                      <Label
                        value="% integrated"
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
                      formatter={(v: any) => [
                        `${Number(v).toFixed(1)}%`,
                        "Integrated (both) %",
                      ]}
                    />
                    <Legend
                      verticalAlign="top"
                      align="left"
                      height={32}
                      wrapperStyle={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                      }}
                    />
                    {globalIntegratedAvg != null && (
                      <ReferenceLine
                        y={globalIntegratedAvg}
                        stroke={"var(--text-secondary)"}
                        strokeDasharray="4 4"
                        label={{
                          value: `Baseline ${globalIntegratedAvg.toFixed(1)}%`,
                          position: "top",
                          fill: "var(--text-secondary)",
                          fontSize: 10,
                        }}
                      />
                    )}
                    <Bar
                      dataKey="pct_integrated"
                      name="Integrated (both) %"
                      fill={"var(--semantic-integrated)"}
                      barSize={dynamicBarSize}
                    >
                      <LabelList
                        dataKey="pct_integrated"
                        position="top"
                        formatter={(v: any) => `${Number(v).toFixed(1)}%`}
                        style={{
                          fill: "var(--text-primary)",
                          fontSize: 10,
                          fontWeight: 500,
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* mix */}
            <ChartCard
              loading={loadingCompare}
              title="Portfolio Mix by Focus Area"
              insight={mixInsight}
            >
              {!mixStackData.length ? (
                <div
                  className="text-center text-[12px] py-16"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Pick at least 2 donors to compare.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={mixStackData}
                    margin={{ top: 60, left: 40, right: 20, bottom: 40 }}
                  >
                    <CartesianGrid
                      stroke={"var(--grid-weak)"}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="donor_name"
                      tick={axisTickStyle()}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    >
                      <Label
                        value="Donor"
                        position="bottom"
                        offset={25}
                        style={{ fill: "var(--axis-color)", fontSize: 11 }}
                      />
                    </XAxis>
                    <YAxis
                      domain={[0, 100]}
                      tick={axisTickStyle()}
                      tickFormatter={(v: number) => v.toFixed(0) + "%"}
                      tickMargin={6}
                    >
                      <Label
                        value="% of tagged portfolio"
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
                      formatter={(val: any, key: any) => {
                        const map: Record<string, string> = {
                          climate_only: "Climate only",
                          gender_only: "Gender only",
                          integrated: "Integrated (both)",
                        };
                        return [`${Number(val).toFixed(1)}%`, map[key] || key];
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="left"
                      height={32}
                      wrapperStyle={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                      }}
                    />
                    <Bar
                      dataKey="climate_only"
                      name="Climate only"
                      stackId="mix"
                      fill={"var(--semantic-climateOnly)"}
                      barSize={dynamicBarSize}
                    />
                    <Bar
                      dataKey="gender_only"
                      name="Gender only"
                      stackId="mix"
                      fill={"var(--semantic-genderOnly)"}
                      barSize={dynamicBarSize}
                    />
                    <Bar
                      dataKey="integrated"
                      name="Integrated (both)"
                      stackId="mix"
                      fill={"var(--semantic-integrated)"}
                      barSize={dynamicBarSize}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </section>
        </Section>
      </main>
    </div>
  );
}

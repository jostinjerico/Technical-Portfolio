
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe2,
  Users,
  MapPin,
  Layers,
  DollarSign,
  Target,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

import { fmtUSDCompact, fmtPct,toNumberSafe } from "@/lib/format";


type InsightsOverviewResponse = {
  totalFundingUSD?: number;      // optional; will fall back to "Tagged Projects" if absent/0
  totalProjects: number;
  activeDonors: number;
  integrationRatePct: number;    // or integratedSharePct from API
  coveredCountries: number;
  totalCountries: number;
  genderCoveragePct: number;    // optional coverage stats
  climateCoveragePct: number;
};


export default function DataInsightsOverview() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<InsightsOverviewResponse | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/data-insights/overview", { cache: "no-store" });
        const raw = await res.json();

        if (raw?.error) {
          setErr(String(raw.error));
          setStats(null);
        } else {
          // Map flexibly to whatever the API returns (old/new keys)
          const mapped: InsightsOverviewResponse = {
            totalFundingUSD:
              toNumberSafe(raw.totalFundingUSD) ??
              toNumberSafe(raw.total_funding_usd) ??
              toNumberSafe(raw.totalDisbursementUSD) ??
              toNumberSafe(raw.total_disbursement_usd),
            totalProjects:
              toNumberSafe(raw.totalProjects) ??
              toNumberSafe(raw.taggedProjects) ??
              0,
            activeDonors:
              toNumberSafe(raw.activeDonors) ??
              toNumberSafe(raw.active_donors) ??
              0,
            integrationRatePct:
              toNumberSafe(raw.integrationRatePct) ??
              toNumberSafe(raw.integratedSharePct) ??
              toNumberSafe(raw.integration_rate_pct) ??
              0,
            coveredCountries:
              toNumberSafe(raw.coveredCountries) ??
              toNumberSafe(raw.covered_countries) ??
              0,
            totalCountries:
              toNumberSafe(raw.totalCountries) ??
              toNumberSafe(raw.total_countries) ??
              // If API doesn’t send total, match covered (tagged-only universe).
              (toNumberSafe(raw.coveredCountries) ?? toNumberSafe(raw.covered_countries) ?? 0),
            genderCoveragePct:
              toNumberSafe(raw.genderCoveragePct) ?? toNumberSafe(raw.genderCoverage),
            climateCoveragePct:
              toNumberSafe(raw.climateCoveragePct) ?? toNumberSafe(raw.climateCoverage),
          };
          setStats(mapped);
        }
      } catch (e) {
        console.error("Failed to load insights overview:", e);
        setErr("Failed to load overview stats.");
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!mounted) return null;

  const showFundingTile =
    (stats?.totalFundingUSD ?? 0) > 0;

  const totalFunding = showFundingTile ? fmtUSDCompact(stats!.totalFundingUSD) : "—";
  const totalProjectCount = stats?.totalProjects?.toLocaleString() ?? "—";
  const donorCount = stats?.activeDonors?.toLocaleString() ?? "—";
  const integrationRate = fmtPct(stats?.integrationRatePct);
  const coverageText =
    stats?.coveredCountries != null && stats?.totalCountries != null
      ? `${stats.coveredCountries} of ${stats.totalCountries}`
      : "—";
  const genderCoverage = fmtPct(stats?.genderCoveragePct);
  const climateCoverage = fmtPct(stats?.climateCoveragePct);

  const navCards = [
    {
      icon: Users,
      title: "Donor Overview",
      description:
        "Which donors are most active, where they spend, and how they fall into strategic archetypes.",
      href: "/data-insights/donors",
      gradient: "bg-gradient-to-br from-[var(--semantic-genderOnly)]",
      highlights: ["Top funding organizations", "Strategic archetypes", "Geographic distribution"],
    },
    {
      icon: Target,
      title: "Thematic & Sector Focus",
      description: "Which themes are getting attention and where gaps might exist.",
      href: "/data-insights/sectors",
      gradient: "bg-gradient-to-br from-[var(--semantic-integrated)] to-[var(--semantic-climateOnly)]",
      highlights: ["Adaptation & resilience", "Gender empowerment themes", "Integration patterns"],
    },
    {
      icon: MapPin,
      title: "Geographic Recipients",
      description: "Which regions and countries absorb most of the tagged funding.",
      href: "/data-insights/recipients",
      gradient: "bg-gradient-to-br from-[var(--semantic-climateOnly)]",
      highlights: ["Top recipient countries", "Regional distribution", "Coverage gaps"],
    },
  ];

  return (
    <div className="container mx-auto px-4 md:px-8 lg:px-16 py-1">
      {/* Error banner */}
      {err && (
        <div
          className="mb-4 rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: "var(--card-border-weak)", background: "var(--card-bg-color)" }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--semantic-alert-color)" }} />
            <span style={{ color: "var(--text-secondary)" }}>{err}</span>
          </div>
        </div>
      )}

      {/* Coverage Banner */}
      <div className="mb-10 rounded-xl border bg-background/50 p-5 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground mb-1">Data Coverage Snapshot</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Only projects with at least one gender or climate marker are counted.
              Untagged projects are excluded from all metrics.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-right">
              <span className="text-muted-foreground">Gender Market Coverage:</span>{" "}
              <span className="font-semibold text-foreground">
                {loading ? "…" : genderCoverage}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Climate Marker Coverage:</span>{" "}
              <span className="font-semibold text-foreground">
                {loading ? "…" : climateCoverage}
              </span>
            </div>
            <div className="text-right col-span-2">
              <span className="text-muted-foreground">Source:</span>{" "}
              <span className="font-medium text-foreground">OECD CRS</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Section — Custom Cards */}
      <section className="mb-16">
        <h2 className="text-[30px] font-bold text-foreground mb-6 text-center"
        style={{
                backgroundImage:
                  "linear-gradient(90deg,var(--semantic-genderOnly), var(--semantic-climateOnly) 80%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}>
          Key Metrics at a Glance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Funding or Projects */}
          <div className="eco-modal-panel bg-muted/50 rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                {showFundingTile ? (
                  <DollarSign className="w-5 h-5 text-purple-500" />
                ) : (
                  <Layers className="w-5 h-5 " />
                )}
              </div>
              <h3 className="font-semibold text-foreground">
                {showFundingTile ? "Disbursement volume" : "Tagged Projects"}
              </h3>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {loading ? "…" : showFundingTile ? totalFunding : totalProjectCount}
            </div>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading…"
                : showFundingTile
                ? `Across ${totalProjectCount} projects`
                : "With ≥1 gender or climate marker"}
            </p>
          </div>

          {/* Active Donors */}
          <div className="eco-modal-panel bg-muted/50 rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="font-semibold text-foreground">Active Donors</h3>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {loading ? "…" : donorCount}
            </div>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : "Organizations funding these projects"}
            </p>
          </div>

          {/* Integration Rate */}
          <div className="eco-modal-panel bg-muted/50 rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-sky-500/10">
                <Target className="w-5 h-5 text-cyan-500" />
              </div>
              <h3 className="font-semibold text-foreground">Integrated</h3>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {loading ? "…" : integrationRate}
            </div>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : "Projects tackling both themes simultenously"}
            </p>
          </div>

          {/* Geographic Reach */}
          <div className="eco-modal-panel bg-muted/50 rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Globe2 className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-foreground">Geographic Reach</h3>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {loading ? "…" : coverageText}
            </div>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : "Countries with ≥1 project"}
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-3"
          style={{
                backgroundImage:
                  "linear-gradient(90deg,var(--semantic-genderOnly), var(--semantic-climateOnly)  80%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}>
                Explore by Perspective</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dive deeper into specific dimensions of gender-climate finance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {navCards.map((card) => (
            <button
              key={card.href}
              onClick={() => router.push(card.href)}
              className="eco-modal-panel group relative w-full overflow-hidden rounded-xl border border-border bg-muted/80 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-1 hover:ring-ring/40 hover:bg-accent/10
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2
              cursor-pointer"
              aria-label={`Explore ${card.title}`}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} flex-shrink-0`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-muted-foreground text-base leading-relaxed mb-4">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="mt-auto">
                  <ul className="space-y-2 mb-5">
                    {card.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-muted-foreground/60" />
                        <span className="text-foreground/90 text-sm">{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="inline-flex items-center gap-2  text-primary font-semibold text-md group-hover:gap-3 transition-all">
                    <span>Explore insights</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Methodology Note */}
      <div className="rounded-xl border bg-muted/30 p-5">
        <h3 className="font-semibold text-foreground mb-2">Important Scope Note</h3>
        <p className="text-sm text-muted-foreground">
          Everything on this page is calculated only from projects that have at least one gender or
          climate marker. Projects with no such marker are excluded. These numbers describe the
          gender/climate-relevant slice of finance, not the entire aid portfolio.
        </p>
      </div>
    </div>
  );
}

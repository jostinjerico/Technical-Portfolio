import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

export async function GET() {
  try {
    const sql = `
      SELECT
        COALESCE(total_disbursed_funding_usd,0)      AS total_funding_usd,
        COALESCE(total_projects,0)         AS total_projects,
        COALESCE(active_donors,0)          AS active_donors,
        COALESCE(integration_rate_pct,0)   AS integration_rate_pct,
        COALESCE(covered_countries,0)      AS covered_countries,
        COALESCE(total_countries,0)        AS total_countries,
        COALESCE(gender_coverage_pct,0)    AS gender_coverage_pct,
        COALESCE(climate_coverage_pct,0)   AS climate_coverage_pct
      FROM data_insights_overview
      LIMIT 1;
    `;
    const { rows } = await query(sql);
    const r = rows[0] ?? {};

    return NextResponse.json({
      totalFundingUSD: Number(r.total_funding_usd ?? 0),
      totalProjects: Number(r.total_projects ?? 0),
      activeDonors: Number(r.active_donors ?? 0),
      integrationRatePct: Number(r.integration_rate_pct ?? 0),
      coveredCountries: Number(r.covered_countries ?? 0),
      totalCountries: Number(r.total_countries ?? 0),
      genderCoveragePct: Number(r.gender_coverage_pct ?? 0),
      climateCoveragePct: Number(r.climate_coverage_pct ?? 0),
    });
  } catch (e) {
    console.error("overview API failed:", e);
    return NextResponse.json({ error: "Failed to load overview stats" }, { status: 500 });
  }
}
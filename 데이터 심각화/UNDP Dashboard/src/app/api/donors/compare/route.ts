// src/app/api/donors/compare/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const donorA = searchParams.get("donorA");
  const donorB = searchParams.get("donorB");
  const donorC = searchParams.get("donorC");
  const donorD = searchParams.get("donorD");
  const archetype = searchParams.get("archetype");
  const startYear = searchParams.get("startYear");
  const endYear = searchParams.get("endYear");

  const picks = [donorA, donorB, donorC, donorD].filter(Boolean) as string[];
  if (!picks.length) {
    return NextResponse.json({ donors: [], globalBothPct: null });
  }

  try {
    // compute mix from PROJECTS so year filter works
    const mixWhere: string[] = [`donor_name = ANY($1)`];
    const mixVals: any[] = [picks];
    let i = 2;

    if (startYear) {
      mixWhere.push(`year >= $${i++}`);
      mixVals.push(Number(startYear));
    }
    if (endYear) {
      mixWhere.push(`year <= $${i++}`);
      mixVals.push(Number(endYear));
    }

    const mixSql = `
      SELECT
        donor_name,
        SUM( (gender >= 1 AND (climate_mitigation >= 1 OR climate_adaptation >= 1))::int ) AS integrated_projects,
        SUM( ((climate_mitigation >= 1 OR climate_adaptation >= 1) AND NOT (gender >= 1))::int ) AS climate_only_projects,
        SUM( (gender >= 1 AND NOT (climate_mitigation >= 1 OR climate_adaptation >= 1))::int ) AS gender_only_projects,
        COUNT(*) AS total_projects
      FROM projects
      WHERE ${mixWhere.join(" AND ")}
      GROUP BY donor_name;
    `;
    const { rows } = await query(mixSql, mixVals);

    // global baseline (optional) – just compute over same slice
    const globalSql = `
      SELECT
        SUM( (gender >= 1 AND (climate_mitigation >= 1 OR climate_adaptation >= 1))::int )::float
        / NULLIF(COUNT(*),0) * 100 AS global_integrated
      FROM projects
      WHERE ${mixWhere.join(" AND ")}
    `;
    const { rows: globalRows } = await query(globalSql, mixVals);
    const globalIntegrated = globalRows[0]?.global_integrated ?? null;

    return NextResponse.json({
      donors: rows.map((r) => {
        const total = Number(r.total_projects) || 1;
        return {
          donor_name: r.donor_name,
          both_pct: (Number(r.integrated_projects) / total) * 100,
          gender_only_pct: (Number(r.gender_only_projects) / total) * 100,
          climate_only_pct: (Number(r.climate_only_projects) / total) * 100,
        };
      }),
      globalBothPct:
        globalIntegrated != null ? Number(globalIntegrated) : null,
    });
  } catch (err) {
    console.error("[/api/donors/compare] error", err);
    return NextResponse.json(
      { error: "Failed to compare donors." },
      { status: 500 }
    );
  }
}
// src/app/api/donors/analytics/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startYear = searchParams.get("startYear");
  const endYear = searchParams.get("endYear");
  const archetype = searchParams.get("archetype"); 

  try {
    /* 0) first, get the donors we’re allowed to look at (from the view) */
    const donorWhere: string[] = [];
    const donorVals: any[] = [];
    let d = 1;

    if (archetype) {
      donorWhere.push(`archetype = $${d++}`);
      donorVals.push(archetype);
    }

    const donorWhereSql = donorWhere.length ? `WHERE ${donorWhere.join(" AND ")}` : "";

    const donorSql = `
      SELECT
        donor_name,
        regions_covered,
        archetype,
        project_count,
        total_disbursement,
        total_commitment,
        integrated_pct,
        gender_only_pct,
        climate_only_pct,
        neither_pct
      FROM donors_analytics
      ${donorWhereSql}
      ORDER BY total_disbursement DESC;
    `;
    const { rows: donorRows } = await query(donorSql, donorVals);
    const donorNames = donorRows.map((r) => r.donor_name);

    // if no donors match, return empty payload so frontend shows "no data"
    if (!donorNames.length) {
      return NextResponse.json({
        ok: true,
        donors: [],
        disbursementTrend: [],
        regionBreakdown: [],
        thematicMixStats: [],
        sectors: [],
        donorArchetypesAll: [],
      });
    }

    /* 1) build WHERE for projects (year + donor set) */
    const projWhere: string[] = [];
    const projVals: any[] = [];
    let p = 1;

    // donor filter (very important!)
    projWhere.push(`donor_name = ANY($${p++})`);
    projVals.push(donorNames);

    if (startYear) {
      projWhere.push(`year >= $${p++}`);
      projVals.push(Number(startYear));
    }
    if (endYear) {
      projWhere.push(`year <= $${p++}`);
      projVals.push(Number(endYear));
    }

    const projWhereSql = `WHERE ${projWhere.join(" AND ")}`;

    /* 2) trend over time (from projects) */
    const trendSql = `
      SELECT
        year::text,
        (SUM(COALESCE(usd_disbursement,0)))*1000000 AS total_disbursement_usd,
        COUNT(*) AS project_count
      FROM projects
      ${projWhereSql}
      GROUP BY year
      ORDER BY year;
    `;
    const { rows: trendRows } = await query(trendSql, projVals);

    /* 3) region breakdown (use region_name) */
    const regionSql = `
      SELECT
        COALESCE(region_name, 'Unspecified') AS region,
        (SUM(COALESCE(usd_disbursement,0)))*1000000 AS total_disbursement_usd
      FROM projects
      ${projWhereSql}
      GROUP BY COALESCE(region_name, 'Unspecified')
      ORDER BY total_disbursement_usd DESC;
    `;
    const { rows: regionRows } = await query(regionSql, projVals);

    /* 4) thematic/buckets (same logic as your view) */
    const thematicSql = `
      SELECT
        SUM(
          CASE
            WHEN gender >= 1 AND (climate_mitigation >= 1 OR climate_adaptation >= 1)
              THEN 1 ELSE 0
          END
        ) AS both_count,
        SUM(
          CASE
            WHEN (climate_mitigation >= 1 OR climate_adaptation >= 1)
                 AND NOT (gender >= 1)
              THEN 1 ELSE 0
          END
        ) AS climate_only_count,
        SUM(
          CASE
            WHEN gender >= 1
                 AND NOT (climate_mitigation >= 1 OR climate_adaptation >= 1)
              THEN 1 ELSE 0
          END
        ) AS gender_only_count,
        SUM(
          CASE
            WHEN NOT (
              gender >= 1 OR climate_mitigation >= 1 OR climate_adaptation >= 1
            )
              THEN 1 ELSE 0
          END
        ) AS neither_count
      FROM projects
      ${projWhereSql};
    `;
    const { rows: thematicRows } = await query(thematicSql, projVals);

    /* 5) sectors */
    const sectorsSql = `
      SELECT
        COALESCE(sector_name, 'Unspecified') AS sector,
        COUNT(*) AS count
      FROM projects
      ${projWhereSql}
      GROUP BY COALESCE(sector_name, 'Unspecified')
      ORDER BY count DESC
      LIMIT 30;
    `;
    const { rows: sectorRows } = await query(sectorsSql, projVals);

    /* 6) archetype counts (already filtered) */
    const archSql = `
      SELECT
        archetype,
        COUNT(*) AS donor_count
      FROM donors_analytics
      ${donorWhereSql}
      GROUP BY archetype
      ORDER BY donor_count DESC;
    `;
    const { rows: archRows } = await query(archSql, donorVals);

    return NextResponse.json({
      ok: true,
      donors: donorRows.map((r) => ({
        donor_name: r.donor_name,
        archetype: r.archetype,
        regions_covered: Number(r.regions_covered),
        total_disbursement: Number(r.total_disbursement),
        total_commitment: Number(r.total_commitment),
        project_count: Number(r.project_count),
        integrated_pct: Number(r.integrated_pct ?? 0),
        gender_only_pct: Number(r.gender_only_pct ?? 0),
        climate_only_pct: Number(r.climate_only_pct ?? 0),
        neither_pct: Number(r.neither_pct ?? 0),
      })),
      disbursementTrend: trendRows.map((r) => ({
        year: r.year,
        total_disbursement_usd: Number(r.total_disbursement_usd),
        project_count: Number(r.project_count),
      })),
      regionBreakdown: regionRows.map((r) => ({
        region: r.region,
        total_disbursement_usd: Number(r.total_disbursement_usd),
      })),
      // your front-end checks thematicMixStats || sectors, so we send both
      thematicMixStats: thematicRows.map((r) => ({
        both_count: Number(r.both_count ?? 0),
        climate_only_count: Number(r.climate_only_count ?? 0),
        gender_only_count: Number(r.gender_only_count ?? 0),
        neither_count: Number(r.neither_count ?? 0),
      })),
      sectors: sectorRows.map((r) => ({
        sector: r.sector,
        count: Number(r.count),
      })),
      donorArchetypesAll: archRows.map((r) => ({
        archetype: r.archetype,
        donor_count: Number(r.donor_count),
      })),
    });
  } catch (err) {
    console.error("[/api/donors/analytics] error", err);
    return NextResponse.json(
      { error: "Failed to load donor analytics." },
      { status: 500 }
    );
  }
}

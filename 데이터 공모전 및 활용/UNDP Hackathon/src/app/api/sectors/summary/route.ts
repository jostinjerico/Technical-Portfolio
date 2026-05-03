import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

/**
 * GET /api/sectors?startYear=2018&endYear=2023
 *
 * Returns:
 * {
 *   topSectors: [
 *     {
 *       sector_name: string,
 *       project_count: number,
 *       total_disb_usd: number,
 *       pct_integrated: number,
 *       pct_gender_only: number,
 *       pct_climate_only: number
 *     },
 *     ...
 *   ],
 *   years: [ "2014", "2015", ... ]   // optional helper for dropdown
 * }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startYear = searchParams.get("startYear");
  const endYear = searchParams.get("endYear");

  const whereParts: string[] = [];
  const values: any[] = [];

  if (startYear) {
    values.push(Number(startYear));
    whereParts.push(`year >= $${values.length}`);
  }
  if (endYear) {
    values.push(Number(endYear));
    whereParts.push(`year <= $${values.length}`);
  }

  const whereClause =
    whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

  const sectorsQuery = `
    WITH filtered AS (
      SELECT *
      FROM sector_analytics
      ${whereClause}
    )
    SELECT
      sector_name,
      SUM(project_count)                    AS project_count,
      SUM(total_disb_usd)                   AS total_disb_usd,
      SUM(integrated_count)                 AS integrated_count,
      SUM(gender_only_count)                AS gender_only_count,
      SUM(climate_only_count)               AS climate_only_count,
      SUM(neither_count)                    AS neither_count,
      CASE WHEN SUM(project_count) > 0
        THEN ROUND(SUM(integrated_count)::numeric / SUM(project_count) * 100, 1)
        ELSE 0 END AS pct_integrated,
      CASE WHEN SUM(project_count) > 0
        THEN ROUND(SUM(gender_only_count)::numeric / SUM(project_count) * 100, 1)
        ELSE 0 END AS pct_gender_only,
      CASE WHEN SUM(project_count) > 0
        THEN ROUND(SUM(climate_only_count)::numeric / SUM(project_count) * 100, 1)
        ELSE 0 END AS pct_climate_only
    FROM filtered
    GROUP BY sector_name
    ORDER BY total_disb_usd DESC
    LIMIT 50;
  `;

  const yearsQuery = `
    SELECT DISTINCT year
    FROM sector_analytics
    ORDER BY year;
  `;

  try {
    const [sectorsRes, yearsRes] = await Promise.all([
      query(sectorsQuery, values),
      query(yearsQuery),
    ]);

    const topSectors = sectorsRes.rows.map((r) => ({
      sector_name: r.sector_name,
      project_count: Number(r.project_count || 0),
      total_disb_usd: Number(r.total_disb_usd || 0),
      pct_integrated: Number(r.pct_integrated || 0),
      pct_gender_only: Number(r.pct_gender_only || 0),
      pct_climate_only: Number(r.pct_climate_only || 0),
    }));

    const years = yearsRes.rows.map((r) => String(r.year));

    return NextResponse.json(
      {
        topSectors,
        years,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[/api/sectors] error:", err);
    return NextResponse.json(
      {
        error: "Failed to load sector data.",
        detail: err?.message,
      },
      { status: 500 }
    );
  }
}
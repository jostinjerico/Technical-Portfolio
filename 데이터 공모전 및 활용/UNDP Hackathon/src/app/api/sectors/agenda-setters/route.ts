import { NextResponse } from "next/server";
import { query as dbQuery } from "@/lib/db/client";

/**
 * GET /api/sectors/agenda-setters?startYear=2018&endYear=2023
 *
 * Returns, per sector, the top donor (by disbursement) + their integration mix.
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
    
  const sql = `
    WITH filtered AS (
      SELECT *
      FROM sector_donor_analytics
      ${whereClause}
    ),
    agg AS (
      SELECT
        sector_name,
        donor_name,
        SUM(proj_count) AS proj_count,
        SUM(donor_disb_usd) AS donor_disb_usd,
        SUM(integrated_count) AS integrated_count,
        SUM(gender_only_count) AS gender_only_count,
        SUM(climate_only_count) AS climate_only_count
      FROM filtered
      GROUP BY sector_name, donor_name
    ),
    ranked AS (
      SELECT
        *,
        ROW_NUMBER() OVER (
          PARTITION BY sector_name
          ORDER BY donor_disb_usd DESC
        ) AS rn
      FROM agg
    )
    SELECT
      sector_name,
      donor_name,
      donor_disb_usd,
      proj_count,
      CASE
        WHEN proj_count > 0 THEN ROUND(integrated_count::numeric / proj_count * 100, 1)
        ELSE 0
      END AS pct_integrated,
      CASE
        WHEN proj_count > 0 THEN ROUND(gender_only_count::numeric / proj_count * 100, 1)
        ELSE 0
      END AS pct_gender_only,
      CASE
        WHEN proj_count > 0 THEN ROUND(climate_only_count::numeric / proj_count * 100, 1)
        ELSE 0
      END AS pct_climate_only
    FROM ranked
    WHERE rn = 1
    ORDER BY donor_disb_usd DESC
    LIMIT 50;
  `;

  try {
    const res = await dbQuery(sql, values);

    const leaders = res.rows.map((r) => ({
      sector_name: r.sector_name,
      donor_name: r.donor_name,
      donor_disb_usd: Number(r.donor_disb_usd || 0),
      proj_count: Number(r.proj_count || 0),
      pct_integrated: Number(r.pct_integrated || 0),
      pct_gender_only: Number(r.pct_gender_only || 0),
      pct_climate_only: Number(r.pct_climate_only || 0),
    }));

    return NextResponse.json({ leaders }, { status: 200 });
  } catch (err: any) {
    console.error("[/api/sectors/agenda-setters] error:", err);
    return NextResponse.json(
      {
        error: "Failed to load agenda-setters.",
        detail: err?.message,
      },
      { status: 500 }
    );
  }
}

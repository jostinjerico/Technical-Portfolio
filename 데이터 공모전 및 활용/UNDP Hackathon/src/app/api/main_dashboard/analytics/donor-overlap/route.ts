import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const startYear = url.searchParams.get("startYear");
    const endYear   = url.searchParams.get("endYear");
    const limit = Math.min(
      Number.parseInt(url.searchParams.get("limit") || "6", 10) || 6,
      12
    );

    const sql = `
      WITH windowed AS (
        SELECT
          donor_name,
          region_name,
          year,
          proj_count_tagged,
          total_disb_usd_tagged,
          integrated_count
        FROM public.donor_region_year_analytics
        WHERE ($1::int IS NULL OR year >= $1)
          AND ($2::int IS NULL OR year <= $2)
          AND donor_name IS NOT NULL AND donor_name <> ''
          AND region_name IS NOT NULL AND region_name <> ''
      ),
      donor_totals AS (
        SELECT donor_name, COALESCE(SUM(total_disb_usd_tagged),0) AS donor_total
        FROM windowed
        GROUP BY donor_name
      ),
      region_totals AS (
        SELECT region_name, COALESCE(SUM(total_disb_usd_tagged),0) AS region_total
        FROM windowed
        GROUP BY region_name
      ),
      top_donors AS (
        SELECT donor_name, donor_total
        FROM donor_totals
        ORDER BY donor_total DESC
        LIMIT $3
      ),
      top_regions AS (
        SELECT region_name, region_total
        FROM region_totals
        ORDER BY region_total DESC
        LIMIT $3
      ),
      donor_region_agg AS (
        SELECT
          donor_name,
          region_name,
          SUM(proj_count_tagged)::int                         AS proj_count,
          SUM(integrated_count)::int                          AS integrated_count,
          COALESCE(SUM(total_disb_usd_tagged),0)              AS total_disb_usd
        FROM windowed
        GROUP BY donor_name, region_name
      ),
      filtered AS (
        SELECT
          a.donor_name,
          a.region_name,
          a.total_disb_usd,
          a.proj_count,
          CASE WHEN a.proj_count > 0
               THEN 100.0 * a.integrated_count::numeric / a.proj_count
               ELSE 0 END AS pct_integrated
        FROM donor_region_agg a
        JOIN top_donors  td ON td.donor_name  = a.donor_name
        JOIN top_regions tr ON tr.region_name = a.region_name
      )
      SELECT
        (SELECT json_agg(donor_name ORDER BY donor_total DESC) FROM top_donors)    AS donors,
        (SELECT json_agg(region_name ORDER BY region_total DESC) FROM top_regions) AS regions,
        (SELECT json_agg(
                  json_build_object(
                    'donor_name', donor_name,
                    'region_name', region_name,
                    'total_disb_usd', total_disb_usd,
                    'proj_count',    proj_count,
                    'pct_integrated', pct_integrated
                  )
                )
         FROM filtered) AS matrix;
    `;

    const params = [
      startYear ? Number(startYear) : null, // $1
      endYear   ? Number(endYear)   : null, // $2
      limit,                                 // $3
    ];

    const { rows } = await query(sql, params);
    const row = rows[0] || {};

    const donors: string[]  = Array.isArray(row.donors)  ? row.donors  : [];
    const regions: string[] = Array.isArray(row.regions) ? row.regions : [];
    const matrix = Array.isArray(row.matrix)
      ? row.matrix.map((cell: any) => ({
          donor_name: cell.donor_name || "Unknown donor",
          region_name: cell.region_name || "Unspecified",
          total_disb_usd: Number(cell.total_disb_usd || 0),
          proj_count: Number(cell.proj_count || 0),
          pct_integrated: Number(cell.pct_integrated || 0),
        }))
      : [];

    return NextResponse.json({ donors, regions, matrix });
  } catch (err) {
    console.error("[api] donor-region-matrix failed:", err);
    return NextResponse.json(
      { error: "Failed to compute donor-region matrix" },
      { status: 500 }
    );
  }
}

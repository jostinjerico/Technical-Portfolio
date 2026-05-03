import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const startYear = url.searchParams.get("startYear");
    const endYear   = url.searchParams.get("endYear");

    const region = url.searchParams.get("region");
    const sort   = (url.searchParams.get("sort") ?? "share_projects").toLowerCase();
    const order  = (url.searchParams.get("order") ?? "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";
    const limit  = Number(url.searchParams.get("limit") ?? "100");

    const sql = `
      -- Aggregate per donor across the selected year window
      WITH by_donor AS (
        SELECT
          donor_name,
          SUM(project_count)        AS project_count,
          SUM(integrated_projects)  AS integrated_projects,
          SUM(gender_projects)      AS gender_projects,
          SUM(climate_projects)     AS climate_projects,
          -- total_disb_usd_tagged may not exist on older builds; fallback sums the three disb_* buckets.
          SUM(
            COALESCE(total_disb_usd_tagged,
                     disb_integrated_usd + disb_gender_usd + disb_climate_usd)
          )                          AS total_disb_usd_tagged,
          SUM(disb_integrated_usd)   AS disb_integrated_usd,
          SUM(disb_gender_usd)       AS disb_gender_usd,
          SUM(disb_climate_usd)      AS disb_climate_usd
        FROM public.donors_year_analytics
        WHERE ($1::int IS NULL OR year >= $1)
          AND ($2::int IS NULL OR year <= $2)
        GROUP BY donor_name
      ),

      -- Optional region filter: keep donors that have any tagged activity in the region in this window
      region_filter AS (
        SELECT DISTINCT donor_name
        FROM public.donor_region_year_analytics
        WHERE ($1::int IS NULL OR year >= $1)
          AND ($2::int IS NULL OR year <= $2)
          AND ($3::text IS NULL OR region_name = $3)
      ),

      base AS (
        SELECT d.*
        FROM by_donor d
        WHERE d.project_count > 0
          AND ($3::text IS NULL OR d.donor_name IN (SELECT donor_name FROM region_filter))
      ),

      -- Compute per-donor focus rows (projects share + disbursement share within the donor's own portfolio)
      focus_calc AS (
        SELECT donor_name, 'integrated'::text AS focus,
               100.0 * integrated_projects / NULLIF(project_count, 0)             AS pct_projects,
               100.0 * disb_integrated_usd / NULLIF(total_disb_usd_tagged, 0)     AS pct_disb,
               disb_integrated_usd                                                 AS disbursement_usd
        FROM base
        UNION ALL
        SELECT donor_name, 'gender_only',
               100.0 * gender_projects / NULLIF(project_count, 0),
               100.0 * disb_gender_usd / NULLIF(total_disb_usd_tagged, 0),
               disb_gender_usd
        FROM base
        UNION ALL
        SELECT donor_name, 'climate_only',
               100.0 * climate_projects / NULLIF(project_count, 0),
               100.0 * disb_climate_usd / NULLIF(total_disb_usd_tagged, 0),
               disb_climate_usd
        FROM base
      ),

      -- Top region per donor within the year window (using MV with year)
      top_region AS (
        SELECT donor_name, region_name AS top_region
        FROM (
          SELECT
            donor_name,
            region_name,
            SUM(total_disb_usd_tagged) AS usd,
            ROW_NUMBER() OVER (PARTITION BY donor_name ORDER BY SUM(total_disb_usd_tagged) DESC) rn
          FROM public.donor_region_year_analytics
          WHERE ($1::int IS NULL OR year >= $1)
            AND ($2::int IS NULL OR year <= $2)
          GROUP BY donor_name, region_name
        ) s
        WHERE rn = 1
      )

      SELECT
        f.donor_name                           AS "group",
        f.focus                                AS focus,
        COALESCE(tr.top_region, 'Unspecified') AS top_region,
        COALESCE(f.disbursement_usd, 0)        AS disbursement_usd,
        COALESCE(f.pct_projects, 0)            AS pct_projects,
        COALESCE(f.pct_disb, 0)                AS pct_disb
      FROM focus_calc f
      LEFT JOIN top_region tr USING (donor_name)
      ORDER BY
        CASE WHEN $4 = 'share_projects' THEN pct_projects     END ${order},
        CASE WHEN $4 = 'share_disb'     THEN pct_disb         END ${order},
        CASE WHEN $4 = 'disb'           THEN disbursement_usd END ${order},
        f.donor_name ASC
      LIMIT $5;
    `;

    const params = [
      startYear ? Number(startYear) : null, // $1
      endYear   ? Number(endYear)   : null, // $2
      region || null,                       // $3
      sort,                                 // $4
      limit,                                // $5
    ];

    const { rows } = await query(sql, params);
    return NextResponse.json({ groups: rows });
  } catch (err) {
    console.error("donor-groups route failed:", err);
    return NextResponse.json(
      { error: "Failed to compute donor groups" },
      { status: 500 }
    );
  }
}
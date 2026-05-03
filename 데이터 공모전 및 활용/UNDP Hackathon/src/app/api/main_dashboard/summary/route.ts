import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

/**
 * GET /api/main_dashboard/summary?startYear=YYYY&endYear=YYYY
 * Returns:
 * {
 *   integratedSharePct: number, // %
 *   coveredCountries: number,
 *   totalCountries: number,
 *   activeDonors: number,
 *   taggedProjects: number
 * }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startYear = searchParams.get("startYear")
    ? parseInt(searchParams.get("startYear")!, 10)
    : null;
  const endYear = searchParams.get("endYear")
    ? parseInt(searchParams.get("endYear")!, 10)
    : null;

  try {
    let sql: string;
    let params: any[] = [];

    if (!startYear && !endYear) {
      // FAST PATH: use MV wrappers (ensure they are created/refreshed)
      sql = `
        WITH a AS (
          SELECT
            COALESCE(SUM(project_count), 0)       AS tagged_projects,
            COALESCE(SUM(integrated_projects), 0) AS integrated_projects
          FROM public.donors_year_analytics
        ),
        b AS (
          SELECT COUNT(DISTINCT donor_name) AS active_donors
          FROM public.donors_analytics
        ),
        c AS (
          SELECT COUNT(*) AS covered_countries
          FROM public.recipient_tagged_analytics
          WHERE recipient_name <> 'Unspecified'
        )
        SELECT
          a.tagged_projects,
          a.integrated_projects,
          b.active_donors,
          c.covered_countries,
          c.covered_countries AS total_countries
        FROM a, b, c;
      `;
    } else {
      // WINDOWED PATH: read from projects_tagged with correct bucket strings
      sql = `
        WITH base AS (
          SELECT recipient_name, donor_name, bucket
          FROM public.projects_tagged
          WHERE ($1::int IS NULL OR year >= $1)
            AND ($2::int IS NULL OR year <= $2)
            AND bucket IN ('Integrated','Gender Only','Climate Only')
        )
        SELECT
          COUNT(*)                                             AS tagged_projects,
          SUM((bucket = 'Integrated')::int)                    AS integrated_projects,
          COUNT(DISTINCT donor_name)                           AS active_donors,
          COUNT(DISTINCT recipient_name)
            FILTER (WHERE recipient_name IS NOT NULL
                    AND NULLIF(recipient_name,'') IS NOT NULL
                    AND recipient_name <> 'Unspecified')       AS covered_countries,
          COUNT(DISTINCT recipient_name)
            FILTER (WHERE recipient_name IS NOT NULL
                    AND NULLIF(recipient_name,'') IS NOT NULL
                    AND recipient_name <> 'Unspecified')       AS total_countries
        FROM base;
      `;
      params = [startYear, endYear];
    }

    const { rows } = await query(sql, params);
    const r = rows[0] ?? {
      tagged_projects: 0,
      integrated_projects: 0,
      active_donors: 0,
      covered_countries: 0,
      total_countries: 0,
    };

    const taggedProjects = Number(r.tagged_projects || 0);
    const integratedProjects = Number(r.integrated_projects || 0);
    const activeDonors = Number(r.active_donors || 0);
    const coveredCountries = Number(r.covered_countries || 0);
    const totalCountries = Number(r.total_countries || 0);

    const integratedSharePct =
      taggedProjects > 0 ? (integratedProjects / taggedProjects) * 100 : 0;

    return NextResponse.json({
      integratedSharePct,
      coveredCountries,
      totalCountries,
      activeDonors,
      taggedProjects,
    });
  } catch (err) {
    console.error("[api] overview failed:", err);
    return NextResponse.json(
      { error: "Failed to compute overview stats" },
      { status: 500 }
    );
  }
}
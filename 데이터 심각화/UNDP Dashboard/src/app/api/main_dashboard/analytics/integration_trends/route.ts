import { NextResponse } from "next/server";
import {query} from "@/lib/db/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startYear = searchParams.get("startYear");
    const endYear = searchParams.get("endYear");

    const sql = `
      WITH yearly AS (
        SELECT
          year,
          SUM(integrated_projects)     AS integrated_count,
          SUM(gender_projects)         AS gender_only_count,
          SUM(climate_projects)        AS climate_only_count
        FROM donors_year_analytics_mv
        WHERE ($1::int IS NULL OR year >= $1::int)
          AND ($2::int IS NULL OR year <= $2::int)
        GROUP BY year
      )
      SELECT
        year,
        CASE
          WHEN (integrated_count + gender_only_count + climate_only_count) > 0
          THEN 100.0 * integrated_count::numeric
               / (integrated_count + gender_only_count + climate_only_count)
          ELSE 0
        END AS both_pct,
        CASE
          WHEN (integrated_count + gender_only_count + climate_only_count) > 0
          THEN 100.0 * gender_only_count::numeric
               / (integrated_count + gender_only_count + climate_only_count)
          ELSE 0
        END AS gender_only_pct,
        CASE
          WHEN (integrated_count + gender_only_count + climate_only_count) > 0
          THEN 100.0 * climate_only_count::numeric
               / (integrated_count + gender_only_count + climate_only_count)
          ELSE 0
        END AS climate_only_pct
      FROM yearly
      ORDER BY year;
    `;

    const params = [
      startYear ? Number.parseInt(startYear, 10) : null,
      endYear ? Number.parseInt(endYear, 10) : null,
    ];

    const { rows } = await query(sql, params);

    const data = rows.map((r: any) => ({
      year: Number(r.year),
      both_pct: Number(r.both_pct),
      gender_only_pct: Number(r.gender_only_pct),
      climate_only_pct: Number(r.climate_only_pct),
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api] integration-trend failed:", err);
    return NextResponse.json(
      { error: "Failed to compute integration trend" },
      { status: 500 }
    );
  }
}

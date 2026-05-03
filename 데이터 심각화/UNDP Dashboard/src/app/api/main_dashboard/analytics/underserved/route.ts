import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const startYear = url.searchParams.get("startYear");
    const endYear   = url.searchParams.get("endYear");
    const limit =
      Number.parseInt(url.searchParams.get("limit") ?? "10", 10) || 10;
    const minProjects =
      Number.parseInt(url.searchParams.get("min_projects") ?? "5", 10) || 5;

    let sql: string;
    let params: any[] = [];

    if (!startYear && !endYear) {
      // (no year window): use MV wrapper
      sql = `
        SELECT
          recipient_name,
          project_count_tagged AS project_count,
          CASE
            WHEN project_count_tagged > 0
              THEN 100.0 * integrated_count::numeric / project_count_tagged
            ELSE 0
          END AS integrated_pct
        FROM public.recipient_tagged_analytics
        WHERE project_count_tagged >= $1
        ORDER BY integrated_pct ASC, project_count_tagged DESC
        LIMIT $2;
      `;
      params = [minProjects, limit];
    } else {
      // WINDOWED PATH: compute from projects_tagged with correct bucket strings
      sql = `
        WITH windowed AS (
          SELECT
            recipient_name,
            bucket
          FROM public.projects_tagged
          WHERE recipient_name IS NOT NULL
            AND NULLIF(recipient_name, '') IS NOT NULL
            AND ($1::int IS NULL OR year >= $1)
            AND ($2::int IS NULL OR year <= $2)
            AND bucket IN ('Integrated','Gender Only','Climate Only')
        ),
        agg AS (
          SELECT
            recipient_name,
            COUNT(*)::int AS project_count,
            SUM((bucket = 'Integrated')::int)::int AS integrated_count
          FROM windowed
          GROUP BY recipient_name
        )
        SELECT
          recipient_name,
          project_count,
          CASE
            WHEN project_count > 0
              THEN 100.0 * integrated_count::numeric / project_count
            ELSE 0
          END AS integrated_pct
        FROM agg
        WHERE project_count >= $3
        ORDER BY integrated_pct ASC, project_count DESC
        LIMIT $4;
      `;
      params = [
        startYear ? Number(startYear) : null, // $1
        endYear   ? Number(endYear)   : null, // $2
        minProjects,                           // $3
        limit,                                 // $4
      ];
    }

    const { rows } = await query(sql, params);
    const countries = rows.map((r: any) => ({
      recipient_name: r.recipient_name ?? "Unspecified",
      project_count: Number(r.project_count ?? 0),
      integrated_pct: Number(r.integrated_pct ?? 0),
    }));

    return NextResponse.json({ countries });
  } catch (err) {
    console.error("[api] underserved failed:", err);
    return NextResponse.json(
      { error: "Failed to compute underserved countries" },
      { status: 500 }
    );
  }
}

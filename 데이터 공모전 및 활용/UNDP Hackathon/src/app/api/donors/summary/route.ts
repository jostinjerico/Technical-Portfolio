// src/app/api/donors/summary/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startYear = searchParams.get("startYear");
  const endYear = searchParams.get("endYear");
  const archetype = searchParams.get("archetype");

  try {
    // 1) start from donors_analytics to know which donors we care about (archetype-level)
    const donorWhere: string[] = [];
    const donorVals: any[] = [];
    let d = 1;

    if (archetype) {
      donorWhere.push(`archetype = $${d++}`);
      donorVals.push(archetype);
    }

    const donorWhereSql = donorWhere.length
      ? `WHERE ${donorWhere.join(" AND ")}`
      : "";

    const donorSql = `
      SELECT donor_name, archetype
      FROM donors_analytics
      ${donorWhereSql};
    `;
    const { rows: donorRows } = await query(donorSql, donorVals);
    const donorNames = donorRows.map((r) => r.donor_name);

    // if no donors match, return empty
    if (!donorNames.length) {
      return NextResponse.json({
        ok: true,
        totals: {
          total_disbursement: 0,
          total_commitment: 0,
          donors: 0,
          projects: 0,
        },
        archetypes: [],
      });
    }

    // 2) now get totals from PROJECTS, filtered by year + donor list
    const projWhere: string[] = [`donor_name = ANY($1)`];
    const projVals: any[] = [donorNames];
    let p = 2;

    if (startYear) {
      projWhere.push(`year >= $${p++}`);
      projVals.push(Number(startYear));
    }
    if (endYear) {
      projWhere.push(`year <= $${p++}`);
      projVals.push(Number(endYear));
    }

    const projWhereSql = `WHERE ${projWhere.join(" AND ")}`;

    const totalsSql = `
      SELECT
        (COALESCE(SUM(usd_disbursement),0))*1000000 AS total_disbursement,
        (COALESCE(SUM(usd_commitment_imputed),0))*1000000 AS total_commitment,
        COUNT(DISTINCT donor_name) AS donorcount,
        COUNT(project_number) AS projects
      FROM projects
      ${projWhereSql};
    `;
    const { rows: totalRows } = await query(totalsSql, projVals);
    const totals = totalRows[0];

    // 3) archetype breakdown (same donors, so we can re-use donorRows)
    const archCounts: Record<string, number> = {};
    donorRows.forEach((r) => {
      archCounts[r.archetype] = (archCounts[r.archetype] || 0) + 1;
    });
    const archArray = Object.entries(archCounts)
      .map(([archetype, donors]) => ({ archetype, donors }))
      .sort((a, b) => b.donors - a.donors);

    return NextResponse.json({
      ok: true,
      totals: {
        total_disbursement: Number(totals.total_disbursement),
        total_commitment: Number(totals.total_commitment),
        donors: Number(totals.donorcount),
        projects: Number(totals.projects),
      },
      archetypes: archArray,
    });
  } catch (err) {
    console.error("[/api/donors/summary] error", err);
    return NextResponse.json(
      { error: "Failed to load donor summary." },
      { status: 500 }
    );
  }
}
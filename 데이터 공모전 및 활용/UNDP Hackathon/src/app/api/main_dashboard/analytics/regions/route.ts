import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

export async function GET() {
  const sql = `
    SELECT DISTINCT region_name
    FROM donor_region_tagged
    WHERE COALESCE(region_name,'') <> ''
    ORDER BY region_name;
  `;
  const { rows } = await query(sql);
  const regions = rows.map((r: any) => r.region_name);
  return NextResponse.json({ regions });
}

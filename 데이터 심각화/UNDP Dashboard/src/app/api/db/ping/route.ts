// src/app/api/db/ping/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db/client";

export async function GET() {
  try {
    const res = await query("SELECT 1 as ok;");
    return NextResponse.json({ ok: true, db: res.rows[0] });
  } catch (err: any) {
    console.error("DB PING FAILED:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "ping failed" },
      { status: 500 }
    );
  }
}
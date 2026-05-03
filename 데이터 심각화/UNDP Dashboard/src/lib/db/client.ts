import { Pool } from "pg";

declare global {
  var _pgPool: Pool | undefined;
}

// 1) Try env first
// 2) Fallback to 127.0.0.1 (NOT "localhost") so Windows/Docker doesn't confuse IPv6
const fallbackUrl =
  process.env.NEXT_DOCKER === "true"
    // case: your Next.js also runs in docker, so PG is 'db'
    ? "postgres://ecoadmin:ecoequity25@db:5432/ecoequity"
    // case: Next.js runs on host, PG is docker-exposed on 5432
    : "postgres://ecoadmin:ecoequity25@127.0.0.1:5432/ecoequity";

const connectionString = process.env.DATABASE_URL || fallbackUrl;

const pool =
  global._pgPool ??
  new Pool({
    connectionString,
    max: 4, // keep it small for local
    min: 0,
    idleTimeoutMillis: 50_000,
    connectionTimeoutMillis: 50_000,
    keepAlive: true,
    statement_timeout: 50_000,
    query_timeout: 50_000,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}

export async function query<T = any>(text: string, params?: any[]) {
  let lastErr: any;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const start = Date.now();
      //@ts-ignore
      const res = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (duration > 5000) {
        console.warn("[pg] slow query:", duration, "ms\n", text);
      }
      return res;
    } catch (err: any) {
      const msg = err?.message ?? "";
      const code = err?.code;

      const isConnErr =
        code === "ECONNRESET" ||
        msg.includes("Connection terminated due to connection timeout") ||
        msg.includes("Connection terminated unexpectedly");

      if (isConnErr && attempt === 1) {
        console.warn("[pg] connection dropped – retrying once…");
        lastErr = err;
        continue;
      }

      lastErr = err;
      break;
    }
  }
  throw lastErr;
}

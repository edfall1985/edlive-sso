import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string | boolean> = {};

  // 1. Environment variables
  const requiredVars = [
    "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME",
    "NEXTAUTH_URL", "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
    "JWT_SECRET", "EDLIVE_URL",
  ];

  for (const v of requiredVars) {
    checks[v] = process.env[v] ? true : `MISSING`;
  }

  // 2. Database connectivity test
  try {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "u253037503_sso_user",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "u253037503_sso_db",
      connectTimeout: 5000,
    });
    const [rows] = await conn.execute("SELECT 1 as test");
    checks.database = "OK";
    await conn.end();

    // 3. Tables check
    const conn2 = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "u253037503_sso_user",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "u253037503_sso_db",
      connectTimeout: 5000,
    });
    const [tables] = await conn2.execute("SHOW TABLES");
    const tableList = (tables as any[]).map((r: any) => Object.values(r)[0]);
    checks.tables_found = String(tableList.length);
    checks.tables = (tableList as string[]).join(", ");
    await conn2.end();
    checks.status = "healthy";
  } catch (e: any) {
    checks.database = `FAIL: ${e.message}`;
    checks.status = "degraded";
  }

  const allOk = Object.values(requiredVars).every((v) => checks[v] === true);

  return NextResponse.json(
    {
      status: checks.status,
      timestamp: new Date().toISOString(),
      node: process.version,
      checks,
    },
    { status: allOk && checks.database === "OK" ? 200 : 503 },
  );
}

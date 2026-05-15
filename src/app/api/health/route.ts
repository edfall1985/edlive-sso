import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string | boolean> = {};
  const values: Record<string, string> = {};

  const mask = (v: string | undefined) =>
    v ? v.substring(0, 4) + "..." + v.slice(-4) : "MISSING";

  const requiredVars = [
    "DB_HOST", "DB_USER", "DB_NAME",
    "NEXTAUTH_URL", "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
    "JWT_SECRET", "EDLIVE_URL",
    "NEXT_PUBLIC_EDLIVE_URL",
    "NEXT_PUBLIC_SSO_URL",
    "OWNER_EMAILS",
  ];

  for (const v of requiredVars) {
    const val = process.env[v];
    checks[v] = val ? true : `MISSING`;
    values[v] = val ? mask(val) : "(not set)";
  }

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
    await conn.execute("SELECT 1 as test");
    checks.database = "OK";
    await conn.end();

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
      platform: process.platform,
      checks,
      values,
    },
    { status: allOk && checks.database === "OK" ? 200 : 503 },
  );
}

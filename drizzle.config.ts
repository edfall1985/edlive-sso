import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "u253037503_sso_user",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "u253037503_sso_db",
  },
});

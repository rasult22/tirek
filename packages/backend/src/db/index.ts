import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
import { databaseUrl, env } from "../config/env.js";

const pool = new Pool({
  connectionString: databaseUrl,
  max: env.NODE_ENV === "production" ? 20 : 5,
});

export const db = drizzle(pool, { schema });

export { pool };
export * from "./schema.js";

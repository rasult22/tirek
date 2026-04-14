import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { databaseUrl } from "../config/env.js";

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

console.log("Running migrations...");
await migrate(db, { migrationsFolder: "../../drizzle" });
console.log("Migrations complete.");

await pool.end();

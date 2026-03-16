import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://spec:changeme@localhost:5432/spec_hub",
});

// Auto-initialize database on first run
export async function initDB() {
  const client = await pool.connect();
  try {
    // Check if tables exist
    const { rows } = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
    );

    if (!rows[0].exists) {
      console.log("Initializing database schema...");
      const schemaPath = join(__dirname, "..", "db", "schema.sql");
      if (existsSync(schemaPath)) {
        const schema = readFileSync(schemaPath, "utf-8");
        await client.query(schema);
        console.log("Schema created.");
      }

      // Run seed data
      const seedPath = join(__dirname, "..", "db", "seed.sql");
      if (existsSync(seedPath)) {
        const seed = readFileSync(seedPath, "utf-8");
        await client.query(seed);
        console.log("Seed data loaded.");
      }
    } else {
      console.log("Database already initialized.");
    }
  } catch (err) {
    console.error("DB init error:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;

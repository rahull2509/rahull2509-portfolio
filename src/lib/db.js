import path from 'path';
import fs from 'fs';

let pool = null;
let sqliteDb = null;
let isInitialized = false;

function getDatabaseConfig() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const isPostgres = Boolean(url && (url.startsWith('postgres://') || url.startsWith('postgresql://')));
  return { isPostgres, url };
}

export function isPostgresDatabase() {
  return getDatabaseConfig().isPostgres;
}

/**
 * Initializes database connection and runs schema migrations.
 */
export async function getDb() {
  const { isPostgres, url } = getDatabaseConfig();

  if (isPostgres) {
    if (!pool) {
      const { neon } = await import('@neondatabase/serverless');
      pool = neon(url);
    }
    if (!isInitialized) {
      await runMigrationsPostgres(pool);
      isInitialized = true;
    }
    return { type: 'postgres', client: pool };
  }

  // Fallback to SQLite (local development and serverless instances without remote DB)
  if (!sqliteDb) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'analytics.db');
    
    // Dynamic import to avoid bundling issues
    const { default: Database } = await import('better-sqlite3');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('synchronous = NORMAL');
  }

  if (!isInitialized) {
    runMigrationsSqlite(sqliteDb);
    isInitialized = true;
  }

  return { type: 'sqlite', client: sqliteDb };
}

/**
 * Run migrations for PostgreSQL
 */
async function runMigrationsPostgres(neonClient) {
  await neonClient(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id BIGSERIAL PRIMARY KEY,
      event_type VARCHAR(32) NOT NULL,
      visitor_id_hash VARCHAR(64) NOT NULL,
      page_path VARCHAR(255) NOT NULL,
      referrer_domain VARCHAR(255) DEFAULT '',
      device_type VARCHAR(32) DEFAULT 'desktop',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await neonClient(`
    CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events (created_at);
  `);
  await neonClient(`
    CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events (event_type);
  `);
  await neonClient(`
    CREATE INDEX IF NOT EXISTS idx_analytics_type_created ON analytics_events (event_type, created_at);
  `);
  await neonClient(`
    CREATE INDEX IF NOT EXISTS idx_analytics_visitor_type_created ON analytics_events (visitor_id_hash, event_type, created_at);
  `);
}

/**
 * Run migrations for SQLite
 */
function runMigrationsSqlite(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      visitor_id_hash TEXT NOT NULL,
      page_path TEXT NOT NULL,
      referrer_domain TEXT DEFAULT '',
      device_type TEXT DEFAULT 'desktop',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events (created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events (event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_type_created ON analytics_events (event_type, created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_visitor_type_created ON analytics_events (visitor_id_hash, event_type, created_at);
  `);
}

/**
 * Unified query execution
 * Accepts SQL with $1, $2, ... parameters.
 * For SQLite, maps $1, $2, ... to ? and runs synchronously/asynchronously.
 * Returns { rows: [...] }
 */
export async function executeQuery(sql, params = []) {
  const db = await getDb();

  if (db.type === 'postgres') {
    const rows = await db.client(sql, params);
    return { rows: Array.isArray(rows) ? rows : [] };
  }

  // SQLite execution
  // Replace $1, $2, ... with ? for better-sqlite3 parameter binding
  const sqliteSql = sql.replace(/\$\d+/g, '?');
  const trimmed = sqliteSql.trim();
  const isSelect = /^SELECT/i.test(trimmed);

  if (isSelect) {
    const stmt = db.client.prepare(sqliteSql);
    const rows = stmt.all(...params);
    return { rows };
  } else {
    const stmt = db.client.prepare(sqliteSql);
    const info = stmt.run(...params);
    return { rows: [], info };
  }
}

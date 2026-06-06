import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "empty-codes.db");

let dbPromise: Promise<SqlJsDatabase> | null = null;

async function getDbInstance(): Promise<SqlJsDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const SQL = await initSqlJs();
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    let db: SqlJsDatabase;
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS scrapers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL DEFAULT 'Anonymous',
        description TEXT NOT NULL,
        code TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'javascript',
        category TEXT NOT NULL DEFAULT 'other',
        tags TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        admin_notes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    saveDb(db);
    return db;
  })();

  return dbPromise;
}

function saveDb(db: SqlJsDatabase) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Execute a query and return all rows
export async function queryAll(sql: string, params: any[] = []): Promise<any[]> {
  const db = await getDbInstance();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Execute a query and return first row
export async function queryOne(sql: string, params: any[] = []): Promise<any> {
  const rows = await queryAll(sql, params);
  return rows[0] || null;
}

// Execute a mutation query
export async function execute(sql: string, params: any[] = []): Promise<number> {
  const db = await getDbInstance();
  db.run(sql, params);
  const lastId = (db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0]) as number || 0;
  saveDb(db);
  return lastId;
}

export const categoryLabels: Record<string, string> = {
  "social-media": "Social Media",
  "e-commerce": "E-Commerce",
  "ai": "AI / LLM",
  "search": "Search Engine",
  "crypto": "Crypto",
  "news": "News",
  "video": "Video",
  "image": "Image",
  "api": "API",
  "other": "Other",
};

export const languageLabels: Record<string, string> = {
  "javascript": "JavaScript",
  "python": "Python",
  "typescript": "TypeScript",
  "php": "PHP",
  "go": "Go",
  "rust": "Rust",
  "ruby": "Ruby",
  "java": "Java",
  "bash": "Bash",
};

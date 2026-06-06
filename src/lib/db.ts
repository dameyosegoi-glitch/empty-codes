import fs from "fs";
import path from "path";

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "empty-codes-data")
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "empty-codes.json");

// ── Types ──────────────────────────────────────────────
interface Scraper {
  id: number;
  title: string;
  author: string;
  description: string;
  code: string;
  language: string;
  category: string;
  tags: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

// ── In-memory store ────────────────────────────────────
let store: Scraper[] | null = null;
let nextId = 1;

function loadStore(): Scraper[] {
  if (store) return store;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_PATH)) {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    store = JSON.parse(raw);
    nextId = store!.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  } else {
    store = [];
    persist();
  }
  return store!;
}

function persist() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2));
}

function now(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// ── Mini SQL parser ────────────────────────────────────
function parseSelect(sql: string, params: any[]): Scraper[] {
  const lower = sql.toLowerCase();
  let rows = store!.slice();

  // WHERE clause
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP|\s+ORDER|\s+LIMIT|\s*$)/is);
  if (whereMatch) {
    const conditions = whereMatch[1];
    let paramIdx = 0;
    
    rows = rows.filter((row) => {
      // Split on AND
      const parts = conditions.split(/\s+AND\s+/i);
      return parts.every((cond) => {
        cond = cond.trim();
        
        // column = ? or column LIKE ?
        if (/\?/.test(cond)) {
          const col = cond.split(/\s+/)[0];
          const val = params[paramIdx++];
          
          if (/like/i.test(cond)) {
            const likeVal = String(val).replace(/%/g, "");
            return String((row as any)[col] ?? "").toLowerCase().includes(likeVal.toLowerCase());
          }
          return (row as any)[col] == val;
        }
        return true;
      });
    });
  }

  // GROUP BY
  if (lower.includes("group by")) {
    // We handle GROUP BY separately in queryAll
    return rows;
  }

  // ORDER BY
  const orderMatch = sql.match(/ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
  if (orderMatch) {
    const col = orderMatch[1];
    const dir = orderMatch[2]?.toUpperCase() === "ASC" ? 1 : -1;
    rows.sort((a, b) => {
      const va = (a as any)[col] ?? "";
      const vb = (b as any)[col] ?? "";
      return va > vb ? dir : va < vb ? -dir : 0;
    });
  }

  // LIMIT + OFFSET
  const limitMatch = sql.match(/LIMIT\s+(\?|\d+)(?:\s+OFFSET\s+(\?|\d+))?/i);
  if (limitMatch) {
    const lim = limitMatch[1] === "?" ? params.pop() : parseInt(limitMatch[1]);
    const off = limitMatch[2] === "?" ? params.pop() : (limitMatch[2] ? parseInt(limitMatch[2]) : 0);
    rows = rows.slice(off, off! + lim!);
  }

  return rows;
}

// ── Public API ──────────────────────────────────────────
export async function queryAll(sql: string, params: any[] = []): Promise<any[]> {
  loadStore();
  const lower = sql.toLowerCase().trim();
  const p = [...params]; // shallow copy

  // COUNT with GROUP BY
  if (lower.includes("group by")) {
    const rows = parseSelect(sql, []);
    const groupCol = sql.match(/GROUP BY\s+(\w+)/i)?.[1];
    if (!groupCol) return rows;
    
    const groups: Record<string, number> = {};
    for (const r of rows) {
      const key = String((r as any)[groupCol] ?? "null");
      groups[key] = (groups[key] || 0) + 1;
    }
    return Object.entries(groups).map(([k, count]) => ({ [groupCol]: k, count }));
  }

  // COUNT(*)
  if (lower.includes("count(*)")) {
    const rows = parseSelect(sql, []);
    return [{ count: rows.length }];
  }

  return parseSelect(sql, p);
}

export async function queryOne(sql: string, params: any[] = []): Promise<any> {
  const rows = await queryAll(sql, params);
  return rows[0] || null;
}

export async function execute(sql: string, params: any[] = []): Promise<number> {
  loadStore();
  const lower = sql.toLowerCase().trim();

  if (lower.startsWith("insert")) {
    // INSERT INTO scrapers (...) VALUES (...)
    const colsMatch = sql.match(/\((.+?)\)\s*VALUES/i);
    if (!colsMatch) throw new Error("Invalid INSERT: no columns");
    
    const cols = colsMatch[1].split(",").map((c) => c.trim());
    const id = nextId++;
    const ts = now();
    
    const record: any = { id, created_at: ts, updated_at: ts };
    for (let i = 0; i < cols.length; i++) {
      record[cols[i]] = params[i] ?? "";
    }
    
    store!.push(record as Scraper);
    persist();
    return id;
  }

  if (lower.startsWith("update")) {
    // UPDATE scrapers SET col=?, ... WHERE id=?
    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
    const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
    if (!setMatch || !whereMatch) throw new Error("Invalid UPDATE");
    
    const whereCol = whereMatch[1];
    const whereVal = params.pop();
    
    const sets = setMatch[1].split(",").map((s) => s.trim());
    const record = store!.find((r) => (r as any)[whereCol] == whereVal);
    if (!record) return 0;
    
    for (let i = 0; i < sets.length; i++) {
      const col = sets[i].split("=")[0].trim();
      (record as any)[col] = params[i] ?? "";
    }
    record.updated_at = now();
    persist();
    return 1;
  }

  if (lower.startsWith("delete")) {
    // DELETE FROM scrapers WHERE id=?
    const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
    if (!whereMatch) throw new Error("Invalid DELETE");
    
    const whereCol = whereMatch[1];
    const whereVal = params[0];
    const idx = store!.findIndex((r) => (r as any)[whereCol] == whereVal);
    if (idx === -1) return 0;
    
    store!.splice(idx, 1);
    persist();
    return 1;
  }

  throw new Error(`Unsupported SQL: ${sql}`);
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

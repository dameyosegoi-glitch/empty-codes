import { kv } from "@vercel/kv";

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

// ── Keys ────────────────────────────────────────────────
const ID_KEY = "empty-codes:nextId";
const ALL_KEY = "empty-codes:all";

function now(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

async function ensureStore(): Promise<void> {
  const exists = await kv.exists(ALL_KEY);
  if (!exists) {
    await kv.set(ALL_KEY, JSON.stringify([]));
    await kv.set(ID_KEY, 1);
  }
}

// ── Mini SQL parser ────────────────────────────────────
function matchRow(row: Scraper, sql: string, params: any[]): boolean {
  const lower = sql.toLowerCase();
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP|\s+ORDER|\s+LIMIT|\s*$)/is);
  if (!whereMatch) return true;

  const conditions = whereMatch[1];
  let paramIdx = 0;

  const parts = conditions.split(/\s+AND\s+/i);
  return parts.every((cond) => {
    cond = cond.trim();
    if (/\?/.test(cond)) {
      const col = cond.split(/\s+/)[0];
      const val = params[paramIdx++];

      if (/like/i.test(cond)) {
        const likeVal = String(val).replace(/%/g, "");
        return String((row as any)[col] ?? "")
          .toLowerCase()
          .includes(likeVal.toLowerCase());
      }
      return (row as any)[col] == val;
    }
    return true;
  });
}

function sortAndPaginate(
  rows: Scraper[],
  sql: string,
  params: any[]
): Scraper[] {
  const lower = sql.toLowerCase();

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
    const lim =
      limitMatch[1] === "?" ? params.pop() : parseInt(limitMatch[1]);
    const off =
      limitMatch[2] === "?" ? params.pop() : (limitMatch[2] ? parseInt(limitMatch[2]) : 0);
    rows = rows.slice(off, off! + lim!);
  }

  return rows;
}

// ── Public API ──────────────────────────────────────────
export async function queryAll(
  sql: string,
  params: any[] = []
): Promise<any[]> {
  await ensureStore();
  const lower = sql.toLowerCase().trim();
  const p = [...params];

  // COUNT with GROUP BY
  if (lower.includes("group by")) {
    const all = JSON.parse((await kv.get(ALL_KEY)) || "[]") as Scraper[];
    const filtered = all.filter((r) => matchRow(r, sql, []));
    const groupCol = sql.match(/GROUP BY\s+(\w+)/i)?.[1];
    if (!groupCol) return filtered;

    const groups: Record<string, number> = {};
    for (const r of filtered) {
      const key = String((r as any)[groupCol] ?? "null");
      groups[key] = (groups[key] || 0) + 1;
    }
    return Object.entries(groups).map(([k, count]) => ({
      [groupCol]: k,
      count,
    }));
  }

  // COUNT(*)
  if (lower.includes("count(*)")) {
    const all = JSON.parse((await kv.get(ALL_KEY)) || "[]") as Scraper[];
    const filtered = all.filter((r) => matchRow(r, sql, []));
    return [{ count: filtered.length }];
  }

  // SELECT
  const all = JSON.parse((await kv.get(ALL_KEY)) || "[]") as Scraper[];
  const filtered = all.filter((r) => matchRow(r, sql, p));
  return sortAndPaginate(filtered, sql, p);
}

export async function queryOne(
  sql: string,
  params: any[] = []
): Promise<any> {
  const rows = await queryAll(sql, params);
  return rows[0] || null;
}

export async function execute(
  sql: string,
  params: any[] = []
): Promise<number> {
  await ensureStore();
  const lower = sql.toLowerCase().trim();

  if (lower.startsWith("insert")) {
    await ensureStore();
    const id = ((await kv.get(ID_KEY)) as number) || 1;
    await kv.set(ID_KEY, id + 1);
    const ts = now();

    const colsMatch = sql.match(/\((.+?)\)\s*VALUES\s*\((.+?)\)\s*$/is);
    if (!colsMatch) throw new Error("Invalid INSERT");

    const cols = colsMatch[1].split(",").map((c) => c.trim());
    const valsRaw = colsMatch[2];

    const vals: string[] = [];
    let current = "";
    let inQuote = false;
    for (const ch of valsRaw) {
      if (ch === "'" || ch === '"') {
        inQuote = !inQuote;
        current += ch;
      } else if (ch === "," && !inQuote) {
        vals.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    vals.push(current.trim());

    let paramIdx = 0;
    const record: any = { id, created_at: ts, updated_at: ts };
    for (let i = 0; i < cols.length; i++) {
      const v = vals[i] ?? "?";
      if (v === "?") {
        record[cols[i]] = params[paramIdx++] ?? "";
      } else {
        record[cols[i]] = v.replace(/^['"]|['"]$/g, "");
      }
    }

    const all = JSON.parse((await kv.get(ALL_KEY)) || "[]") as Scraper[];
    all.push(record as Scraper);
    await kv.set(ALL_KEY, JSON.stringify(all));
    return id;
  }

  if (lower.startsWith("update")) {
    const all = JSON.parse((await kv.get(ALL_KEY)) || "[]") as Scraper[];
    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
    const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
    if (!setMatch || !whereMatch) throw new Error("Invalid UPDATE");

    const whereCol = whereMatch[1];
    const whereVal = params.pop();

    const sets = setMatch[1].split(",").map((s) => s.trim());
    const record = all.find((r) => (r as any)[whereCol] == whereVal);
    if (!record) return 0;

    for (let i = 0; i < sets.length; i++) {
      const col = sets[i].split("=")[0].trim();
      (record as any)[col] = params[i] ?? "";
    }
    record.updated_at = now();
    await kv.set(ALL_KEY, JSON.stringify(all));
    return 1;
  }

  if (lower.startsWith("delete")) {
    const all = JSON.parse((await kv.get(ALL_KEY)) || "[]") as Scraper[];
    const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
    if (!whereMatch) throw new Error("Invalid DELETE");

    const whereCol = whereMatch[1];
    const whereVal = params[0];
    const idx = all.findIndex((r) => (r as any)[whereCol] == whereVal);
    if (idx === -1) return 0;

    all.splice(idx, 1);
    await kv.set(ALL_KEY, JSON.stringify(all));
    return 1;
  }

  throw new Error(`Unsupported SQL: ${sql}`);
}

export const categoryLabels: Record<string, string> = {
  "social-media": "Social Media",
  "e-commerce": "E-Commerce",
  ai: "AI / LLM",
  search: "Search Engine",
  crypto: "Crypto",
  news: "News",
  video: "Video",
  image: "Image",
  api: "API",
  other: "Other",
};

export const languageLabels: Record<string, string> = {
  javascript: "JavaScript",
  python: "Python",
  typescript: "TypeScript",
  php: "PHP",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  java: "Java",
  bash: "Bash",
};

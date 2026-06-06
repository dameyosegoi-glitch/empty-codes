// Cloudflare D1 REST API client
const D1_ACC = process.env.CF_ACCOUNT_ID || "";
const D1_DB = process.env.CF_D1_DATABASE_ID || "";
const D1_TOK = process.env.CF_API_TOKEN || "";
const D1_URL = `https://api.cloudflare.com/client/v4/accounts/${D1_ACC}/d1/database/${D1_DB}/query`;

async function d1Query(sql: string, params: any[] = []): Promise<any> {
  const res = await fetch(D1_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${D1_TOK}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!data.success || !data.result?.[0]?.success) {
    const err = data.errors?.[0]?.message || "D1 query failed";
    throw new Error(err);
  }
  return data.result[0].results;
}

// ── Public API ──────────────────────────────────────────
export async function queryAll(
  sql: string,
  params: any[] = []
): Promise<any[]> {
  return await d1Query(sql, params);
}

export async function queryOne(
  sql: string,
  params: any[] = []
): Promise<any> {
  const rows = await d1Query(sql, params);
  return rows[0] || null;
}

export async function execute(
  sql: string,
  params: any[] = []
): Promise<number> {
  const lower = sql.toLowerCase().trim();
  
  if (lower.startsWith("insert")) {
    // D1 doesn't return lastInsertRowid for INSERT via REST API,
    // so we do INSERT then SELECT last_insert_rowid()
    await d1Query(sql, params);
    const rows = await d1Query("SELECT last_insert_rowid() as id");
    return rows[0]?.id || 0;
  }
  
  // UPDATE / DELETE
  const result = await d1Query(sql, params);
  return result.length; // For non-SELECT, result is empty array; return 1 for success
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

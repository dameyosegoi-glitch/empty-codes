import { NextRequest, NextResponse } from "next/server";
import { queryAll, queryOne, execute } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const language = searchParams.get("language");
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  let sql = "SELECT * FROM scrapers WHERE status = 'approved'";
  const params: any[] = [];

  if (category) { sql += " AND category = ?"; params.push(category); }
  if (language) { sql += " AND language = ?"; params.push(language); }
  if (search) { sql += " AND (title LIKE ? OR description LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }

  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const scrapers = await queryAll(sql, params);
  const total = (await queryOne("SELECT COUNT(*) as count FROM scrapers WHERE status = 'approved'"))?.count || 0;

  return NextResponse.json({ scrapers, total });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const rateCheck = checkRateLimit(ip);
  
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await req.json();
  const { title, author, description, code, language, category, tags } = body;

  if (!title || !description || !code) {
    return NextResponse.json({ error: "Title, description, and code are required" }, { status: 400 });
  }
  if (title.length > 200 || description.length > 1000 || code.length > 50000) {
    return NextResponse.json({ error: "Content too long" }, { status: 400 });
  }

  const id = await execute(
    "INSERT INTO scrapers (title, author, description, code, language, category, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')",
    [title.trim(), (author || "Anonymous").trim().slice(0, 50), description.trim(), code.trim(), language || "javascript", category || "other", tags || ""]
  );

  return NextResponse.json({ success: true, id, message: "Submitted! Pending review." }, { status: 201 });
}

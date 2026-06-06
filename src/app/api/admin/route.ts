import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";

const ADMIN_PASSWORD=proces...
if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD env not set");

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return (auth?.startsWith("Bearer ") && auth.slice(7) === ADMIN_PASSWORD) || false;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const scrapers = await queryAll("SELECT * FROM scrapers WHERE status = ? ORDER BY created_at DESC LIMIT 50", [status]);
  const counts = await queryAll("SELECT status, COUNT(*) as count FROM scrapers GROUP BY status");
  return NextResponse.json({ scrapers, counts });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status, admin_notes } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
  await execute("UPDATE scrapers SET status = ?, admin_notes = ?, updated_at = datetime('now') WHERE id = ?", [status, admin_notes || "", id]);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await execute("DELETE FROM scrapers WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}

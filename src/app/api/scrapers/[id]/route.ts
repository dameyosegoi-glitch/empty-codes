import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scraper = await queryOne("SELECT * FROM scrapers WHERE id = ? AND status = 'approved'", [id]);
  if (!scraper) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(scraper);
}

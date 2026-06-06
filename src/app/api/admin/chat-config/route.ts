import { NextRequest, NextResponse } from "next/server";

function getEnv(key: string): string | undefined {
  return typeof process !== "undefined" ? (process as any).env?.[key] : undefined;
}

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const pass = getEnv("ADMIN_PASSWORD");
  return !!(pass && auth?.startsWith("Bearer ") && auth.slice(7) === pass);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = getEnv("NINEROUTER_URL");
  const key = getEnv("NINEROUTER_API_KEY");

  if (!url || !key) {
    return NextResponse.json({ error: "AI config incomplete" }, { status: 500 });
  }

  return NextResponse.json({
    url: url + "/v1/chat/completions",
    apiKey: key,
    model: "FM",
  });
}

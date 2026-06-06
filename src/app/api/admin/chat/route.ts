import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD env not set");
const NINEROUTER_BASE = process.env.NINEROUTER_URL;
if (!NINEROUTER_BASE) throw new Error("NINEROUTER_URL env not set");
const NINEROUTER_URL = NINEROUTER_BASE + "/v1/chat/completions";
const NINEROUTER_API_KEY = process.env.NINEROUTER_API_KEY || "";
if (!NINEROUTER_API_KEY) console.warn("NINEROUTER_API_KEY not set — AI chat will fail");

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return (auth?.startsWith("Bearer ") && auth.slice(7) === ADMIN_PASSWORD) || false;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt } = await req.json();
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  let raw = "";

  try {
    // Call FM via 9routers to generate scraper
    const llmRes = await fetch(NINEROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NINEROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "FM",
        stream: false,
        messages: [
          {
            role: "system",
            content: `Scraper generator. Output ONLY JSON: {"title":"...","description":"...","code":"...","language":"python","category":"social-media|e-commerce|ai|search|crypto|news|video|image|api|other"}. Keep code under 80 lines, use modern patterns.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    const llmData = await llmRes.json();
    const msg = llmData.choices?.[0]?.message || {};
    raw = msg.content || msg.reasoning_content || "";
    
    // Parse JSON from response (handle markdown code blocks)
    let json = raw;
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) json = jsonMatch[1].trim();
    
    const scraper = JSON.parse(json);
    
    if (!scraper.title || !scraper.code) {
      return NextResponse.json({ error: "AI generated invalid scraper", raw: raw.slice(0, 500), json: json.slice(0, 500) }, { status: 500 });
    }

    // Submit to database
    const id = await execute(
      "INSERT INTO scrapers (title, author, description, code, language, category, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')",
      [
        scraper.title.slice(0, 200),
        "AI Agent",
        (scraper.description || "").slice(0, 1000),
        scraper.code.slice(0, 50000),
        scraper.language || "python",
        scraper.category || "other",
        "",
      ]
    );

    return NextResponse.json({
      success: true,
      id,
      title: scraper.title,
      message: `"${scraper.title}" submitted! Pending review.`,
    });
  } catch (e: any) {
    return NextResponse.json({ 
      error: e.message || "Failed",
      detail: String(e).slice(0, 300),
      rawPreview: raw.slice(0, 500)
    }, { status: 500 });
  }
}

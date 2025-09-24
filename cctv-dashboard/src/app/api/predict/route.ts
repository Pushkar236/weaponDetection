import { NextRequest, NextResponse } from "next/server";

// Configure your ngrok target via env or fallback constant
const DEFAULT_PREDICT_URL = "https://b320f6b3e0a4.ngrok-free.app/predict/";

export async function POST(req: NextRequest) {
  try {
    const target = process.env.PREDICT_URL || DEFAULT_PREDICT_URL;
    const body = await req.text();

    // Forward request to ngrok target with important headers to bypass warning/CORS
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Helps bypass ngrok browser warning interstitial
        "ngrok-skip-browser-warning": "true",
      },
      body,
      // Disable caching for realtime inference
      cache: "no-store",
    });

    if (!response.ok) {
        console.error("Upstream response error:", response.status, await response.text());
        return NextResponse.json({ error: "Upstream service error" }, { status: 502 });
    }


    const data = await response.json();
    console.log("Upstream response data:", data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("/api/predict proxy error:", err);
    return NextResponse.json({ error: "Upstream request failed" }, { status: 502 });
  }
}

export const dynamic = "force-dynamic"; // avoid caching in Next.js
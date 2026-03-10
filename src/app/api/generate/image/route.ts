import { NextRequest, NextResponse } from "next/server";

// Proxy ComfyUI images through Next.js to strip ngrok browser-warning headers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src");

  if (!src) {
    return NextResponse.json({ error: "No src" }, { status: 400 });
  }

  try {
    const response = await fetch(decodeURIComponent(src), {
      headers: {
        "ngrok-skip-browser-warning": "1",
        "User-Agent": "LumenStudio/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Fetch failed" }, { status: response.status });
    }

    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/png";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

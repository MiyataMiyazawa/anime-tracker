import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return new Response("url parameter is required", { status: 400 });
  }

  // AniListの画像ドメインのみ許可
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  const allowed = ["s4.anilist.co", "img.anili.st"];
  if (!allowed.includes(parsed.hostname)) {
    return new Response("Domain not allowed", { status: 403 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new Response("Failed to fetch image", { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Failed to fetch image", { status: 502 });
  }
}

import { type NextRequest } from "next/server";
import type { AniListResult } from "@/lib/anilist";

const ANILIST_URL = "https://graphql.anilist.co";

const SEARCH_QUERY = `
query ($search: String!) {
  Page(perPage: 8) {
    media(search: $search, type: ANIME) {
      id
      title {
        romaji
        native
        english
      }
      episodes
      duration
      seasonYear
      season
      coverImage {
        large
      }
      format
    }
  }
}
`;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return Response.json({ results: [], error: "検索ワードが必要です" }, { status: 400 });
  }

  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: SEARCH_QUERY, variables: { search: q } }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return Response.json(
          { results: [], error: "レート制限に達しました。少し待ってから再試行してください" },
          { status: 429 }
        );
      }
      return Response.json(
        { results: [], error: "AniList APIからの応答にエラーがありました" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      data?: { Page?: { media?: AniListResult[] } };
    };

    const results = data?.data?.Page?.media ?? [];
    return Response.json({ results });
  } catch (e) {
    console.error("[anilist-search] Unexpected error:", e);
    return Response.json(
      { results: [], error: "AniList APIへの接続に失敗しました" },
      { status: 502 }
    );
  }
}

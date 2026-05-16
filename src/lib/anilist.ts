export interface AniListResult {
  id: number;
  title: { romaji: string | null; native: string | null; english: string | null };
  episodes: number | null;
  duration: number | null;
  seasonYear: number | null;
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL" | null;
  coverImage: { large: string | null };
  format: string | null;
}

export interface AniListSearchResponse {
  results: AniListResult[];
  error?: string;
}

export function seasonToMonth(season: AniListResult["season"]): number {
  switch (season) {
    case "WINTER":
      return 1;
    case "SPRING":
      return 4;
    case "SUMMER":
      return 7;
    case "FALL":
      return 10;
    default:
      return 1;
  }
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Anime } from "@/lib/db";

const statusLabel: Record<Anime["status"], string> = {
  watching: "視聴中",
  completed: "完了",
  dropped: "中断",
  planned: "予定",
};

// Status styling — restrained, monochrome-tinted except "watching" which is the hero state
const statusChip: Record<Anime["status"], string> = {
  watching: "bg-brand text-white",
  completed: "bg-success/10 text-success border border-success/30",
  dropped: "bg-danger/10 text-danger border border-danger/30",
  planned: "bg-warning/10 text-warning border border-warning/30",
};

export default function AnimeCard({
  anime,
  showDate = false,
}: {
  anime: Anime;
  showDate?: boolean;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (anime.imageBlob) {
      const url = URL.createObjectURL(anime.imageBlob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [anime.imageBlob]);

  const watchedMinutes = anime.watchedEpisodes * anime.episodeDuration;
  const hours = Math.floor(watchedMinutes / 60);
  const mins = watchedMinutes % 60;
  const progress =
    anime.totalEpisodes > 0
      ? Math.round((anime.watchedEpisodes / anime.totalEpisodes) * 100)
      : 0;
  const isWatching = anime.status === "watching";

  return (
    <Link href={`/anime/${anime.id}`} className="block">
      <div
        className={`group flex gap-3 bg-card rounded-2xl p-3 border transition-all duration-200 active:scale-[0.99] ${
          isWatching
            ? "border-accent/30 shadow-card hover:shadow-card-hover hover:-translate-y-0.5"
            : "border-border shadow-card hover:shadow-card-hover hover:border-border-strong hover:-translate-y-0.5"
        }`}
      >
        <div className="w-16 h-22 rounded-xl bg-border/60 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={anime.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-muted">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          )}
          {isWatching && (
            <div className="absolute top-1.5 left-1.5 bg-brand text-white text-[9px] px-1.5 py-0.5 font-bold tracking-widest rounded-md shadow-sm">
              NOW
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-sm truncate tracking-tight">{anime.title}</h3>
              <span
                className={`${statusChip[anime.status]} text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0`}
              >
                {statusLabel[anime.status]}
              </span>
            </div>
            {showDate && (
              <p className="text-[10px] text-muted-dark mt-0.5 font-medium">
                {anime.year}年{anime.month}月
              </p>
            )}

            {/* Tags */}
            {anime.tags && anime.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {anime.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-medium px-1.5 py-0 rounded text-muted-dark"
                  >
                    #{t}
                  </span>
                ))}
                {anime.tags.length > 3 && (
                  <span className="text-[10px] text-muted px-1">
                    +{anime.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="tabular-nums text-muted-dark font-medium">
                {anime.watchedEpisodes}
                <span className="text-muted mx-0.5">/</span>
                {anime.totalEpisodes}
                <span className="text-muted ml-0.5">話</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted tabular-nums text-[10px]">
                  {hours > 0 ? `${hours}h` : ""}
                  {mins > 0 ? `${mins}m` : hours === 0 ? "0m" : ""}
                </span>
                <span className="font-bold tabular-nums text-foreground">{progress}%</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isWatching ? "bg-brand" : progress === 100 ? "bg-success" : "bg-accent"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

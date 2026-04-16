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

const statusColor: Record<Anime["status"], string> = {
  watching: "bg-gradient-brand",
  completed: "bg-success",
  dropped: "bg-danger",
  planned: "bg-amber",
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
    <Link href={`/anime/${anime.id}`}>
      <div
        className={`flex gap-3 bg-card rounded-2xl p-3 border transition-all active:scale-[0.98] ${
          isWatching
            ? "border-accent/50 shadow-pop-accent hover:shadow-pop-pink"
            : "border-border hover:border-accent/50 hover:shadow-pop-accent"
        }`}
      >
        <div className="w-16 h-22 rounded-xl bg-border flex-shrink-0 overflow-hidden flex items-center justify-center relative">
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
            <div className="absolute top-0 left-0 w-full bg-gradient-brand text-white text-[8px] text-center py-0.5 font-bold tracking-wider">
              NOW
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm truncate">{anime.title}</h3>
            <span
              className={`${statusColor[anime.status]} text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0`}
            >
              {statusLabel[anime.status]}
            </span>
          </div>
          {showDate && (
            <p className="text-[10px] text-muted mt-0.5">
              {anime.year}年{anime.month}月
            </p>
          )}

          {/* Progress bar */}
          <div className="mt-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted mb-0.5">
              <span>
                {anime.watchedEpisodes} / {anime.totalEpisodes} 話
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isWatching ? "bg-gradient-brand" : "bg-success"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Watch time & rating */}
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-muted text-xs">
              {hours > 0
                ? `${hours}時間${mins > 0 ? `${mins}分` : ""}`
                : `${mins}分`}
            </p>
            {anime.rating && (
              <div className="flex items-center gap-0.5">
                <span className="text-warning text-xs">★</span>
                <span className="text-xs text-muted">{anime.rating}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {anime.tags && anime.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {anime.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gradient-accent text-accent-dark border border-accent/20"
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
      </div>
    </Link>
  );
}

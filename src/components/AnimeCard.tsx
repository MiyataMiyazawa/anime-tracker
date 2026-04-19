"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
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

const SWIPE_THRESHOLD = 70;
const MAX_OFFSET = 120;

export default function AnimeCard({
  anime,
  showDate = false,
  onIncrement,
  onDecrement,
}: {
  anime: Anime;
  showDate?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swiping = useRef(false);
  const didSwipe = useRef(false);

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
  const canIncrement = anime.watchedEpisodes < anime.totalEpisodes;
  const canDecrement = anime.watchedEpisodes > 0;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = false;
    didSwipe.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!swiping.current && Math.abs(dx) > 10) {
      if (Math.abs(dx) > Math.abs(dy) * 1.5) {
        swiping.current = true;
      } else {
        return;
      }
    }

    if (!swiping.current) return;

    // Left swipe (dx < 0) → +1, Right swipe (dx > 0) → -1
    const canSwipeLeft = dx < 0 && canIncrement && onIncrement;
    const canSwipeRight = dx > 0 && canDecrement && onDecrement;

    if (canSwipeLeft || canSwipeRight) {
      didSwipe.current = true;
      const absDx = Math.abs(dx);
      const damped = Math.min(absDx * 0.7, MAX_OFFSET);
      setOffsetX(dx < 0 ? -damped : damped);
    }
  }, [canIncrement, canDecrement, onIncrement, onDecrement]);

  const handleTouchEnd = useCallback(() => {
    const absOffset = Math.abs(offsetX);
    if (didSwipe.current && absOffset > SWIPE_THRESHOLD) {
      if (offsetX < 0 && onIncrement) {
        onIncrement();
        setFeedbackText("+1話");
        setTimeout(() => setFeedbackText(null), 900);
      } else if (offsetX > 0 && onDecrement) {
        onDecrement();
        setFeedbackText("-1話");
        setTimeout(() => setFeedbackText(null), 900);
      }
    }
    setOffsetX(0);
    swiping.current = false;
  }, [offsetX, onIncrement, onDecrement]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (didSwipe.current) {
      e.preventDefault();
      didSwipe.current = false;
    }
  }, []);

  const absOffset = Math.abs(offsetX);
  const thresholdReached = absOffset > SWIPE_THRESHOLD;
  const isSwipingLeft = offsetX < 0;
  const isSwipingRight = offsetX > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe background: left swipe → +1 (green, right side) */}
      {isSwipingLeft && (
        <div
          className={`absolute inset-0 flex items-center justify-end pr-5 transition-colors ${
            thresholdReached ? "bg-success/20" : "bg-success/8"
          }`}
        >
          <span
            className={`font-bold text-sm transition-all ${
              thresholdReached ? "text-success scale-110" : "text-success/50 scale-100"
            }`}
          >
            +1話
          </span>
        </div>
      )}

      {/* Swipe background: right swipe → -1 (orange, left side) */}
      {isSwipingRight && (
        <div
          className={`absolute inset-0 flex items-center pl-5 transition-colors ${
            thresholdReached ? "bg-warning/20" : "bg-warning/8"
          }`}
        >
          <span
            className={`font-bold text-sm transition-all ${
              thresholdReached ? "text-warning scale-110" : "text-warning/50 scale-100"
            }`}
          >
            -1話
          </span>
        </div>
      )}

      {/* Feedback badge */}
      {feedbackText && (
        <div
          className={`absolute top-1/2 z-10 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-[fade-out_0.9s_ease-out_forwards] ${
            feedbackText === "+1話" ? "right-4 bg-success" : "left-4 bg-warning"
          }`}
        >
          {feedbackText}
        </div>
      )}

      <Link href={`/anime/${anime.id}`} className="block" onClick={handleClick}>
        <div
          className={`group flex gap-3 bg-card rounded-2xl p-3 border transition-all ${
            offsetX !== 0 ? "" : "duration-200 active:scale-[0.99]"
          } ${
            isWatching
              ? "border-accent/30 shadow-card hover:shadow-card-hover hover:-translate-y-0.5"
              : "border-border shadow-card hover:shadow-card-hover hover:border-border-strong hover:-translate-y-0.5"
          }`}
          style={{
            transform: `translateX(${offsetX}px)`,
            transition: offsetX === 0 ? "transform 0.3s ease-out" : "none",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
                  {anime.year != null && anime.month != null
                    ? `${anime.year}年${anime.month}月`
                    : "時期不明"}
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

            {/* Progress bar + stepper */}
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
    </div>
  );
}

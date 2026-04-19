"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import EpisodeList from "@/components/EpisodeList";
import type { Anime } from "@/lib/db";

const statusLabel: Record<Anime["status"], string> = {
  watching: "視聴中",
  completed: "完了",
  dropped: "中断",
  planned: "予定",
};

const statusChip: Record<Anime["status"], string> = {
  watching: "bg-brand text-white",
  completed: "bg-success/10 text-success border border-success/30",
  dropped: "bg-danger/10 text-danger border border-danger/30",
  planned: "bg-warning/10 text-warning border border-warning/30",
};

export default function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.anime.get(Number(id)).then((a) => {
      setAnime(a ?? null);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (anime?.imageBlob) {
      const url = URL.createObjectURL(anime.imageBlob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [anime?.imageBlob]);

  if (loading) {
    return <div className="text-center text-muted py-12">読み込み中...</div>;
  }

  if (!anime) {
    return <div className="text-center text-muted py-12">見つかりませんでした</div>;
  }

  const watchedMinutes = anime.watchedEpisodes * anime.episodeDuration;
  const hours = Math.floor(watchedMinutes / 60);
  const mins = watchedMinutes % 60;
  const progress =
    anime.totalEpisodes > 0
      ? Math.round((anime.watchedEpisodes / anime.totalEpisodes) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {/* Header image */}
      {imageUrl && (
        <div className="w-full h-52 -mx-4 -mt-4 overflow-hidden relative" style={{ width: "calc(100% + 2rem)" }}>
          <img src={imageUrl} alt={anime.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
      )}

      {/* Title + status + edit button */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight leading-tight">{anime.title}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`${statusChip[anime.status]} text-[11px] font-bold px-2.5 py-0.5 rounded-md`}>
              {statusLabel[anime.status]}
            </span>
            {anime.year != null && anime.month != null ? (
              <span className="text-xs text-muted-dark">{anime.year}年{anime.month}月</span>
            ) : (
              <span className="text-xs text-muted-dark">時期不明</span>
            )}
          </div>
        </div>
        <Link
          href={`/anime/${anime.id}/edit`}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border border-border bg-card text-muted-dark hover:border-accent hover:text-accent active:scale-95 transition-all shadow-card"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
          編集
        </Link>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-bold tabular-nums">
            {anime.watchedEpisodes}
            <span className="text-muted mx-1">/</span>
            {anime.totalEpisodes}話
          </span>
          <span className="font-bold tabular-nums">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              anime.status === "watching" ? "bg-brand" : progress === 100 ? "bg-success" : "bg-accent"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-dark">
          <span>{anime.episodeDuration}分/話</span>
          <span>
            {hours > 0 ? `${hours}h` : ""}
            {mins > 0 ? `${mins}m` : hours === 0 ? "0m" : ""} 視聴
          </span>
        </div>
      </div>

      {/* Tags */}
      {anime.tags.length > 0 && (
        <div>
          <p className="label-eyebrow mb-1.5">タグ</p>
          <div className="flex flex-wrap gap-1.5">
            {anime.tags.map((t) => (
              <span
                key={t}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent-tint text-accent-dark border border-accent/20"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Characters */}
      {anime.characters && anime.characters.length > 0 && (
        <div>
          <p className="label-eyebrow mb-1.5">キャラクター</p>
          <div className="space-y-2">
            {anime.characters.map((c, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-3 shadow-card"
              >
                <p className="text-sm font-bold">{c.name}</p>
                <p className="text-xs text-muted-dark mt-0.5">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memo */}
      {anime.memo && (
        <div>
          <p className="label-eyebrow mb-1.5">メモ</p>
          <div className="bg-card border border-border rounded-xl p-3 shadow-card">
            <p className="text-sm text-foreground whitespace-pre-wrap">{anime.memo}</p>
          </div>
        </div>
      )}

      {/* Episodes */}
      <div className="pt-2 border-t border-border">
        <EpisodeList animeId={anime.id} />
      </div>
    </div>
  );
}

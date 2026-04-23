"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
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

function CardImage({ anime }: { anime: Anime }) {
  const [url, setUrl] = useState<string | null>(null);
  const prevBlobSize = useRef<number | null>(null);

  useEffect(() => {
    if (anime.imageBlob) {
      // Blobのサイズが同じなら中身は変わっていないのでURL再生成をスキップ
      if (prevBlobSize.current === anime.imageBlob.size && url) {
        return;
      }
      prevBlobSize.current = anime.imageBlob.size;
      const u = URL.createObjectURL(anime.imageBlob);
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return u;
      });
      return () => {
        URL.revokeObjectURL(u);
      };
    } else {
      prevBlobSize.current = null;
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [anime.imageBlob]);

  if (url) {
    return <img src={url} alt={anime.title} className="w-full h-full object-cover" />;
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-border/60">
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} className="text-muted">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    </div>
  );
}

export default function CollectionPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const animeList = useLiveQuery(async () => {
    const all = await db.anime.toArray();
    return all.sort((a, b) => {
      const ay = a.year ?? -1;
      const by = b.year ?? -1;
      const am = a.month ?? -1;
      const bm = b.month ?? -1;
      return by - ay || bm - am || b.id - a.id;
    });
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = animeList
    ? animeList.filter((a) => {
        if (statusFilter && a.status !== statusFilter) return false;
        if (query && !a.title.toLowerCase().includes(query)) return false;
        return true;
      })
    : null;

  return (
    <div className="space-y-5">
      <div className="pt-1">
        <p className="label-eyebrow">collection</p>
        <h1 className="text-3xl font-black tracking-tight mt-1">コレクション</h1>
      </div>

      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 1110.5 4a6.5 6.5 0 016.5 6.5z" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="タイトル検索"
          className="w-full bg-card border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm shadow-card focus:outline-none focus:border-accent focus:shadow-card-hover transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="検索をクリア"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5">
        {(
          [
            { key: null, label: "全て" },
            { key: "watching", label: "視聴中" },
            { key: "completed", label: "完了" },
            { key: "planned", label: "予定" },
            { key: "dropped", label: "中断" },
          ] as const
        ).map(({ key, label }) => {
          const active = statusFilter === key;
          return (
            <button
              key={label}
              onClick={() => setStatusFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all active:scale-95 ${
                active
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-muted-dark hover:border-accent/50 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Count */}
      {filtered && (
        <p className="text-xs text-muted">{filtered.length}作品</p>
      )}

      {/* Grid */}
      {!filtered ? (
        <div className="text-center text-muted py-12">読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted py-12">
          <p className="text-sm">作品がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((anime) => {
            const progress =
              anime.totalEpisodes > 0
                ? Math.round((anime.watchedEpisodes / anime.totalEpisodes) * 100)
                : 0;

            return (
              <Link
                key={anime.id}
                href={`/anime/${anime.id}`}
                className="block group"
              >
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <CardImage anime={anime} />
                    <span
                      className={`absolute top-2 left-2 ${statusChip[anime.status]} text-[10px] font-bold px-2 py-0.5 rounded-md`}
                    >
                      {statusLabel[anime.status]}
                    </span>
                    {/* Progress bar overlay at bottom of image */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                      <div
                        className={`h-full transition-all ${
                          anime.status === "watching"
                            ? "bg-brand"
                            : progress === 100
                              ? "bg-success"
                              : "bg-accent"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-xs font-bold truncate">{anime.title}</h3>
                    <p className="text-[10px] text-muted-dark mt-0.5 tabular-nums">
                      {anime.watchedEpisodes}/{anime.totalEpisodes}話
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

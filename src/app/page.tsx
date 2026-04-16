"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import AnimeCard from "@/components/AnimeCard";
import MonthSelector from "@/components/MonthSelector";

export default function HomePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const query = search.trim().toLowerCase();
  const isSearching = query.length > 0;
  const isFiltering = isSearching || tagFilter !== null;

  // 全タグ一覧（頻度順）
  const allTags = useLiveQuery(async () => {
    const all = await db.anime.toArray();
    const freq = new Map<string, number>();
    for (const a of all) {
      for (const t of a.tags ?? []) {
        freq.set(t, (freq.get(t) ?? 0) + 1);
      }
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
  }, []);

  const animeList = useLiveQuery(async () => {
    if (isFiltering) {
      let collection = db.anime.toCollection();
      if (tagFilter) {
        collection = db.anime.where("tags").equals(tagFilter);
      }
      const all = await collection.toArray();
      const filtered = isSearching
        ? all.filter((a) => a.title.toLowerCase().includes(query))
        : all;
      return filtered.sort(
        (a, b) => b.year - a.year || b.month - a.month || b.id - a.id
      );
    }
    return db.anime.where({ year, month }).toArray();
  }, [year, month, isFiltering, isSearching, query, tagFilter]);

  const monthStats =
    !isFiltering && animeList
      ? {
          count: animeList.length,
          totalEpisodes: animeList.reduce((s, a) => s + a.watchedEpisodes, 0),
          totalMinutes: animeList.reduce(
            (s, a) => s + a.watchedEpisodes * a.episodeDuration,
            0
          ),
        }
      : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-brand shadow-pop-accent">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </span>
        <h1 className="text-2xl font-black tracking-tight brand-text">
          Anime Tracker
        </h1>
      </div>

      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 1110.5 4a6.5 6.5 0 016.5 6.5z"
          />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="タイトル検索"
          className="w-full bg-card border border-border rounded-2xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-accent focus:shadow-pop-accent transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="検索をクリア"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Tag filter */}
      {allTags && allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tagFilter && (
            <button
              onClick={() => setTagFilter(null)}
              className="text-xs px-2 py-1 rounded-full border border-border text-muted hover:text-foreground transition-colors"
            >
              ✕ 全て
            </button>
          )}
          {allTags.map((t) => {
            const active = tagFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTagFilter(active ? null : t)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all active:scale-95 ${
                  active
                    ? "border-transparent bg-gradient-brand text-white shadow-pop-pink"
                    : "border-border bg-card text-muted hover:border-accent/50 hover:text-foreground"
                }`}
              >
                #{t}
              </button>
            );
          })}
        </div>
      )}

      {/* Month selector (hidden while filtering) */}
      {!isFiltering && (
        <MonthSelector
          year={year}
          month={month}
          onChange={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
        />
      )}

      {/* Month summary (hidden while filtering) */}
      {monthStats && monthStats.count > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-accent rounded-2xl p-3 text-center border border-accent/20 shadow-pop-accent">
            <p className="text-2xl font-black text-accent">{monthStats.count}</p>
            <p className="text-[10px] text-muted font-medium mt-0.5">作品</p>
          </div>
          <div className="bg-gradient-pink rounded-2xl p-3 text-center border border-pink/20 shadow-pop-pink">
            <p className="text-2xl font-black text-pink">
              {monthStats.totalEpisodes}
            </p>
            <p className="text-[10px] text-muted font-medium mt-0.5">話</p>
          </div>
          <div className="bg-gradient-amber rounded-2xl p-3 text-center border border-amber/20 shadow-pop-amber">
            <p className="text-2xl font-black text-amber">
              {Math.floor(monthStats.totalMinutes / 60)}h
              {monthStats.totalMinutes % 60}m
            </p>
            <p className="text-[10px] text-muted font-medium mt-0.5">視聴時間</p>
          </div>
        </div>
      )}

      {/* Filter result count */}
      {isFiltering && animeList && (
        <p className="text-xs text-muted">
          {animeList.length}件ヒット
          {tagFilter && <span className="ml-1">（#{tagFilter}）</span>}
        </p>
      )}

      {/* Anime list */}
      {!animeList ? (
        <div className="text-center text-muted py-12">読み込み中...</div>
      ) : animeList.length === 0 ? (
        <div className="text-center text-muted py-12">
          {isFiltering ? (
            <p className="text-sm">該当するアニメが見つかりませんでした</p>
          ) : (
            <>
              <svg className="mx-auto mb-3" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p className="text-sm">この月のアニメはまだありません</p>
              <p className="text-xs mt-1">「追加」からアニメを登録しましょう</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {animeList.map((anime) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              showDate={isFiltering}
            />
          ))}
        </div>
      )}
    </div>
  );
}

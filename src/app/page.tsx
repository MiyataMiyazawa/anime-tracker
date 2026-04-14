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

  const animeList = useLiveQuery(
    () => db.anime.where({ year, month }).toArray(),
    [year, month]
  );

  const monthStats = animeList
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
      <h1 className="text-2xl font-bold">Anime Tracker</h1>

      <MonthSelector
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
      />

      {/* Month summary */}
      {monthStats && monthStats.count > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <p className="text-xl font-bold text-accent">{monthStats.count}</p>
            <p className="text-[10px] text-muted">作品</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <p className="text-xl font-bold text-accent">
              {monthStats.totalEpisodes}
            </p>
            <p className="text-[10px] text-muted">話</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <p className="text-xl font-bold text-accent">
              {Math.floor(monthStats.totalMinutes / 60)}h
              {monthStats.totalMinutes % 60}m
            </p>
            <p className="text-[10px] text-muted">視聴時間</p>
          </div>
        </div>
      )}

      {/* Anime list */}
      {!animeList ? (
        <div className="text-center text-muted py-12">読み込み中...</div>
      ) : animeList.length === 0 ? (
        <div className="text-center text-muted py-12">
          <svg className="mx-auto mb-3" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <p className="text-sm">この月のアニメはまだありません</p>
          <p className="text-xs mt-1">「追加」からアニメを登録しましょう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {animeList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </div>
  );
}

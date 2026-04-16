"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, toggleEpisode, updateEpisodeMemo } from "@/lib/db";

export default function EpisodeList({ animeId }: { animeId: number }) {
  const episodes = useLiveQuery(
    () =>
      db.episodes
        .where("animeId")
        .equals(animeId)
        .sortBy("number"),
    [animeId]
  );
  const [expanded, setExpanded] = useState<number | null>(null);
  const [memoDraft, setMemoDraft] = useState<Record<number, string>>({});

  if (!episodes) {
    return <p className="text-center text-muted text-sm py-4">読み込み中...</p>;
  }

  if (episodes.length === 0) {
    return (
      <p className="text-center text-muted text-sm py-4">
        総話数が0なのでエピソードはありません
      </p>
    );
  }

  const watchedCount = episodes.filter((e) => e.watchedAt).length;

  const handleToggle = (episodeId: number) => {
    toggleEpisode(episodeId);
  };

  const handleMemoBlur = (episodeId: number, value: string) => {
    updateEpisodeMemo(episodeId, value);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">エピソード</h2>
        <p className="text-xs text-muted">
          {watchedCount} / {episodes.length} 話視聴済み
        </p>
      </div>

      <ul className="space-y-1.5">
        {episodes.map((ep) => {
          const isWatched = ep.watchedAt !== null;
          const isOpen = expanded === ep.id;
          const draft = memoDraft[ep.id] ?? ep.memo;
          const hasMemo = ep.memo.length > 0;

          return (
            <li
              key={ep.id}
              className={`rounded-lg border transition-colors ${
                isWatched
                  ? "bg-accent/5 border-accent/30"
                  : "bg-card border-border"
              }`}
            >
              <div className="flex items-center gap-2 p-2">
                <button
                  type="button"
                  onClick={() => handleToggle(ep.id)}
                  aria-label={
                    isWatched
                      ? `${ep.number}話を未視聴にする`
                      : `${ep.number}話を視聴済みにする`
                  }
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                    isWatched
                      ? "bg-brand border-transparent shadow-soft"
                      : "bg-card border-border-strong hover:border-accent"
                  }`}
                >
                  {isWatched && (
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="white"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>

                <span
                  className={`text-sm flex-1 ${
                    isWatched ? "text-foreground" : "text-muted"
                  }`}
                >
                  第{ep.number}話
                </span>

                {ep.watchedAt && (
                  <span className="text-[10px] text-muted">
                    {new Date(ep.watchedAt).toLocaleDateString("ja-JP", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : ep.id)}
                  aria-label={isOpen ? "メモを閉じる" : "メモを開く"}
                  className={`p-1 rounded-md transition-colors ${
                    hasMemo || isOpen
                      ? "text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    fill={hasMemo ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>

              {isOpen && (
                <div className="px-2 pb-2">
                  <textarea
                    value={draft}
                    onChange={(e) =>
                      setMemoDraft({ ...memoDraft, [ep.id]: e.target.value })
                    }
                    onBlur={(e) => handleMemoBlur(ep.id, e.target.value)}
                    placeholder="この話の感想・メモ..."
                    rows={2}
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-accent transition-colors resize-none"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

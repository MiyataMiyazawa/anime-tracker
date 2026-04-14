"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export default function StatsPage() {
  const allAnime = useLiveQuery(() => db.anime.toArray());

  if (!allAnime) {
    return <div className="text-center text-muted py-12">読み込み中...</div>;
  }

  const totalWatched = allAnime.filter((a) => a.status === "completed").length;
  const totalWatching = allAnime.filter((a) => a.status === "watching").length;
  const totalEpisodes = allAnime.reduce((s, a) => s + a.watchedEpisodes, 0);
  const totalMinutes = allAnime.reduce(
    (s, a) => s + a.watchedEpisodes * a.episodeDuration,
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  const avgRating =
    allAnime.filter((a) => a.rating).length > 0
      ? (
          allAnime
            .filter((a) => a.rating)
            .reduce((s, a) => s + (a.rating ?? 0), 0) /
          allAnime.filter((a) => a.rating).length
        ).toFixed(1)
      : "-";

  // Monthly breakdown
  const monthlyMap = new Map<string, { count: number; episodes: number; minutes: number }>();
  for (const a of allAnime) {
    const key = `${a.year}-${String(a.month).padStart(2, "0")}`;
    const current = monthlyMap.get(key) ?? { count: 0, episodes: 0, minutes: 0 };
    current.count++;
    current.episodes += a.watchedEpisodes;
    current.minutes += a.watchedEpisodes * a.episodeDuration;
    monthlyMap.set(key, current);
  }
  const monthlySorted = [...monthlyMap.entries()].sort((a, b) =>
    b[0].localeCompare(a[0])
  );

  const statCard = (label: string, value: string | number) => (
    <div className="bg-card rounded-xl p-4 border border-border text-center">
      <p className="text-2xl font-bold text-accent">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">統計</h1>

      {allAnime.length === 0 ? (
        <div className="text-center text-muted py-12">
          <p className="text-sm">まだデータがありません</p>
          <p className="text-xs mt-1">アニメを追加すると統計が表示されます</p>
        </div>
      ) : (
        <>
          {/* Overall stats */}
          <div className="grid grid-cols-2 gap-3">
            {statCard("完了作品", totalWatched)}
            {statCard("視聴中", totalWatching)}
            {statCard("総視聴話数", totalEpisodes)}
            {statCard(
              "総視聴時間",
              `${totalHours}h${remainingMins > 0 ? `${remainingMins}m` : ""}`
            )}
            {statCard("登録作品数", allAnime.length)}
            {statCard("平均評価", avgRating)}
          </div>

          {/* Monthly breakdown */}
          <div>
            <h2 className="text-sm font-bold mb-3 text-muted">月別サマリー</h2>
            <div className="space-y-2">
              {monthlySorted.map(([key, data]) => {
                const [y, m] = key.split("-");
                const hours = Math.floor(data.minutes / 60);
                const mins = data.minutes % 60;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between bg-card rounded-lg px-4 py-3 border border-border"
                  >
                    <span className="text-sm font-medium">
                      {y}年{Number(m)}月
                    </span>
                    <div className="flex gap-4 text-xs text-muted">
                      <span>{data.count}作品</span>
                      <span>{data.episodes}話</span>
                      <span>
                        {hours > 0 ? `${hours}h` : ""}
                        {mins > 0 ? `${mins}m` : hours > 0 ? "" : "0m"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import MonthlyChart from "@/components/MonthlyChart";

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

  // Monthly breakdown for chart
  const monthlyMap = new Map<
    string,
    { count: number; episodes: number; minutes: number }
  >();
  for (const a of allAnime) {
    const key = `${a.year}-${String(a.month).padStart(2, "0")}`;
    const current = monthlyMap.get(key) ?? {
      count: 0,
      episodes: 0,
      minutes: 0,
    };
    current.count++;
    current.episodes += a.watchedEpisodes;
    current.minutes += a.watchedEpisodes * a.episodeDuration;
    monthlyMap.set(key, current);
  }
  // 直近8か月分は必ず含める（データがない月は0埋め）
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { count: 0, episodes: 0, minutes: 0 });
    }
  }
  const chartData = [...monthlyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, data]) => {
      const [y, m] = key.split("-");
      return {
        label: `${y.slice(2)}/${m}`,
        episodes: data.episodes,
        hours: Math.round((data.minutes / 60) * 10) / 10,
        count: data.count,
      };
    });

  const statCard = (label: string, value: string | number) => (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
      <p className="label-eyebrow">{label}</p>
      <p className="text-3xl font-black text-foreground tabular-nums tracking-tight mt-1 leading-none">
        {value}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="pt-1">
        <p className="label-eyebrow">overview</p>
        <h1 className="text-3xl font-black tracking-tight mt-1">統計</h1>
      </div>

      {allAnime.length === 0 ? (
        <div className="text-center text-muted py-12">
          <p className="text-sm">まだデータがありません</p>
          <p className="text-xs mt-1">アニメを追加すると統計が表示されます</p>
        </div>
      ) : (
        <>
          {/* Featured hero — total watch time */}
          <div className="bg-hero shadow-hero rounded-3xl p-5 relative overflow-hidden">
            <p className="label-eyebrow text-white/70">total watch time</p>
            <p className="text-5xl font-black text-white tabular-nums tracking-tight mt-2 leading-none">
              {totalHours}
              <span className="text-2xl font-bold text-white/80 ml-1">h</span>
              {remainingMins > 0 && (
                <>
                  <span className="ml-2">{remainingMins}</span>
                  <span className="text-2xl font-bold text-white/80 ml-1">m</span>
                </>
              )}
            </p>
            <div className="mt-4 flex items-baseline gap-4 text-white/90">
              <div>
                <p className="text-xs font-medium text-white/60">話数</p>
                <p className="text-xl font-bold tabular-nums">{totalEpisodes}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-xs font-medium text-white/60">作品</p>
                <p className="text-xl font-bold tabular-nums">{allAnime.length}</p>
              </div>
            </div>
          </div>

          {/* Secondary stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {statCard("完了作品", totalWatched)}
            {statCard("視聴中", totalWatching)}
          </div>

          {/* Monthly charts */}
          {chartData.length > 0 && <MonthlyChart data={chartData} />}
        </>
      )}
    </div>
  );
}

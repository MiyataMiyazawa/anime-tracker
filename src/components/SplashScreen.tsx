"use client";

import { useEffect, useState } from "react";

/**
 * 起動時のスプラッシュスクリーン。
 * ロゴとアプリ名をふわっと表示し、少し見せてからフェードアウトする。
 * layout.tsx の <body> 直下に置くため、SPA 内のページ遷移では再表示されず、
 * 初回ロード（＝アプリ立ち上げ）のときだけ出る。
 */
export default function SplashScreen() {
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // モーションを抑える設定なら、待ち時間とフェードを短くする
    const holdMs = prefersReduced ? 300 : 1400;
    const fadeMs = prefersReduced ? 200 : 500;

    const fadeTimer = setTimeout(() => setLeaving(true), holdMs);
    const doneTimer = setTimeout(() => setDone(true), holdMs + fadeMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  // フェードアウト完了後は DOM から外す
  if (done) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ease-out ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(ellipse 70% 50% at 50% 32%, rgba(249, 115, 22, 0.12), transparent 60%), var(--background)",
      }}
    >
      <h1 className="splash-pop brand-text text-4xl font-bold">Anime Tracker</h1>
    </div>
  );
}

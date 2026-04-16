"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, createInitialEpisodes } from "@/lib/db";
import AnimeForm from "@/components/AnimeForm";
import type { Anime } from "@/lib/db";

export default function AddPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    data: Omit<Anime, "id" | "createdAt" | "updatedAt">
  ) => {
    setError(null);

    const existing = await db.anime
      .where("title")
      .equalsIgnoreCase(data.title)
      .first();

    if (existing) {
      setError(`「${data.title}」は既に登録されています`);
      return;
    }

    const now = new Date();
    const newId = await db.anime.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    } as Anime);

    // 初期 episodes を生成（先頭 watchedEpisodes 個を視聴済みに）
    await createInitialEpisodes(
      Number(newId),
      data.totalEpisodes,
      data.watchedEpisodes
    );

    router.push("/");
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black brand-text">アニメを追加</h1>
      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3 rounded-2xl">
          {error}
        </div>
      )}
      <AnimeForm onSubmit={handleSubmit} />
    </div>
  );
}

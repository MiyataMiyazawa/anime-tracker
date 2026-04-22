"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, createInitialEpisodes } from "@/lib/db";
import AnimeForm from "@/components/AnimeForm";
import type { Anime } from "@/lib/db";
import { useAuth } from "@/components/AuthProvider";

export default function AddPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { syncAnime } = useAuth();

  const handleSubmit = async (
    data: Omit<Anime, "id" | "createdAt" | "updatedAt">
  ) => {
    setError(null);
    setSubmitting(true);

    try {
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

      // クラウドに同期
      await syncAnime(Number(newId));

      router.push("/");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pt-1">
        <p className="label-eyebrow">new entry</p>
        <h1 className="text-3xl font-black tracking-tight mt-1">アニメを追加</h1>
      </div>
      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}
      <AnimeForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}

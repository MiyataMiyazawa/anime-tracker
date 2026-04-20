"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  db,
  syncEpisodes,
  deleteAnimeWithEpisodes,
} from "@/lib/db";
import AnimeForm from "@/components/AnimeForm";
import type { Anime } from "@/lib/db";
import { useAuth } from "@/components/AuthProvider";

export default function AnimeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const { syncAnime, deleteAnimeCloud } = useAuth();

  useEffect(() => {
    db.anime.get(Number(id)).then((a) => {
      setAnime(a ?? null);
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (
    data: Omit<Anime, "id" | "createdAt" | "updatedAt">
  ) => {
    const animeId = Number(id);
    await db.anime.update(animeId, {
      ...data,
      updatedAt: new Date(),
    });
    await syncEpisodes(animeId, data.totalEpisodes);
    // クラウドに同期
    await syncAnime(animeId);
    router.push(`/anime/${id}`);
  };

  const handleDelete = async () => {
    if (confirm("このアニメを削除しますか？（エピソード記録も全て消えます）")) {
      const animeId = Number(id);
      await deleteAnimeWithEpisodes(animeId);
      // クラウドからも削除
      await deleteAnimeCloud(animeId);
      router.push("/");
    }
  };

  if (loading) {
    return <div className="text-center text-muted py-12">読み込み中...</div>;
  }

  if (!anime) {
    return <div className="text-center text-muted py-12">見つかりませんでした</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pt-1">
        <p className="label-eyebrow">edit</p>
        <h1 className="text-3xl font-black tracking-tight mt-1 truncate">{anime.title}</h1>
      </div>
      <AnimeForm
        initial={anime}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

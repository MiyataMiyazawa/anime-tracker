"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  db,
  syncEpisodes,
  deleteAnimeWithEpisodes,
} from "@/lib/db";
import AnimeForm from "@/components/AnimeForm";
import EpisodeList from "@/components/EpisodeList";
import type { Anime } from "@/lib/db";

export default function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);

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
    // totalEpisodes が変わっていたら episodes を同期
    await syncEpisodes(animeId, data.totalEpisodes);
    router.push("/");
  };

  const handleDelete = async () => {
    if (confirm("このアニメを削除しますか？（エピソード記録も全て消えます）")) {
      await deleteAnimeWithEpisodes(Number(id));
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
      <h1 className="text-xl font-bold">アニメを編集</h1>
      <AnimeForm
        initial={anime}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
      <div className="pt-2 border-t border-border">
        <EpisodeList animeId={anime.id} />
      </div>
    </div>
  );
}

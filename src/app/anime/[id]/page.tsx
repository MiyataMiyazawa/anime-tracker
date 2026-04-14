"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import AnimeForm from "@/components/AnimeForm";
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
    await db.anime.update(Number(id), {
      ...data,
      updatedAt: new Date(),
    });
    router.push("/");
  };

  const handleDelete = async () => {
    if (confirm("このアニメを削除しますか？")) {
      await db.anime.delete(Number(id));
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
    <div className="space-y-5">
      <h1 className="text-xl font-bold">アニメを編集</h1>
      <AnimeForm
        initial={anime}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

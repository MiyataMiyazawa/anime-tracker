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
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    setSubmitting(true);
    try {
      const animeId = Number(id);
      await db.anime.update(animeId, {
        ...data,
        updatedAt: new Date(),
      });
      await syncEpisodes(animeId, data.totalEpisodes);
      // クラウドに同期
      await syncAnime(animeId);
      router.push(`/anime/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    const animeId = Number(id);
    await deleteAnimeWithEpisodes(animeId);
    // クラウドからも削除
    await deleteAnimeCloud(animeId);
    router.push("/");
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
        submitting={submitting}
      />

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 mx-4 max-w-sm w-full shadow-card space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-foreground">
              このアニメを削除しますか？（エピソード記録も全て消えます）
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 text-sm font-bold py-2.5 rounded-xl border border-border bg-card text-muted-dark hover:border-foreground/40 active:scale-[0.98] transition-all"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 text-sm font-bold py-2.5 rounded-xl bg-danger text-white hover:brightness-110 active:scale-[0.98] transition-all"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

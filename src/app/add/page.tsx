"use client";

import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import AnimeForm from "@/components/AnimeForm";
import type { Anime } from "@/lib/db";

export default function AddPage() {
  const router = useRouter();

  const handleSubmit = async (
    data: Omit<Anime, "id" | "createdAt" | "updatedAt">
  ) => {
    const now = new Date();
    await db.anime.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    } as Anime);
    router.push("/");
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">アニメを追加</h1>
      <AnimeForm onSubmit={handleSubmit} />
    </div>
  );
}

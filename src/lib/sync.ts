import {
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  collection,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "./firebase";
import { db } from "./db";
import type { Anime, Episode } from "./db";

// --- helpers ---

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/webp";
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function animeCollectionPath(uid: string) {
  return collection(firestore, "users", uid, "anime");
}

// --- upload (local → cloud) ---

export async function uploadAllToFirestore(uid: string): Promise<void> {
  const allAnime = await db.anime.toArray();
  const allEpisodes = await db.episodes.toArray();

  for (const anime of allAnime) {
    const episodes = allEpisodes
      .filter((e) => e.animeId === anime.id)
      .sort((a, b) => a.number - b.number)
      .map((e) => ({
        number: e.number,
        watchedAt: e.watchedAt ? Timestamp.fromDate(e.watchedAt) : null,
        memo: e.memo,
      }));

    let imageBase64: string | null = null;
    if (anime.imageBlob) {
      imageBase64 = await blobToBase64(anime.imageBlob);
    }

    const docRef = doc(animeCollectionPath(uid), String(anime.id));
    await setDoc(docRef, {
      title: anime.title,
      totalEpisodes: anime.totalEpisodes,
      watchedEpisodes: anime.watchedEpisodes,
      episodeDuration: anime.episodeDuration,
      year: anime.year,
      month: anime.month,
      status: anime.status,
      memo: anime.memo,
      tags: anime.tags ?? [],
      characters: anime.characters ?? [],
      imageBase64,
      episodes,
      createdAt: Timestamp.fromDate(anime.createdAt),
      updatedAt: Timestamp.fromDate(anime.updatedAt),
    });
  }
}

// --- download (cloud → local) ---

export async function downloadAllFromFirestore(uid: string): Promise<void> {
  const snapshot = await getDocs(animeCollectionPath(uid));

  // 既存データをクリアしてからリストア
  await db.transaction("rw", db.anime, db.episodes, async () => {
    await db.episodes.clear();
    await db.anime.clear();

    for (const docSnap of snapshot.docs) {
      const d = docSnap.data();

      let imageBlob: Blob | null = null;
      if (d.imageBase64) {
        imageBlob = base64ToBlob(d.imageBase64);
      }

      const animeId = await db.anime.add({
        title: d.title,
        totalEpisodes: d.totalEpisodes,
        watchedEpisodes: d.watchedEpisodes,
        episodeDuration: d.episodeDuration,
        year: d.year ?? null,
        month: d.month ?? null,
        status: d.status,
        memo: d.memo ?? "",
        tags: d.tags ?? [],
        characters: d.characters ?? [],
        imageBlob,
        createdAt: d.createdAt?.toDate?.() ?? new Date(),
        updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
      } as Anime);

      const episodes = (d.episodes ?? []) as Array<{
        number: number;
        watchedAt: Timestamp | null;
        memo: string;
      }>;

      for (const ep of episodes) {
        await db.episodes.add({
          animeId: Number(animeId),
          number: ep.number,
          watchedAt: ep.watchedAt?.toDate?.() ?? null,
          memo: ep.memo ?? "",
        } as Episode);
      }
    }
  });
}

// --- single anime sync (local → cloud) ---

export async function syncAnimeToFirestore(
  uid: string,
  animeId: number
): Promise<void> {
  const anime = await db.anime.get(animeId);
  if (!anime) return;

  const episodes = await db.episodes
    .where("animeId")
    .equals(animeId)
    .sortBy("number");

  let imageBase64: string | null = null;
  if (anime.imageBlob) {
    imageBase64 = await blobToBase64(anime.imageBlob);
  }

  const docRef = doc(animeCollectionPath(uid), String(animeId));
  await setDoc(docRef, {
    title: anime.title,
    totalEpisodes: anime.totalEpisodes,
    watchedEpisodes: anime.watchedEpisodes,
    episodeDuration: anime.episodeDuration,
    year: anime.year,
    month: anime.month,
    status: anime.status,
    memo: anime.memo,
    tags: anime.tags ?? [],
    characters: anime.characters ?? [],
    imageBase64,
    episodes: episodes.map((e) => ({
      number: e.number,
      watchedAt: e.watchedAt ? Timestamp.fromDate(e.watchedAt) : null,
      memo: e.memo,
    })),
    createdAt: Timestamp.fromDate(anime.createdAt),
    updatedAt: Timestamp.fromDate(anime.updatedAt),
  });
}

// --- delete from cloud ---

export async function deleteAnimeFromFirestore(
  uid: string,
  animeId: number
): Promise<void> {
  const docRef = doc(animeCollectionPath(uid), String(animeId));
  await deleteDoc(docRef);
}

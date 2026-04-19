import Dexie, { type EntityTable } from "dexie";

export interface Anime {
  id: number;
  title: string;
  totalEpisodes: number;
  watchedEpisodes: number;
  episodeDuration: number; // minutes per episode
  year: number | null;
  month: number | null; // 1-12, null = 時期不明
  status: "watching" | "completed" | "dropped" | "planned";
  rating: number | null; // 1-10
  memo: string;
  tags: string[];
  characters: { name: string; description: string }[];
  imageBlob: Blob | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Episode {
  id: number;
  animeId: number;
  number: number; // 1-based
  watchedAt: Date | null;
  memo: string;
}

const db = new Dexie("AnimeTrackerDB") as Dexie & {
  anime: EntityTable<Anime, "id">;
  episodes: EntityTable<Episode, "id">;
};

db.version(1).stores({
  anime: "++id, title, year, month, status, [year+month]",
});

db.version(2).stores({
  anime: "++id, &title, year, month, status, [year+month]",
});

// v3: multi-entry index on tags + backfill empty tags[] for legacy rows
db.version(3)
  .stores({
    anime: "++id, &title, year, month, status, [year+month], *tags",
  })
  .upgrade(async (tx) => {
    await tx
      .table<Anime>("anime")
      .toCollection()
      .modify((a) => {
        if (!Array.isArray(a.tags)) {
          a.tags = [];
        }
      });
  });

// v4: episodes table を追加。既存 anime から episode レコードをseed
db.version(4)
  .stores({
    anime: "++id, &title, year, month, status, [year+month], *tags",
    episodes: "++id, animeId, [animeId+number]",
  })
  .upgrade(async (tx) => {
    const animes = await tx.table<Anime>("anime").toArray();
    const episodesTable = tx.table<Omit<Episode, "id">>("episodes");
    for (const a of animes) {
      const seedAt = a.updatedAt ?? a.createdAt ?? new Date();
      for (let n = 1; n <= a.totalEpisodes; n++) {
        await episodesTable.add({
          animeId: a.id,
          number: n,
          watchedAt: n <= a.watchedEpisodes ? seedAt : null,
          memo: "",
        });
      }
    }
  });

// v5: characters フィールド追加。既存レコードに空配列をバックフィル
db.version(5)
  .stores({
    anime: "++id, &title, year, month, status, [year+month], *tags",
    episodes: "++id, animeId, [animeId+number]",
  })
  .upgrade(async (tx) => {
    await tx
      .table<Anime>("anime")
      .toCollection()
      .modify((a) => {
        if (!Array.isArray(a.characters)) {
          a.characters = [];
        }
      });
  });

// --- helpers ---

// animeId の episodes 数から watchedEpisodes を再計算してキャッシュ更新
async function recomputeWatchedCount(animeId: number) {
  const count = await db.episodes
    .where("animeId")
    .equals(animeId)
    .and((e) => e.watchedAt != null)
    .count();
  await db.anime.update(animeId, {
    watchedEpisodes: count,
    updatedAt: new Date(),
  });
}

// チェックボックストグル: watchedAt をトグル + anime の watchedEpisodes を再計算
export async function toggleEpisode(episodeId: number) {
  await db.transaction("rw", db.anime, db.episodes, async () => {
    const ep = await db.episodes.get(episodeId);
    if (!ep) return;
    await db.episodes.update(episodeId, {
      watchedAt: ep.watchedAt ? null : new Date(),
    });
    await recomputeWatchedCount(ep.animeId);
  });
}

// エピソードのメモ更新
export async function updateEpisodeMemo(episodeId: number, memo: string) {
  await db.episodes.update(episodeId, { memo });
}

// totalEpisodes 変動時に episodes の不足分を追加 / 超過分を削除
export async function syncEpisodes(animeId: number, totalEpisodes: number) {
  await db.transaction("rw", db.anime, db.episodes, async () => {
    const existing = await db.episodes
      .where("animeId")
      .equals(animeId)
      .toArray();
    const maxExisting = existing.length
      ? Math.max(...existing.map((e) => e.number))
      : 0;
    for (let n = maxExisting + 1; n <= totalEpisodes; n++) {
      await db.episodes.add({
        animeId,
        number: n,
        watchedAt: null,
        memo: "",
      } as Episode);
    }
    const toRemove = existing.filter((e) => e.number > totalEpisodes);
    if (toRemove.length > 0) {
      await db.episodes.bulkDelete(toRemove.map((e) => e.id));
    }
    await recomputeWatchedCount(animeId);
  });
}

// 新規アニメ作成時: episodes を 1..totalEpisodes で生成、先頭 watchedCount 個は視聴済み
export async function createInitialEpisodes(
  animeId: number,
  totalEpisodes: number,
  watchedCount: number
) {
  const now = new Date();
  const records: Omit<Episode, "id">[] = [];
  for (let n = 1; n <= totalEpisodes; n++) {
    records.push({
      animeId,
      number: n,
      watchedAt: n <= watchedCount ? now : null,
      memo: "",
    });
  }
  if (records.length > 0) {
    await db.episodes.bulkAdd(records as Episode[]);
  }
}

// 次の未視聴エピソードを視聴済みにする（スワイプ +1 用）
export async function markNextEpisodeWatched(animeId: number): Promise<boolean> {
  return db.transaction("rw", db.anime, db.episodes, async () => {
    const anime = await db.anime.get(animeId);
    if (!anime || anime.watchedEpisodes >= anime.totalEpisodes) return false;

    const episodes = await db.episodes
      .where("animeId")
      .equals(animeId)
      .sortBy("number");

    const next = episodes.find((e) => e.watchedAt == null);
    if (!next) return false;

    await db.episodes.update(next.id, { watchedAt: new Date() });
    await recomputeWatchedCount(animeId);

    // 全話視聴済みになったら自動で「完了」に
    const updated = await db.anime.get(animeId);
    if (updated && updated.watchedEpisodes >= updated.totalEpisodes && updated.status === "watching") {
      await db.anime.update(animeId, { status: "completed" });
    }
    return true;
  });
}

// 最後に視聴したエピソードを未視聴に戻す（スワイプ -1 用）
export async function unmarkLastEpisodeWatched(animeId: number): Promise<boolean> {
  return db.transaction("rw", db.anime, db.episodes, async () => {
    const anime = await db.anime.get(animeId);
    if (!anime || anime.watchedEpisodes <= 0) return false;

    const episodes = await db.episodes
      .where("animeId")
      .equals(animeId)
      .sortBy("number");

    const lastWatched = [...episodes].reverse().find((e) => e.watchedAt != null);
    if (!lastWatched) return false;

    await db.episodes.update(lastWatched.id, { watchedAt: null });
    await recomputeWatchedCount(animeId);

    // 完了状態から-1したら自動で「視聴中」に
    if (anime.status === "completed") {
      await db.anime.update(animeId, { status: "watching" });
    }
    return true;
  });
}

// アニメ削除時の episode 削除
export async function deleteAnimeWithEpisodes(animeId: number) {
  await db.transaction("rw", db.anime, db.episodes, async () => {
    await db.episodes.where("animeId").equals(animeId).delete();
    await db.anime.delete(animeId);
  });
}

export { db };

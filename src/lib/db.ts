import Dexie, { type EntityTable } from "dexie";

export interface Anime {
  id: number;
  title: string;
  totalEpisodes: number;
  watchedEpisodes: number;
  episodeDuration: number; // minutes per episode
  year: number;
  month: number; // 1-12
  status: "watching" | "completed" | "dropped" | "planned";
  rating: number | null; // 1-10
  memo: string;
  tags: string[];
  imageBlob: Blob | null;
  createdAt: Date;
  updatedAt: Date;
}

const db = new Dexie("AnimeTrackerDB") as Dexie & {
  anime: EntityTable<Anime, "id">;
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

export { db };

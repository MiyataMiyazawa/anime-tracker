"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  uploadAllToFirestore,
  downloadAllFromFirestore,
  syncAnimeToFirestore,
  deleteAnimeFromFirestore,
} from "@/lib/sync";
import { db } from "@/lib/db";
import { getDocs, collection } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  syncStatus: SyncStatus;
  logout: () => Promise<void>;
  syncAnime: (animeId: number) => Promise<void>;
  deleteAnimeCloud: (animeId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  syncStatus: "idle",
  logout: async () => {},
  syncAnime: async () => {},
  deleteAnimeCloud: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // 初回ログイン時の同期
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      if (u && !initialSyncDone) {
        setSyncStatus("syncing");
        try {
          // クラウドにデータがあるか確認
          const cloudSnap = await getDocs(
            collection(firestore, "users", u.uid, "anime")
          );
          const localCount = await db.anime.count();

          if (cloudSnap.size === 0 && localCount > 0) {
            // クラウドが空 → ローカルをアップロード
            await uploadAllToFirestore(u.uid);
          } else if (cloudSnap.size > 0 && localCount === 0) {
            // ローカルが空 → クラウドからダウンロード
            await downloadAllFromFirestore(u.uid);
          } else if (cloudSnap.size > 0 && localCount > 0) {
            // 両方にデータがある → クラウドで上書き（最新のバックアップを優先）
            await downloadAllFromFirestore(u.uid);
          }
          // 両方空の場合は何もしない

          setSyncStatus("synced");
          setInitialSyncDone(true);
        } catch (e) {
          console.error("Sync failed:", e);
          setSyncStatus("error");
        }
      }
    });
    return unsubscribe;
  }, [initialSyncDone]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setInitialSyncDone(false);
    setSyncStatus("idle");
  }, []);

  const syncAnime = useCallback(
    async (animeId: number) => {
      if (!user) return;
      try {
        await syncAnimeToFirestore(user.uid, animeId);
      } catch (e) {
        console.error("Sync anime failed:", e);
      }
    },
    [user]
  );

  const deleteAnimeCloud = useCallback(
    async (animeId: number) => {
      if (!user) return;
      try {
        await deleteAnimeFromFirestore(user.uid, animeId);
      } catch (e) {
        console.error("Delete anime from cloud failed:", e);
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, syncStatus, logout, syncAnime, deleteAnimeCloud }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

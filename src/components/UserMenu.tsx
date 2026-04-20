"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

export default function UserMenu() {
  const { user, loading, syncStatus, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Login failed:", e);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        disabled={busy}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card text-muted-dark hover:border-accent/50 hover:text-foreground active:scale-95 transition-all disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
        </svg>
        ログイン
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Sync status indicator */}
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          syncStatus === "synced"
            ? "bg-green-500"
            : syncStatus === "syncing"
              ? "bg-yellow-500 animate-pulse"
              : syncStatus === "error"
                ? "bg-red-500"
                : "bg-gray-400"
        }`}
        title={
          syncStatus === "synced"
            ? "同期済み"
            : syncStatus === "syncing"
              ? "同期中..."
              : syncStatus === "error"
                ? "同期エラー"
                : ""
        }
      />
      <button
        onClick={logout}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card text-muted-dark hover:border-accent/50 hover:text-foreground active:scale-95 transition-all"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            className="w-4 h-4 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
          </svg>
        )}
        ログアウト
      </button>
    </div>
  );
}

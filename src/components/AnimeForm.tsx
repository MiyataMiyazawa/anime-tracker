"use client";

import { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Anime } from "@/lib/db";

type AnimeFormData = Omit<Anime, "id" | "createdAt" | "updatedAt">;

interface AnimeFormProps {
  initial?: Anime;
  onSubmit: (data: AnimeFormData) => void;
  onDelete?: () => void;
}

// 数値入力で先頭ゼロ等が残らないよう正規化する（空文字は空文字のまま保持）
const normalizeNumStr = (s: string) => {
  if (s === "") return "";
  // 数値として解釈できない場合（全角・ハイフンのみなど）は入力途中なのでそのまま返す
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return String(n);
};

export default function AnimeForm({ initial, onSubmit, onDelete }: AnimeFormProps) {
  const now = new Date();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [totalEpisodes, setTotalEpisodes] = useState(
    String(initial?.totalEpisodes ?? 12)
  );
  const [watchedEpisodes, setWatchedEpisodes] = useState(
    String(initial?.watchedEpisodes ?? 0)
  );
  const [episodeDuration, setEpisodeDuration] = useState(
    String(initial?.episodeDuration ?? 24)
  );
  const [year, setYear] = useState(String(initial?.year ?? now.getFullYear()));
  const [month, setMonth] = useState(initial?.month ?? now.getMonth() + 1);
  const [status, setStatus] = useState<Anime["status"]>(initial?.status ?? "watching");
  const [rating, setRating] = useState<string>(
    initial?.rating != null ? String(initial.rating) : ""
  );
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [imageBlob, setImageBlob] = useState<Blob | null>(initial?.imageBlob ?? null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 既存の全タグを候補として取得（頻度順）
  const allTags = useLiveQuery(async () => {
    const all = await db.anime.toArray();
    const freq = new Map<string, number>();
    for (const a of all) {
      for (const t of a.tags ?? []) {
        freq.set(t, (freq.get(t) ?? 0) + 1);
      }
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
  }, []);

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  const suggestions = (allTags ?? []).filter((t) => !tags.includes(t)).slice(0, 8);

  useEffect(() => {
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageBlob]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const canvas = document.createElement("canvas");
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const maxSize = 400;
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) setImageBlob(blob);
          URL.revokeObjectURL(url);
        },
        "image/webp",
        0.8
      );
    };
    img.src = url;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const totalEp = Number(totalEpisodes) || 0;
    const watchedEp = Math.min(Number(watchedEpisodes) || 0, totalEp);

    onSubmit({
      title: title.trim(),
      totalEpisodes: totalEp,
      watchedEpisodes: watchedEp,
      episodeDuration: Number(episodeDuration) || 0,
      year: Number(year) || now.getFullYear(),
      month,
      status,
      rating: rating === "" ? null : Number(rating),
      memo,
      tags,
      imageBlob,
    });
  };

  const inputClass =
    "w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm shadow-card focus:outline-none focus:border-accent focus:shadow-card-hover transition-all";
  const labelClass = "label-eyebrow block mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-44 bg-card border-2 border-border border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:border-accent hover:bg-accent-tint transition-all overflow-hidden shadow-card"
      >
        {imagePreview ? (
          <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-muted">
            <svg className="mx-auto mb-2" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="text-xs">タップして画像を追加</p>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImage}
        className="hidden"
      />

      {/* Title */}
      <div>
        <label className={labelClass}>タイトル *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="アニメのタイトル"
          className={inputClass}
          required
        />
      </div>

      {/* Year & Month */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>年</label>
          <input
            type="number"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(normalizeNumStr(e.target.value))}
            onFocus={(e) => e.target.select()}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>月</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={inputClass}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}月
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Episodes */}
      <div className={initial ? "" : "grid grid-cols-2 gap-3"}>
        <div>
          <label className={labelClass}>総話数</label>
          <input
            type="number"
            inputMode="numeric"
            value={totalEpisodes}
            onChange={(e) => setTotalEpisodes(normalizeNumStr(e.target.value))}
            onFocus={(e) => e.target.select()}
            min={0}
            className={inputClass}
          />
        </div>
        {!initial && (
          <div>
            <label className={labelClass}>視聴済み話数</label>
            <input
              type="number"
              inputMode="numeric"
              value={watchedEpisodes}
              onChange={(e) => setWatchedEpisodes(normalizeNumStr(e.target.value))}
              onFocus={(e) => e.target.select()}
              min={0}
              max={Number(totalEpisodes) || 0}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Episode Duration */}
      <div>
        <label className={labelClass}>1話あたりの時間（分）</label>
        <input
          type="number"
          inputMode="numeric"
          value={episodeDuration}
          onChange={(e) => setEpisodeDuration(normalizeNumStr(e.target.value))}
          onFocus={(e) => e.target.select()}
          min={1}
          className={inputClass}
        />
      </div>

      {/* Status */}
      <div>
        <label className={labelClass}>ステータス</label>
        <div className="grid grid-cols-4 gap-2">
          {(["watching", "completed", "dropped", "planned"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`text-xs font-bold py-2.5 rounded-xl border transition-all active:scale-95 ${
                status === s
                  ? "border-foreground bg-foreground text-card shadow-soft"
                  : "border-border bg-card text-muted-dark hover:border-foreground/40"
              }`}
            >
              {{ watching: "視聴中", completed: "完了", dropped: "中断", planned: "予定" }[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className={labelClass}>評価（1〜10）</label>
        <input
          type="number"
          inputMode="numeric"
          value={rating}
          onChange={(e) => setRating(normalizeNumStr(e.target.value))}
          onFocus={(e) => e.target.select()}
          min={1}
          max={10}
          placeholder="未評価"
          className={inputClass}
        />
      </div>

      {/* Memo */}
      <div>
        <label className={labelClass}>メモ</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="感想やメモ..."
          rows={3}
          className={inputClass + " resize-none"}
        />
      </div>

      {/* Tags */}
      <div>
        <label className={labelClass}>タグ</label>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 bg-accent-tint text-accent-dark text-xs font-medium px-2.5 py-1 rounded-full border border-accent/20"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  aria-label={`${t} を削除`}
                  className="hover:text-danger"
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(tagInput);
            }
          }}
          onBlur={() => {
            if (tagInput.trim()) addTag(tagInput);
          }}
          placeholder="タグを入力してEnter（例: SF, 2024春, おすすめ）"
          className={inputClass}
        />
        {suggestions.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] text-muted mb-1">既存タグから追加</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full border border-border bg-card text-muted hover:border-accent hover:text-accent active:scale-95 transition-all"
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-brand text-white font-bold py-3.5 rounded-xl shadow-hero hover:brightness-110 active:scale-[0.98] transition-all tracking-tight"
      >
        {initial ? "更新する" : "追加する"}
      </button>

      {/* Delete */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full border border-border text-danger hover:bg-danger/5 hover:border-danger/30 font-semibold py-3 rounded-xl active:scale-[0.98] transition-all"
        >
          削除する
        </button>
      )}
    </form>
  );
}

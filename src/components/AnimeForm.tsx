"use client";

import { useState, useRef, useEffect } from "react";
import type { Anime } from "@/lib/db";

type AnimeFormData = Omit<Anime, "id" | "createdAt" | "updatedAt">;

interface AnimeFormProps {
  initial?: Anime;
  onSubmit: (data: AnimeFormData) => void;
  onDelete?: () => void;
}

export default function AnimeForm({ initial, onSubmit, onDelete }: AnimeFormProps) {
  const now = new Date();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [totalEpisodes, setTotalEpisodes] = useState(initial?.totalEpisodes ?? 12);
  const [watchedEpisodes, setWatchedEpisodes] = useState(initial?.watchedEpisodes ?? 0);
  const [episodeDuration, setEpisodeDuration] = useState(initial?.episodeDuration ?? 24);
  const [year, setYear] = useState(initial?.year ?? now.getFullYear());
  const [month, setMonth] = useState(initial?.month ?? now.getMonth() + 1);
  const [status, setStatus] = useState<Anime["status"]>(initial?.status ?? "watching");
  const [rating, setRating] = useState<number | "">(initial?.rating ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [imageBlob, setImageBlob] = useState<Blob | null>(initial?.imageBlob ?? null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    onSubmit({
      title: title.trim(),
      totalEpisodes,
      watchedEpisodes,
      episodeDuration,
      year,
      month,
      status,
      rating: rating === "" ? null : Number(rating),
      memo,
      imageBlob,
    });
  };

  const inputClass =
    "w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors";
  const labelClass = "block text-xs text-muted mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-40 bg-card border border-border border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors overflow-hidden"
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
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>総話数</label>
          <input
            type="number"
            value={totalEpisodes}
            onChange={(e) => setTotalEpisodes(Number(e.target.value))}
            min={0}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>視聴済み話数</label>
          <input
            type="number"
            value={watchedEpisodes}
            onChange={(e) => setWatchedEpisodes(Number(e.target.value))}
            min={0}
            max={totalEpisodes}
            className={inputClass}
          />
        </div>
      </div>

      {/* Episode Duration */}
      <div>
        <label className={labelClass}>1話あたりの時間（分）</label>
        <input
          type="number"
          value={episodeDuration}
          onChange={(e) => setEpisodeDuration(Number(e.target.value))}
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
              className={`text-xs py-2 rounded-lg border transition-colors ${
                status === s
                  ? "border-accent bg-accent/20 text-accent-light"
                  : "border-border text-muted hover:border-accent/30"
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
          value={rating}
          onChange={(e) => setRating(e.target.value === "" ? "" : Number(e.target.value))}
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

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-3 rounded-xl transition-colors"
      >
        {initial ? "更新する" : "追加する"}
      </button>

      {/* Delete */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full border border-danger text-danger hover:bg-danger/10 font-medium py-3 rounded-xl transition-colors"
        >
          削除する
        </button>
      )}
    </form>
  );
}

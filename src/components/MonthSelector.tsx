"use client";

import { useState, useRef, useEffect } from "react";

const monthNames = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export default function MonthSelector({ year, month, onChange }: MonthSelectorProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  // 過去3年 〜 今年
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 3 + i);

  const prev = () => {
    if (month === 1) {
      onChange(year - 1, 12);
    } else {
      onChange(year, month - 1);
    }
  };

  const next = () => {
    if (month === 12) {
      onChange(year + 1, 1);
    } else {
      onChange(year, month + 1);
    }
  };

  const pick = (y: number, m: number) => {
    onChange(y, m);
    setOpen(false);
  };

  // 開いたとき選択中の月までスクロール
  useEffect(() => {
    if (open && selectedRef.current && panelRef.current) {
      selectedRef.current.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [open]);

  // 外側タップで閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-2 py-1.5 shadow-card">
        <button
          onClick={prev}
          aria-label="前の月"
          className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-dark hover:text-accent hover:bg-card-hover active:scale-90 transition-all"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="text-base font-bold tracking-tight tabular-nums hover:text-accent active:scale-95 transition-all px-3 py-1 rounded-lg"
        >
          {year}年 {monthNames[month - 1]}
          <svg
            className={`inline-block ml-1.5 transition-transform ${open ? "rotate-180" : ""}`}
            width="12"
            height="12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={next}
          aria-label="次の月"
          className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-dark hover:text-accent hover:bg-card-hover active:scale-90 transition-all"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Month picker panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-2xl shadow-card-hover z-20 p-3 max-h-72 overflow-y-auto"
        >
          {years.map((y) => (
            <div key={y} className="mb-3 last:mb-0">
              <p className="label-eyebrow mb-1.5">{y}年</p>
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 12 }, (_, i) => {
                  const m = i + 1;
                  const isSelected = y === year && m === month;
                  return (
                    <button
                      key={m}
                      ref={isSelected ? selectedRef : undefined}
                      type="button"
                      onClick={() => pick(y, m)}
                      className={`text-xs font-medium py-2 rounded-xl border transition-all active:scale-95 ${
                        isSelected
                          ? "border-accent bg-accent text-white shadow-soft"
                          : "border-border bg-card text-muted-dark hover:border-accent/50 hover:text-foreground"
                      }`}
                    >
                      {m}月
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

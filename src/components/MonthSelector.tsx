"use client";

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

  return (
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
      <h2 className="text-base font-bold tracking-tight tabular-nums">
        {year}年 {monthNames[month - 1]}
      </h2>
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
  );
}
